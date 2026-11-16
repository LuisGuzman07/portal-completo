import React, { useState } from 'react';

function formatAuthorsAPA(autores = []) {
  if (!autores || autores.length === 0) return 'ABOCCRIM';
  return autores
    .map((a) => {
      const apellidos = a.apellidos || (a.nombre_completo ? a.nombre_completo.split(' ').slice(1).join(' ') : '');
      const nombres = a.nombres || (a.nombre_completo ? a.nombre_completo.split(' ')[0] : '');
      const initial = nombres ? `${nombres[0]}.` : '';
      return `${apellidos}, ${initial}`.trim();
    })
    .join(', ');
}

function formatAuthorsVancouver(autores = []) {
  if (!autores || autores.length === 0) return 'ABOCCRIM';
  return autores
    .map((a) => {
      const apellidos = a.apellidos || (a.nombre_completo ? a.nombre_completo.split(' ').slice(1).join(' ') : '');
      const nombres = a.nombres || (a.nombre_completo ? a.nombre_completo.split(' ')[0] : '');
      const initial = nombres ? nombres[0] : '';
      return `${apellidos} ${initial}`.trim();
    })
    .join(', ');
}

function generateBibtexKey(autores = [], anio, titulo = '') {
  const firstAuthor = autores[0]?.apellidos?.split(' ')[0] || 'ABOCCRIM';
  const cleanYear = anio || new Date().getFullYear();
  const firstWord = (titulo.replace(/[^a-zA-Z0-9 ]/g, '').split(' ')[0] || 'Paper');
  return `${firstAuthor}${cleanYear}${firstWord}`;
}

export default function CitationModal({ publication, isOpen, onClose }) {
  const [copiedFormat, setCopiedFormat] = useState(null);

  if (!isOpen || !publication) return null;

  const currentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/repositorio/${publication.id}`
    : `https://aboccrim.org.bo/repositorio/${publication.id}`;

  const year = publication.anio || (publication.fecha_publicacion ? new Date(publication.fecha_publicacion).getFullYear() : 's.f.');
  const title = publication.titulo || 'Sin título';
  const hasDoi = Boolean(publication.doi && publication.doi.trim());
  const doiUrl = hasDoi
    ? (publication.doi.startsWith('http') ? publication.doi : `https://doi.org/${publication.doi.trim()}`)
    : null;

  const authorsApa = formatAuthorsAPA(publication.autores_lista);
  const authorsVan = formatAuthorsVancouver(publication.autores_lista);
  const bibtexKey = generateBibtexKey(publication.autores_lista, year, title);
  const todayStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  // 1. Por defecto (ABOCCRIM)
  const defaultCitation = hasDoi
    ? `${authorsApa} (${year}). ${title}. Repositorio Académico ABOCCRIM. ${doiUrl}`
    : `${authorsApa} (${year}). ${title}. Repositorio Académico ABOCCRIM. ${currentUrl}`;

  // 2. APA 7ma Edición
  const apaCitation = hasDoi
    ? `${authorsApa} (${year}). ${title}. Academia Boliviana de Ciencias Criminológicas. ${doiUrl}`
    : `${authorsApa} (${year}). ${title}. Academia Boliviana de Ciencias Criminológicas. ${currentUrl}`;

  // 3. Harvard
  const harvardCitation = hasDoi
    ? `${authorsApa} (${year}) '${title}', ABOCCRIM [Publicación Académica]. doi:${publication.doi.trim()}.`
    : `${authorsApa} (${year}) '${title}', ABOCCRIM [Publicación Académica]. Disponible en: ${currentUrl}`;

  // 4. Vancouver
  const vancouverCitation = `${authorsVan}. ${title}. ABOCCRIM [Internet]. ${year} [citado el ${todayStr}]; Disponible en: ${currentUrl}`;

  // 5. BibTeX
  const bibtexCitation = `@article{${bibtexKey},
  author = {${publication.autores_lista?.map(a => a.nombre_completo || `${a.nombres} ${a.apellidos}`).join(' and ') || 'ABOCCRIM'}},
  title = {{${title}}},
  journal = {Repositorio Acad\u00e9mico ABOCCRIM},
  year = {${year}},${hasDoi ? `\n  doi = {${publication.doi.trim()}},` : ''}
  url = {${currentUrl}}
}`;

  const CITATIONS = [
    { id: 'default', label: '(Por defecto)', text: defaultCitation, isCode: false },
    { id: 'apa', label: 'APA 7.ª edición', text: apaCitation, isCode: false },
    { id: 'harvard', label: 'Harvard', text: harvardCitation, isCode: false },
    { id: 'vancouver', label: 'Vancouver', text: vancouverCitation, isCode: false },
    { id: 'bibtex', label: 'BibTeX', text: bibtexCitation, isCode: true },
  ];

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(id);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="citation-modal-title"
        className="w-full max-w-3xl bg-surface-container-lowest border border-outline-variant/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header (Matching user attachment media_1794829427556_1bff08a8.png) */}
        <div className="px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">format_quote</span>
            <h2 id="citation-modal-title" className="text-lg font-bold text-primary">
              Cita este pub
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface-container-low text-outline hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Cerrar modal de citas"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-6 divide-y divide-outline-variant/15">
          {CITATIONS.map((cit, idx) => (
            <div
              key={cit.id}
              className={`grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-3 sm:gap-4 items-start ${
                idx > 0 ? 'pt-5' : ''
              }`}
            >
              {/* Format label */}
              <div className="text-xs font-semibold text-outline sm:text-right pt-0.5">
                {cit.label}
              </div>

              {/* Citation formatted text */}
              <div className="text-xs text-on-surface leading-relaxed pr-2">
                {cit.isCode ? (
                  <pre className="font-mono text-[11px] bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 overflow-x-auto whitespace-pre-wrap selection:bg-primary/20">
                    {cit.text}
                  </pre>
                ) : (
                  <p className="select-all font-sans">{cit.text}</p>
                )}
              </div>

              {/* Copy button */}
              <div className="shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => handleCopy(cit.id, cit.text)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    copiedFormat === cit.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-surface-container-low hover:bg-primary/10 text-primary border border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {copiedFormat === cit.id ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedFormat === cit.id ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-low/40 flex items-center justify-between text-xs text-outline">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">info</span>
            Formato estándar para indexación bibliográfica académica
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-xs font-semibold hover:bg-surface-container transition-all"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
