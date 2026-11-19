import io
import re
from pathlib import Path
from typing import Union
from django.conf import settings


def clean_text(text: str) -> str:
    """Normaliza espacios y saltos de línea sin perder la estructura semántica."""
    if not text:
        return ''
    # Reemplazar múltiples saltos de línea o espacios redundantes
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def extract_pages_from_pdf(source: Union[str, Path, bytes, bytearray, io.BytesIO]) -> list[dict]:
    """
    Extrae el texto de un PDF página por página utilizando PyMuPDF (fitz) o pypdf.
    Soporta rutas en disco (str, Path) o flujos en memoria / bytes (ideal para MinIO/S3/GCP).
    Retorna una lista de diccionarios:
    [{ 'numero_pagina': 1, 'texto': '...' }, ...]
    """
    is_bytes = isinstance(source, (bytes, bytearray, io.BytesIO))
    path = None
    if not is_bytes:
        path = Path(source)
        if not path.is_file():
            raise FileNotFoundError(f'El archivo PDF no fue encontrado en: {path}')

    pages = []
    try:
        import pymupdf as fitz
        if is_bytes:
            stream_data = source.getvalue() if isinstance(source, io.BytesIO) else bytes(source)
            doc = fitz.open(stream=stream_data, filetype='pdf')
        else:
            doc = fitz.open(str(path))

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = clean_text(page.get_text('text'))
            if text:
                pages.append({
                    'numero_pagina': page_num + 1,
                    'texto': text,
                })
        doc.close()
    except ImportError:
        # Fallback a pypdf si PyMuPDF aún no estuviese instalado
        try:
            import pypdf
            if is_bytes:
                stream_obj = source if isinstance(source, io.BytesIO) else io.BytesIO(bytes(source))
                reader = pypdf.PdfReader(stream_obj)
            else:
                reader = pypdf.PdfReader(str(path))

            for page_num, page in enumerate(reader.pages):
                text = clean_text(page.extract_text() or '')
                if text:
                    pages.append({
                        'numero_pagina': page_num + 1,
                        'texto': text,
                    })
        except ImportError:
            # Fallback básico para testing si aún no hay librerías PDF instaladas
            raise ImportError(
                'Se requiere PyMuPDF (fitz) o pypdf para extraer texto de documentos PDF. '
                'Ejecute: pip install PyMuPDF'
            )

    return pages


def chunk_page_text(page_text: str, page_number: int, chunk_size: int = 600, overlap: int = 100) -> list[dict]:
    """
    Divide el texto de una página en fragmentos (chunks) de tamaño controlado
    con solapamiento para preservar el contexto de las oraciones.
    """
    if not page_text or len(page_text.strip()) == 0:
        return []

    words = page_text.split(' ')
    chunks = []
    current_words = []
    current_len = 0
    chunk_order = 1

    for word in words:
        current_words.append(word)
        current_len += len(word) + 1

        if current_len >= chunk_size:
            chunk_content = ' '.join(current_words).strip()
            if chunk_content:
                chunks.append({
                    'numero_pagina': page_number,
                    'orden_fragmento': chunk_order,
                    'contenido': chunk_content,
                    'tokens_aprox': max(1, len(chunk_content) // 4),
                })
                chunk_order += 1

            # Mantener solapamiento (overlap) tomando las últimas palabras
            overlap_words = []
            overlap_len = 0
            for w in reversed(current_words):
                if overlap_len + len(w) + 1 <= overlap:
                    overlap_words.insert(0, w)
                    overlap_len += len(w) + 1
                else:
                    break
            current_words = overlap_words
            current_len = overlap_len

    # Último fragmento restante
    if current_words:
        chunk_content = ' '.join(current_words).strip()
        if chunk_content and (not chunks or chunks[-1]['contenido'] != chunk_content):
            chunks.append({
                'numero_pagina': page_number,
                'orden_fragmento': chunk_order,
                'contenido': chunk_content,
                'tokens_aprox': max(1, len(chunk_content) // 4),
            })

    return chunks
