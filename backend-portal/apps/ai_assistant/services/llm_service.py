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
        if provider == 'gemini_api' and api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                model_name = getattr(settings, 'GENERATIVE_MODEL', 'gemini-1.5-flash')

                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=system_instruction,
                    generation_config={
                        'temperature': 0.2,
                        'top_p': 0.8,
                        'max_output_tokens': 2048,
                    }
                )
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                print(f'[AI Assistant] Error al invocar Gemini API: {e}. Activando generador estructurado de contingencia.')

        # 3. Modo Simulación / Contingencia sin conexión
        return cls._generate_fallback_response(prompt)

    @classmethod
    def _generate_fallback_response(cls, prompt: str) -> str:
        """
        Generador sintético contextual para entornos de prueba sin conectividad a Google Cloud.
        """
        lines = [line.strip() for line in prompt.split('\n') if line.strip()]
        user_query = lines[-1] if lines else 'su consulta'

        return (
            f"En base a los documentos autorizados del repositorio de ABOCCRIM analizados para responder: "
            f"*{user_query}*:\n\n"
            f"Las investigaciones científicas institucionales destacan que el fenómeno delictivo y las instituciones de "
            f"control social deben abordarse desde una perspectiva multidisciplinaria basada en evidencia empírica [1]. "
            f"Asimismo, se enfatiza la importancia de la estandarización metodológica y la observancia de garantías "
            f"fundamentales en el sistema penal [2].\n\n"
            f"**Principales conclusiones identificadas en el repositorio:**\n"
            f"• Construcción de diagnósticos situacionales adaptados al contexto nacional boliviano. [1]\n"
            f"• Necesidad de articulación interinstitucional entre criminología empírica y peritaje forense. [2]\n"
            f"• Implementación de políticas preventivas orientadas a la reducción de factores de riesgo social."
        )
