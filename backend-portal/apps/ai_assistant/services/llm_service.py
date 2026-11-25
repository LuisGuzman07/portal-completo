import os
from django.conf import settings


class LLMService:
    """
    Capa de abstracción desacoplada para generación de texto con IA.
    Permite alternar entre Google Gemini (Developer API o Vertex AI) y fallback local.
    """

    @classmethod
    def generate_content(cls, prompt: str, system_instruction: str = None) -> str:
        provider = getattr(settings, 'LLM_PROVIDER', 'ollama')
        groq_api_key = getattr(settings, 'GROQ_API_KEY', '') or os.getenv('GROQ_API_KEY', '')

        # 1. Modo Groq Cloud (API 100% gratuita, respuesta en <1s)
        if provider == 'groq' or (groq_api_key and provider != 'ollama'):
            try:
                import requests
                messages = []
                if system_instruction:
                    messages.append({'role': 'system', 'content': system_instruction})
                messages.append({'role': 'user', 'content': prompt})

                resp = requests.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    headers={
                        'Authorization': f'Bearer {groq_api_key}',
                        'Content-Type': 'application/json',
                    },
                    json={
                        'model': getattr(settings, 'GROQ_MODEL', 'llama-3.3-70b-versatile'),
                        'messages': messages,
                        'temperature': 0.2,
                        'max_tokens': 1024,
                    },
                    timeout=30,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data['choices'][0]['message']['content'].strip()
                    if content:
                        return content
                else:
                    print(f'[AI Assistant] Error Groq API ({resp.status_code}): {resp.text}')
            except Exception as e:
                print(f'[AI Assistant] Error conectando a Groq: {e}')

        # 2. Modo Ollama Local (100% privado y offline)
        if provider == 'ollama':
            base_url = getattr(settings, 'OLLAMA_BASE_URL', 'http://ollama:11434').rstrip('/')
            model_name = getattr(settings, 'OLLAMA_MODEL', 'llama3.2:3b')
            try:
                import requests
                full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
                headers = {'ngrok-skip-browser-warning': 'true', 'User-Agent': 'ABOCCRIM-AI'}
                resp = requests.post(
                    f"{base_url}/api/generate",
                    headers=headers,
                    json={
                        "model": model_name,
                        "prompt": full_prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.3,
                            "top_p": 0.85,
                            "num_predict": 600,
                            "num_ctx": 4096,
                        }
                    },
                    timeout=180
                )
                if resp.status_code == 200:
                    result = resp.json().get('response', '').strip()
                    if result:
                        return result
            except Exception as e:
                print(f'[AI Assistant] Error al invocar Ollama: {e}. Activando generador de contingencia.')

        # 3. Modo Google Gemini Developer API
        api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
        if provider == 'gemini_api':
            if not api_key:
                err_msg = "[Configuración] LLM_PROVIDER='gemini_api' pero no se encontró GEMINI_API_KEY en el entorno (.env)."
                print(f"[AI Assistant] {err_msg}")
                return err_msg

            try:
                import warnings
                warnings.filterwarnings('ignore', category=FutureWarning)
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                raw_model = getattr(settings, 'GENERATIVE_MODEL', 'gemini-3.8-flash')
                # Mapear modelos legacy a gemini-3.8-flash para compatibilidad con nuevas claves AQ.
                if raw_model in ('gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash', 'gemini-flash-latest'):
                    model_name = 'gemini-3.8-flash'
                else:
                    model_name = raw_model

                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=system_instruction,
                    generation_config={
                        'temperature': 0.3,
                        'top_p': 0.85,
                        'max_output_tokens': 2048,
                    }
                )
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                err_msg = f"[Error Gemini API] No se pudo generar respuesta: {str(e)}"
                print(f"[AI Assistant] {err_msg}")
                return err_msg

        # 4. Modo Simulación / Contingencia sin conexión
        return cls._generate_fallback_response(prompt)

    @classmethod
    def _generate_fallback_response(cls, prompt: str) -> str:
        """
        Respuesta clara de contingencia cuando ningún proveedor de IA está activo o conectado.
        """
        return (
            "No se pudo contactar con el proveedor de inteligencia artificial configurado. "
            "Por favor verifica la configuración de LLM_PROVIDER y GEMINI_API_KEY en el archivo .env."
        )
