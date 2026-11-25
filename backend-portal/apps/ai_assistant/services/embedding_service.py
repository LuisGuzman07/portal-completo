import os
import math
import hashlib
from django.conf import settings


def _generate_mock_embedding(text: str, dim: int = 768) -> list[float]:
    """
    Genera un embedding sintético determinista normalizado de 768 dimensiones
    para entornos de desarrollo donde aún no se ha configurado GEMINI_API_KEY.
    Permite probar todo el pipeline RAG y la interfaz sin bloqueos.
    """
    cleaned = text.lower().strip()
    words = cleaned.split()
    vector = [0.0] * dim

    for i, word in enumerate(words):
        # Dispersar componentes según hash de palabras
        h = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
        idx = h % dim
        vector[idx] += 1.0 / (1.0 + (i * 0.05))

    # Normalizar L2 para permitir similitud coseno directa
    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 0:
        vector = [v / norm for v in vector]
    else:
        vector[0] = 1.0

    return vector


_api_disabled = False


def _get_ollama_embedding(text: str) -> list[float] | None:
    """Obtiene embeddings de 768 dimensiones desde el contenedor Ollama local."""
    base_url = getattr(settings, 'OLLAMA_BASE_URL', 'http://ollama:11434').rstrip('/')
    model = getattr(settings, 'OLLAMA_EMBED_MODEL', 'nomic-embed-text')
    try:
        import requests
        headers = {'ngrok-skip-browser-warning': 'true', 'User-Agent': 'ABOCCRIM-AI'}
        resp = requests.post(
            f"{base_url}/api/embeddings",
            headers=headers,
            json={"model": model, "prompt": text},
            timeout=60,
        )
        if resp.status_code == 200:
            data = resp.json()
            emb = data.get('embedding', [])
            if emb and len(emb) == 768:
                norm = math.sqrt(sum(v * v for v in emb))
                return [v / norm for v in emb] if norm > 0 else emb
    except Exception as e:
        print(f'[AI Assistant] Ollama no disponible para embeddings: {e}. Usando fallback local.')
    return None


def get_text_embedding(text: str) -> list[float]:
    """
    Genera la representación vectorial (768 dimensiones) para un texto
    utilizando Ollama local, Google Gemini o fallback determinista.
    """
    global _api_disabled
    if not text or not text.strip():
        return [0.0] * 768

    provider = getattr(settings, 'LLM_PROVIDER', 'ollama')

    # 1. Modo Ollama Local
    if provider == 'ollama':
        emb = _get_ollama_embedding(text)
        if emb:
            return emb

    # 2. Modo Google Gemini API
    elif provider == 'gemini_api':
        api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
        if api_key and not _api_disabled:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                raw_model = getattr(settings, 'EMBEDDING_MODEL', 'gemini-embedding-001')
                if raw_model in ('text-embedding-004', 'models/text-embedding-004'):
                    model_name = 'models/gemini-embedding-001'
                else:
                    model_name = raw_model if raw_model.startswith('models/') else f'models/{raw_model}'

                kwargs = {'model': model_name, 'content': text}
                if 'gemini-embedding' in model_name:
                    kwargs['output_dimensionality'] = 768
                else:
                    kwargs['task_type'] = 'retrieval_document'

                result = genai.embed_content(**kwargs)
                embedding = result.get('embedding', [])
                if embedding and len(embedding) == 768:
                    return embedding
            except Exception as e:
                print(f'[AI Assistant] Error al consumir API de embeddings de Gemini: {e}. Activando fallback local.')
                _api_disabled = True

    # 3. Fallback determinista para contingencia
    return _generate_mock_embedding(text, dim=768)


def get_query_embedding(query: str) -> list[float]:
    """
    Genera el embedding optimizado para una consulta de búsqueda (retrieval_query).
    """
    global _api_disabled
    if not query or not query.strip():
        return [0.0] * 768

    provider = getattr(settings, 'LLM_PROVIDER', 'ollama')

    # 1. Modo Ollama Local
    if provider == 'ollama':
        emb = _get_ollama_embedding(query)
        if emb:
            return emb

    # 2. Modo Google Gemini API
    elif provider == 'gemini_api':
        api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
        if api_key and not _api_disabled:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                raw_model = getattr(settings, 'EMBEDDING_MODEL', 'gemini-embedding-001')
                if raw_model in ('text-embedding-004', 'models/text-embedding-004'):
                    model_name = 'models/gemini-embedding-001'
                else:
                    model_name = raw_model if raw_model.startswith('models/') else f'models/{raw_model}'

                kwargs = {'model': model_name, 'content': query}
                if 'gemini-embedding' in model_name:
                    kwargs['output_dimensionality'] = 768
                else:
                    kwargs['task_type'] = 'retrieval_query'

                result = genai.embed_content(**kwargs)
                embedding = result.get('embedding', [])
                if embedding and len(embedding) == 768:
                    return embedding
            except Exception as e:
                print(f'[AI Assistant] Error al generar embedding de consulta: {e}')
                _api_disabled = True

    return _generate_mock_embedding(query, dim=768)
