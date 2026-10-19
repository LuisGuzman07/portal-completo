import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const [quickSearch, setQuickSearch] = useState("");
  const [validationCode, setValidationCode] = useState("");
  const [validationResult, setValidationResult] = useState(null);

  const handleValidate = (e) => {
    e.preventDefault();
    if (!validationCode.trim()) return;
    setValidationResult(`Registro #${validationCode.toUpperCase()} verificado en el Padrón Científico Central de ABOCCRIM.`);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Convocatoria Banner */}
      <div className="w-full bg-primary text-on-primary py-space-xs px-margin-mobile md:px-margin-desktop hidden md:block">
        <div className="max-w-[1320px] mx-auto flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-space-md">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-on-tertiary-container/20 text-on-tertiary-container font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse"></span>
              Convocatoria 2025
            </span>
            <span className="text-primary-fixed-dim">
              Recepción abierta de artículos arbitrados para el Vol. IX de la Revista Boliviana de Criminología.
            </span>
          </div>
          <Link to="/acceso-miembros" className="flex items-center gap-1 text-secondary-fixed hover:text-white transition-colors">
            <span>Bases editoriales y requisitos</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="w-full bg-surface-bright py-space-xl px-margin-mobile md:px-margin-desktop">
        <div className="max-w-[1320px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
            <div className="lg:col-span-8 space-y-space-lg">
              <div className="inline-flex items-center gap-space-xs px-3 py-1.5 rounded-full bg-surface-container-high text-primary text-xs font-semibold">
                <span className="material-symbols-outlined text-sm text-primary-container">verified</span>
                <span>Asociación Civil Científica • Bolivia • Registro Académico Oficial No. 4920-BO</span>
              </div>
              <div className="space-y-space-md">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-primary leading-tight">
                  Investigación, Rigor y Gestión del Conocimiento Criminológico en Bolivia
                </h1>
                <p className="text-base text-on-surface-variant max-w-2xl leading-relaxed">
                  La Academia Boliviana de Ciencias Criminológicas (ABOCCRIM) articula la evidencia científica en ciencias penales, victimología forense, política criminal y cibercrimen al servicio de la justicia y las políticas públicas del Estado y la región andina.
                </p>
              </div>

              {/* Quick Search Bar */}
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm space-y-space-sm border border-outline-variant/20">
                <div className="flex flex-col md:flex-row gap-space-sm">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-lg">search</span>
                    <input
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary-container"
                      placeholder="Buscar publicaciones científicas, investigadores, tesis, jurisprudencia..."
                      value={quickSearch}
                      onChange={(e) => setQuickSearch(e.target.value)}
                      type="text"
                    />
                  </div>
                  <div className="w-full md:w-56">
                    <select className="w-full py-2.5 px-3 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-container">
                      <option value="all">Todas las disciplinas</option>
                      <option value="criminologia-clinica">Criminología Clínica & Forense</option>
                      <option value="psicologia-juridica">Psicología Jurídica y Victimología</option>
                      <option value="politica-criminal">Política Criminal y Dogmática</option>
                      <option value="cibercrimen">Cibercrimen y Análisis Digital</option>
                    </select>
                  </div>
                  <button
                    onClick={() => navigate("/repositorio-academico")}
                    className="px-space-lg py-2.5 rounded-lg bg-on-tertiary-container hover:bg-tertiary-container text-on-tertiary font-semibold text-sm flex items-center justify-center gap-space-xs transition-colors shadow-sm"
                  >
                    <span>Explorar Repositorio</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-space-xs text-on-surface-variant text-xs">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-base">psychology</span>
                    <span>¿Consultas analíticas complejas? Usa nuestro motor semántico:</span>
                  </div>
                  <Link to="/busqueda-semantica-pln" className="inline-flex items-center gap-1 text-secondary font-semibold hover:text-primary transition-colors">
                    <span>Acceder a Búsqueda Semántica con IA / PLN</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </Link>
                </div>
              </div>

              {/* Statistics Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-space-xs">
                <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm border border-outline-variant/20">
                  <span className="block text-2xl font-bold text-primary">+48</span>
                  <span className="text-xs text-on-surface-variant font-medium">Investigadores Acreditados</span>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm border border-outline-variant/20">
                  <span className="block text-2xl font-bold text-primary">+340</span>
                  <span className="text-xs text-on-surface-variant font-medium">Artículos Científicos</span>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm border border-outline-variant/20">
                  <span className="block text-2xl font-bold text-primary">14</span>
                  <span className="text-xs text-on-surface-variant font-medium">Convenios Interinstitucionales</span>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm border border-outline-variant/20">
                  <span className="block text-2xl font-bold text-secondary">Dialnet</span>
                  <span className="text-xs text-on-surface-variant font-medium">Indexación Latindex 2.0</span>
                </div>
              </div>
            </div>

            {/* Right Card: Official Emblem with real ABOCCRIM.webp */}
            <div className="lg:col-span-4 flex flex-col gap-space-md">
              <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm relative overflow-hidden flex flex-col items-center text-center border border-outline-variant/20">
                <div className="w-full flex justify-between items-center mb-space-sm">
                  <span className="text-xs uppercase tracking-wider text-outline font-semibold">Emblema Oficial</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary text-xs font-semibold">Sociedad Civil</span>
                </div>

                {/* Real WebP Logo display */}
                <div className="my-space-sm p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/20">
                  <img
                    src="/ABOCCRIM.webp"
                    alt="Emblema Oficial ABOCCRIM"
                    className="w-56 h-auto object-contain drop-shadow-md rounded-lg"
                  />
                </div>

                <h3 className="text-xl font-bold text-primary mt-2">ABOCCRIM</h3>
                <p className="text-xs uppercase tracking-widest text-on-surface-variant mt-0.5 font-medium">
                  Academia Boliviana de Ciencias Criminológicas
                </p>
                <p className="text-xs text-on-surface-variant mt-space-sm leading-normal">
                  Entidad científica no gubernamental dedicada a la investigación empírica, la bioética penal y el peritaje criminológico de alto estándar.
                </p>

                <div className="w-full pt-space-sm mt-space-md bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between text-left">
                  <div>
                    <span className="block text-xs text-on-surface-variant font-medium">Dictamen Científico</span>
                    <span className="text-xs font-bold text-primary">Doble Ciego por Pares</span>
                  </div>
                  <span className="material-symbols-outlined text-secondary">policy</span>
                </div>
              </div>

              {/* Verification Box */}
              <div className="bg-surface-container p-space-md rounded-xl space-y-space-xs">
                <span className="text-xs uppercase text-secondary font-bold">Verificación de Colegiatura</span>
                <form onSubmit={handleValidate} className="flex gap-2">
                  <input
                    className="w-full px-3 py-2 rounded bg-surface-container-lowest text-on-surface text-xs focus:outline-none"
                    placeholder="No. Carnet Científico o R.U.T."
                    type="text"
                    value={validationCode}
                    onChange={(e) => setValidationCode(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors"
                  >
                    Validar
                  </button>
                </form>
                {validationResult && (
                  <p className="text-[11px] text-primary font-semibold mt-1 bg-surface-container-lowest p-2 rounded border border-outline-variant/30">
                    {validationResult}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Publications Showcase */}
      <section className="w-full py-space-xl px-margin-mobile md:px-margin-desktop bg-surface">
        <div className="max-w-[1320px] mx-auto space-y-space-lg">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-sm pb-space-sm">
            <div>
              <div className="inline-flex items-center gap-space-xs text-xs uppercase tracking-widest text-secondary font-semibold mb-1">
                <span className="material-symbols-outlined text-sm">menu_book</span>
                <span>Revista Boliviana de Criminología • Edición Arbitrada</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-primary">Producción Científica Reciente</h2>
            </div>
            <Link to="/repositorio-academico" className="inline-flex items-center gap-space-xs text-sm text-primary hover:text-secondary font-semibold transition-colors">
              <span>Ver catálogo completo (340+)</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
            <article className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow border border-outline-variant/20">
              <div className="space-y-space-sm">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold">Criminología Clínica</span>
                  <span className="text-xs text-on-surface-variant">Enero 2025</span>
                </div>
                <Link to="/detalle-publicacion" className="block">
                  <h3 className="text-base font-bold text-primary group-hover:text-secondary transition-colors">
                    Patrones de Reincidencia Penitenciaria en Centros Carcelarios del Eje Central de Bolivia
                  </h3>
                </Link>
                <p className="text-sm text-on-surface-variant line-clamp-3">
                  Estudio longitudinal de cohortes (2018-2024) en San Pedro (La Paz) y Palmasola (Santa Cruz), correlacionando factores biopsicosociales y deficiencias en regímenes de reinserción progresiva.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-space-xs">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-xs">#Penología</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-xs">#SistemasCarcelarios</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-xs">#Rehabilitación</span>
                </div>
              </div>
              <div className="pt-space-md mt-space-md border-t border-surface-container-high/60 flex items-center justify-between text-xs">
                <span className="text-outline">DOI: 10.5928/aboccrim.2025.01</span>
                <Link to="/detalle-publicacion" className="text-primary font-bold hover:underline">Leer documento</Link>
              </div>
            </article>

            <article className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow border border-outline-variant/20">
              <div className="space-y-space-sm">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold">Victimología Forense</span>
                  <span className="text-xs text-on-surface-variant">Diciembre 2024</span>
                </div>
                <Link to="/detalle-publicacion" className="block">
                  <h3 className="text-base font-bold text-primary group-hover:text-secondary transition-colors">
                    Evaluación Pericial en Delitos de Trata de Personas: Protocolo de Contención Psicológica
                  </h3>
                </Link>
                <p className="text-sm text-on-surface-variant line-clamp-3">
                  Análisis normativo y baremo psicofisiológico para el abordaje de víctimas en zonas de frontera andina. Guía metodológica para peritos de la fiscalía.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-space-xs">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-xs">#Victimología</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-xs">#Forense</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-xs">#DDHH</span>
                </div>
              </div>
              <div className="pt-space-md mt-space-md border-t border-surface-container-high/60 flex items-center justify-between text-xs">
                <span className="text-outline">DOI: 10.5928/aboccrim.2024.12</span>
                <Link to="/detalle-publicacion" className="text-primary font-bold hover:underline">Leer documento</Link>
              </div>
            </article>

            <article className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow border border-outline-variant/20">
              <div className="space-y-space-sm">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold">Cibercrimen & Datos</span>
                  <span className="text-xs text-on-surface-variant">Noviembre 2024</span>
                </div>
                <Link to="/detalle-publicacion" className="block">
                  <h3 className="text-base font-bold text-primary group-hover:text-secondary transition-colors">
                    Criptoactivos, Fraude Telemático y Lavado de Dinero en la Jurisdicción Boliviana
                  </h3>
                </Link>
                <p className="text-sm text-on-surface-variant line-clamp-3">
                  Examen de la tipicidad bajo la Ley N° 1390 y los desafíos probatorios en la cadena de custodia digital de registros blockchain.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-space-xs">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-xs">#Cibercrimen</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-xs">#Blockchain</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-xs">#EvidenciaDigital</span>
                </div>
              </div>
              <div className="pt-space-md mt-space-md border-t border-surface-container-high/60 flex items-center justify-between text-xs">
                <span className="text-outline">DOI: 10.5928/aboccrim.2024.11</span>
                <Link to="/detalle-publicacion" className="text-primary font-bold hover:underline">Leer documento</Link>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
