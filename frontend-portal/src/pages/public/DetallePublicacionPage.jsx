import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function DetallePublicacionPage() {
  const [citationStyle, setCitationStyle] = useState("apa");
  const [copied, setCopied] = useState(false);

  const citations = {
    apa: "Daza Morales, F., & Claure, J. (2024). Patrones Espacio-Temporales y Análisis Criminológico del Homicidio Urbano en Santa Cruz de la Sierra: 2018–2023. Revista Boliviana de Criminología, 11(2), 112–138. https://doi.org/10.59232/aboccrim.2024.0812",
    vancouver: "Daza Morales F, Claure J. Patrones Espacio-Temporales y Análisis Criminológico del Homicidio Urbano en Santa Cruz de la Sierra: 2018–2023. Rev Bol Criminol. 2024;11(2):112-138. doi:10.59232/aboccrim.2024.0812",
    chicago: "Daza Morales, Fernando, y Jimena Claure. 2024. «Patrones Espacio-Temporales y Análisis Criminológico del Homicidio Urbano en Santa Cruz de la Sierra: 2018–2023». Revista Boliviana de Criminología 11 (2): 112–38. https://doi.org/10.59232/aboccrim.2024.0812.",
    harvard: 'Daza Morales, F. y Claure, J. (2024) "Patrones Espacio-Temporales y Análisis Criminológico del Homicidio Urbano en Santa Cruz de la Sierra: 2018–2023", Revista Boliviana de Criminología, 11(2), pp. 112–138. doi: 10.59232/aboccrim.2024.0812.'
  };

  const copyCitation = () => {
    navigator.clipboard.writeText(citations[citationStyle]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="w-full bg-gradient-to-b from-surface-container to-surface-bright pb-space-xl pt-space-lg px-margin-mobile md:px-margin-desktop">
        <div className="max-w-[1320px] mx-auto w-full flex flex-col gap-space-lg">
          <nav aria-label="Ruta de navegación" className="flex items-center flex-wrap gap-space-xs text-xs text-on-surface-variant font-medium">
            <Link className="hover:text-primary transition-colors flex items-center gap-1" to="/">
              <span className="material-symbols-outlined text-base">home</span>Inicio
            </Link>
            <span className="text-outline-variant">/</span>
            <Link className="hover:text-primary transition-colors" to="/repositorio-academico">Repositorio Académico</Link>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-semibold">Criminología Aplicada</span>
            <span className="text-outline-variant">/</span>
            <span className="text-secondary font-medium truncate max-w-xs md:max-w-md">Detalle de Publicación</span>
          </nav>

          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest text-primary text-xs font-semibold shadow-sm">
              <span className="material-symbols-outlined text-sm text-secondary">verified</span>
              Artículo Arbitrado
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-sm">visibility_lock</span>
              Revisión por Pares Doble Ciego
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium">
              <span className="material-symbols-outlined text-sm text-emerald-600">lock_open_right</span>
              Open Access (CC-BY-NC 4.0)
            </span>
            <span className="ml-auto hidden sm:flex items-center gap-1 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-primary">local_police</span>
              ISSN Digital: 2959-1422
            </span>
          </div>

          <div className="flex flex-col gap-space-md">
            <h1 className="text-2xl md:text-4xl font-bold text-primary tracking-tight max-w-5xl">
              Patrones Espacio-Temporales y Análisis Criminológico del Homicidio Urbano en Santa Cruz de la Sierra: 2018–2023
            </h1>
            <p className="text-sm md:text-base text-on-surface-variant italic max-w-4xl">
              Spatiotemporal Patterns and Criminological Analysis of Urban Homicide in Santa Cruz de la Sierra: 2018–2023
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md p-space-md bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20">
            <div className="flex items-start gap-space-md">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                FD
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Link to="/investigadores" className="text-sm text-on-surface font-bold hover:text-primary">Dr. Fernando Daza Morales</Link>
                  <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary text-[10px] font-semibold">Investigador Titular</span>
                </div>
                <span className="text-xs text-on-surface-variant">
                  Academia Boliviana de Ciencias Criminológicas • Univ. Autónoma Gabriel René Moreno (UAGRM)
                </span>
                <div className="flex items-center gap-3 mt-1 text-xs text-secondary">
                  <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">mail</span> fdaza@aboccrim.bo</span>
                  <span className="flex items-center gap-0.5 text-emerald-700">
                    <span className="font-bold">ORCID:</span> 0000-0002-8491-3209
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-space-md">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                JC
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-on-surface font-bold">M.Sc. Jimena Claure Soria</span>
                  <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-semibold">Investigadora Asociada</span>
                </div>
                <span className="text-xs text-on-surface-variant">
                  Instituto de Investigaciones Forenses (IDIF) • ABOCCRIM
                </span>
                <div className="flex items-center gap-3 mt-1 text-xs text-secondary">
                  <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">mail</span> jclaure@aboccrim.bo</span>
                  <span className="flex items-center gap-0.5 text-emerald-700">
                    <span className="font-bold">ORCID:</span> 0000-0003-1120-4491
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-[1320px] mx-auto w-full px-margin-mobile md:px-margin-desktop py-space-xl grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
        <main className="lg:col-span-8 flex flex-col gap-space-lg">
          <section className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-xl shadow-sm border border-outline-variant/20 space-y-space-md">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">subject</span>
              Resumen Científico (Abstract)
            </h2>
            <p className="text-sm text-on-surface leading-relaxed text-justify">
              La presente investigación examina la dinámica espacial, temporal y criminológica de los homicidios dolosos consumados en el municipio de Santa Cruz de la Sierra durante el quinquenio 2018–2023. Utilizando técnicas de georreferenciación kernel density estimation (KDE), matrices de criminología ambiental y análisis documental de 1,248 cuadernos de investigación fiscal, se identifican clústeres críticos concentrados en distritos periurbanos de rápido crecimiento demográfico (DM-7 y DM-8).
            </p>
            <p className="text-sm text-on-surface leading-relaxed text-justify">
              Los resultados demuestran una correlación estadística significativa (p &lt; 0.01) entre factores de desorganización social comunitaria, proliferación no regulada de locales de consumo de alcohol y la ausencia de iluminación pública disuasoria. Se formulan recomendaciones específicas para la formulación de políticas públicas municipales basadas en evidencia empírica.
            </p>

            <div className="pt-space-md border-t border-outline-variant/20">
              <span className="text-xs font-bold text-primary block mb-2">Palabras Clave:</span>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface text-xs font-medium">Homicidio urbano</span>
                <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface text-xs font-medium">Criminología ambiental</span>
                <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface text-xs font-medium">Santa Cruz de la Sierra</span>
                <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface text-xs font-medium">Hotspots delictivos</span>
                <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface text-xs font-medium">Prevención del delito</span>
              </div>
            </div>
          </section>

          {/* Citation Generator */}
          <section className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/20 space-y-space-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-base">format_quote</span>
                Citar este trabajo académico
              </h3>
              <div className="flex items-center gap-1">
                {['apa', 'vancouver', 'chicago', 'harvard'].map((style) => (
                  <button
                    key={style}
                    onClick={() => setCitationStyle(style)}
                    className={`px-2.5 py-1 rounded text-xs font-bold uppercase transition-all ${
                      citationStyle === style
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-space-md bg-surface-container-low rounded-lg font-mono text-xs text-on-surface break-words leading-relaxed">
              {citations[citationStyle]}
            </div>

            <div className="flex justify-end">
              <button
                onClick={copyCitation}
                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar Cita'}</span>
              </button>
            </div>
          </section>
        </main>

        {/* Sidebar info */}
        <aside className="lg:col-span-4 flex flex-col gap-space-lg">
          <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 space-y-space-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-secondary">Documento Certificado</span>
              <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-outline">DOI Oficial:</span>
                <span className="font-mono text-secondary font-bold">10.59232/aboccrim.2024.0812</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-outline">Formato:</span>
                <span className="font-semibold text-on-surface">PDF / A-1b (Preservación)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-outline">Tamaño:</span>
                <span className="font-semibold text-on-surface">2.4 MB</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-outline">Arbitraje:</span>
                <span className="font-semibold text-primary">Doble Ciego Aprobado</span>
              </div>
            </div>

            <button
              onClick={() => alert("Descargando copia autorizada para fines de investigación académica...")}
              className="w-full py-3 px-space-md rounded-lg bg-on-tertiary-container hover:bg-tertiary-container text-on-tertiary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              <span>Descargar Artículo Completo</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
