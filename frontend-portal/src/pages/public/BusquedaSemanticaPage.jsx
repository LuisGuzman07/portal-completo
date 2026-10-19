import React, { useState } from 'react';

export default function BusquedaSemanticaPage() {
  const [query, setQuery] = useState("¿Cuál es la relación entre hacinamiento carcelario y reincidencia delictiva en Palmasola?");
  const [viewState, setViewState] = useState("results");

  const runSearch = (e) => {
    if (e) e.preventDefault();
    if (query.trim() === "") {
      setViewState("empty");
    } else {
      setViewState("results");
    }
  };

  const setChipQuery = (text) => {
    setQuery(text);
    setViewState("results");
  };

  return (
    <div className="flex flex-col w-full">
      <div className="w-full bg-primary text-on-primary py-space-xl px-margin-mobile md:px-margin-desktop relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col gap-space-lg relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="inline-flex items-center gap-space-xs px-3 py-1.5 rounded-full bg-surface-container-highest/15 backdrop-blur-md text-secondary-fixed">
              <span className="material-symbols-outlined text-sm text-secondary-fixed-dim">neurology</span>
              <span className="text-xs tracking-wider uppercase font-semibold">ABOCCRIM NLP Engine • Corpus Académico</span>
            </div>
            <div className="flex items-center gap-space-md text-surface-variant text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span> Indexación Vectorial</span>
              <span>•</span>
              <span>Modelo ABOCCRIM-LegalBERT-v2.4</span>
            </div>
          </div>

          <div className="max-w-4xl space-y-space-sm">
            <h1 className="text-3xl md:text-5xl font-bold text-on-primary tracking-tight">
              Búsqueda Semántica Criminológica Asistida por PLN
            </h1>
            <p className="text-sm md:text-base text-surface-variant max-w-3xl leading-relaxed">
              Consulte el corpus académico en lenguaje natural. El modelo semántico analiza el significado contextual de sus consultas para vincular evidencia empírica, jurisprudencia y literatura científica boliviana e internacional.
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-space-md md:p-space-lg shadow-xl text-on-surface mt-space-sm">
            <form className="space-y-space-md" onSubmit={runSearch}>
              <div className="relative flex flex-col md:flex-row items-stretch gap-space-sm">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">cognition</span>
                  <input
                    className="w-full pl-12 pr-10 py-3 bg-surface-container-low rounded-lg text-sm md:text-base text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:shadow-md transition-all placeholder:text-outline/70"
                    placeholder="Formule una pregunta empírica, hipótesis o consulta teórica en lenguaje natural..."
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>
                <button className="px-space-xl py-3 bg-on-tertiary-container hover:bg-tertiary-container text-on-tertiary font-semibold text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-space-xs shrink-0" type="submit">
                  <span className="material-symbols-outlined text-lg">manage_search</span>
                  <span>Ejecutar Búsqueda Semántica</span>
                </button>
              </div>
            </form>

            <div className="mt-space-lg pt-space-md">
              <span className="text-xs text-on-surface-variant uppercase tracking-wider block mb-space-sm font-semibold">
                Consultas Semánticas de Referencia Criminológica:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-sm">
                <button
                  onClick={() => setChipQuery("¿Cuál es la relación entre hacinamiento carcelario y reincidencia delictiva en Palmasola?")}
                  className="text-left p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <span className="text-xs text-on-surface font-medium line-clamp-2">"¿Cuál es la relación entre hacinamiento carcelario y reincidencia delictiva en Palmasola?"</span>
                  <div className="flex items-center gap-1 mt-2 text-secondary text-[11px] font-semibold">
                    <span className="material-symbols-outlined text-xs">auto_awesome</span>
                    <span>Penitenciario • Santa Cruz</span>
                  </div>
                </button>

                <button
                  onClick={() => setChipQuery("Protocolos forenses de autopsia psicológica en suicidios de adolescentes")}
                  className="text-left p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <span className="text-xs text-on-surface font-medium line-clamp-2">"Protocolos forenses de autopsia psicológica en suicidios de adolescentes"</span>
                  <div className="flex items-center gap-1 mt-2 text-secondary text-[11px] font-semibold">
                    <span className="material-symbols-outlined text-xs">auto_awesome</span>
                    <span>Victimología • Psicología</span>
                  </div>
                </button>

                <button
                  onClick={() => setChipQuery("Tipificación y cadena de custodia en fraudes bancarios con criptomonedas")}
                  className="text-left p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <span className="text-xs text-on-surface font-medium line-clamp-2">"Tipificación y cadena de custodia en fraudes bancarios con criptomonedas"</span>
                  <div className="flex items-center gap-1 mt-2 text-secondary text-[11px] font-semibold">
                    <span className="material-symbols-outlined text-xs">auto_awesome</span>
                    <span>Cibercrimen • Evidencia Digital</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Semantic Results Area */}
      <div className="max-w-7xl mx-auto w-full px-margin-mobile md:px-margin-desktop py-space-xl">
        {viewState === "results" ? (
          <div className="space-y-space-lg">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-primary">Resultados del Análisis Contextual</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs font-semibold text-secondary">
                  3 coincidencias semánticas relevantes
                </span>
              </div>
              <span className="text-xs text-outline font-mono">Similitud Coseno: &gt; 0.84</span>
            </div>

            <div className="grid grid-cols-1 gap-space-md">
              <article className="p-space-lg rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">94% Relevancia Semántica</span>
                  <span className="text-outline">Rev. Bol. Criminol. 2024</span>
                </div>
                <h3 className="text-base font-bold text-primary">
                  Evaluación Empírica del Hacinamiento Penitenciario en Palmasola y Factores de Reincidencia (2019-2024)
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  "...el análisis multivariado constata que la sobreocupación carcelaria superior al 280% inhibe las intervenciones de reinserción social progresiva, elevando la probabilidad de reincidencia en delitos contra el patrimonio en un 41.2% durante los primeros 18 meses posteriores a la libertad condicional..."
                </p>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-secondary">Dr. Fernando Daza Morales et al.</span>
                  <span className="text-primary font-bold hover:underline cursor-pointer">Ver fragmento indexado →</span>
                </div>
              </article>

              <article className="p-space-lg rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">88% Relevancia Semántica</span>
                  <span className="text-outline">Monografías Forenses ABOCCRIM</span>
                </div>
                <h3 className="text-base font-bold text-primary">
                  Condiciones Biopsicosociales del Régimen Penitenciario y Comportamiento Agresivo Intramuros
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  "...la densidad de ocupación por metro cuadrado en pabellones de régimen abierto condiciona niveles crónicos de cortisol en internos, correlacionados con episodios de violencia interpersonal y consolidación de subculturas delictivas..."
                </p>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-secondary">Dra. Jimena Claure Soria</span>
                  <span className="text-primary font-bold hover:underline cursor-pointer">Ver fragmento indexado →</span>
                </div>
              </article>
            </div>
          </div>
        ) : (
          <div className="p-space-xl text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
            <p className="text-sm font-semibold">Ingrese una consulta para activar el motor de búsqueda semántica.</p>
          </div>
        )}
      </div>
    </div>
  );
}
