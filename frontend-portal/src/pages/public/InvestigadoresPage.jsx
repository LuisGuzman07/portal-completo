import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function InvestigadoresPage() {
  const [filterCategory, setFilterCategory] = useState("all");

  return (
    <div className="flex flex-col w-full">
      <section className="w-full px-margin-mobile md:px-margin-desktop py-space-sm bg-surface-container-low flex flex-wrap items-center justify-between gap-space-sm text-on-surface-variant text-xs font-medium">
        <div className="flex items-center gap-space-xs flex-wrap">
          <Link to="/repositorio-academico" className="hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-base">domain</span> Directorio de Investigadores
          </Link>
          <span>/</span>
          <span className="text-secondary font-semibold">Capítulo Departamental Santa Cruz</span>
          <span>/</span>
          <span className="text-on-surface font-semibold">Dr. Fernando Daza Morales, Ph.D.</span>
        </div>
        <div className="flex items-center gap-space-md">
          <span className="flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container-highest text-primary font-semibold text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            EXPEDIENTE COLEGIADO ACTIVO
          </span>
          <span className="font-mono text-[11px]">REG: #4920-BO-084</span>
        </div>
      </section>

      <section className="w-full px-margin-mobile md:px-margin-desktop py-space-xl relative overflow-hidden bg-surface">
        <div className="max-w-[1320px] mx-auto flex flex-col lg:flex-row gap-space-xl items-start justify-between">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-space-lg w-full lg:w-auto">
            <div className="relative shrink-0">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-xl p-1 bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center bg-gradient-to-tr from-primary-container to-secondary">
                <span className="text-5xl font-bold text-on-primary">FD</span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary-container text-on-primary p-2 rounded-xl shadow-md flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">verified_user</span>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-space-xs max-w-2xl">
              <div className="flex items-center gap-space-xs flex-wrap justify-center sm:justify-start">
                <span className="px-space-sm py-1 rounded-full bg-surface-container text-primary text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">stars</span> Miembro de Número
                </span>
                <span className="px-space-sm py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold">
                  Acreditación Vigente: 2025–2028
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
                Dr. Fernando Daza Morales, Ph.D.
              </h1>
              <p className="text-xs md:text-sm text-on-surface-variant font-medium leading-relaxed">
                Catedrático Titular e Investigador Principal en Criminología y Política Criminal <br/>
                <span className="text-on-surface font-semibold">Universidad Autónoma Gabriel René Moreno (UAGRM)</span> &amp; <span className="text-primary-container font-semibold">ABOCCRIM</span>
              </p>

              <div className="flex flex-wrap gap-1 pt-1">
                <span className="px-2 py-0.5 rounded bg-surface-container text-secondary text-xs"># Análisis Espacial del Delito</span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-secondary text-xs"># Criminología Urbana</span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-secondary text-xs"># Penología</span>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center rounded-lg bg-surface-container-low px-2 py-1 gap-1 font-mono text-emerald-700 font-semibold shadow-xs">
                  <span>ORCID: 0000-0002-8419-7714</span>
                </div>
                <span className="text-on-surface-variant">Google Scholar (582 citas)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-space-sm w-full lg:w-72 shrink-0">
            <button
              onClick={() => alert("Solicitud de contacto enviada a la Secretaría Académica de ABOCCRIM.")}
              className="w-full flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-lg bg-on-tertiary-container hover:bg-tertiary-container text-on-tertiary text-xs font-bold shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-base">mail</span>
              <span>Contactar para Peritaje / Arbitraje</span>
            </button>
            <button
              onClick={() => alert("Descargando expediente curricular estandarizado...")}
              className="w-full flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-xs font-bold shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              <span>Descargar Curriculum Vitae (PDF)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Publications by Researcher */}
      <div className="max-w-[1320px] mx-auto w-full px-margin-mobile md:px-margin-desktop py-space-xl grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
        <main className="lg:col-span-8 space-y-space-lg">
          <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30">
            <h2 className="text-lg font-bold text-primary">Producción Científica Registrada en ABOCCRIM</h2>
            <span className="text-xs text-outline">18 artículos arbitrados</span>
          </div>

          <div className="space-y-space-md">
            <article className="p-space-lg rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm space-y-2">
              <span className="text-xs text-secondary font-semibold">Revista Boliviana de Criminología • 2024</span>
              <Link to="/detalle-publicacion" className="block text-base font-bold text-primary hover:text-secondary">
                Patrones Espacio-Temporales y Análisis Criminológico del Homicidio Urbano en Santa Cruz de la Sierra: 2018–2023
              </Link>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Estudio longitudinal con georreferenciación de puntos calientes en distritos periurbanos de Santa Cruz.
              </p>
            </article>

            <article className="p-space-lg rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm space-y-2">
              <span className="text-xs text-secondary font-semibold">Monografías Forenses ABOCCRIM • 2023</span>
              <h3 className="text-base font-bold text-primary">
                Criminología Ambiental y Prevención Situacional en Centros Urbanos de Alta Densidad
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Propuesta de intervención urbanística y vigilancia natural para la reducción del delito callejero.
              </p>
            </article>
          </div>
        </main>

        <aside className="lg:col-span-4 space-y-space-md">
          <div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 space-y-space-sm">
            <h3 className="text-sm font-bold text-primary uppercase">Formación Académica</h3>
            <ul className="text-xs space-y-2 text-on-surface">
              <li>
                <strong>Doctorado (Ph.D.) en Criminología</strong>
                <div className="text-on-surface-variant">Universidad de Salamanca (España)</div>
              </li>
              <li>
                <strong>Maestría en Ciencias Forenses</strong>
                <div className="text-on-surface-variant">Universidad Mayor de San Andrés (UMSA)</div>
              </li>
              <li>
                <strong>Licenciatura en Derecho</strong>
                <div className="text-on-surface-variant">UAGRM • Matrícula de Honor</div>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
