import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RepositorioPage() {
  const [filterText, setFilterText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const articles = [
    {
      id: 1,
      tipo: "Artículo Arbitrado",
      openAccess: true,
      fecha: "Recibido: 12 Mar 2024 · Publicado: 02 Oct 2024",
      titulo: "Patrones Espacio-Temporales y Análisis Criminológico del Homicidio Urbano en Santa Cruz de la Sierra: 2018–2023",
      autor: "Dr. Fernando Daza Morales",
      coautor: "M.Sc. Jimena Claure S.",
      revista: "Revista Boliviana de Ciencias Criminológicas, Vol. 11, N° 2, 2024, pp. 112-138",
      doi: "10.59232/aboccrim.2024.0812",
      resumen: "La presente investigación examina la dinámica espacial, temporal y criminológica de los homicidios dolosos consumados en el municipio de Santa Cruz de la Sierra durante el quinquenio 2018–2023. Utilizando técnicas de georreferenciación kernel density estimation (KDE), matrices de criminología ambiental y análisis documental de 1,248 cuadernos de investigación fiscal...",
      tags: ["#CriminologíaEspacial", "#Santa Cruz de la Sierra", "#Hotspots", "#Victimología"]
    },
    {
      id: 2,
      tipo: "Dictamen Pericial",
      openAccess: true,
      fecha: "Publicado: 15 Ago 2024",
      titulo: "Neurobiología y Evaluación Criminológica del Trastorno de Personalidad Antisocial en Población Carcelaria",
      autor: "Dra. Jimena Claure Soria",
      coautor: "Dr. Carlos R. Mendoza",
      revista: "Monografías ABOCCRIM, Serie Forense N° 4, 2024",
      doi: "10.59232/aboccrim.2024.0754",
      resumen: "Evaluación psicofisiológica y análisis de biomarcadores en sujetos condenados por delitos violentos recurrentes. Propuesta de baremo clínico adaptado a las condiciones penitenciarias del Altiplano.",
      tags: ["#Neurocriminología", "#Psicopatología", "#BaremoForense"]
    },
    {
      id: 3,
      tipo: "Tesis Doctoral",
      openAccess: false,
      fecha: "Publicado: 01 Jun 2024",
      titulo: "Cibercrimen Financiero y Cadena de Custodia Digital en el Procedimiento Penal Boliviano",
      autor: "M.Sc. Andrés Vargas Silva",
      coautor: "Dr. Fernando Daza M.",
      revista: "Colección Tesis Doctorales de Posgrado UAGRM / ABOCCRIM",
      doi: "10.59232/aboccrim.2024.0611",
      resumen: "Estudio doctrinal y comparado de los estándares probatorios admitidos por el Ministerio Público para evidencia informática recolectada en redes descentralizadas.",
      tags: ["#Cibercrimen", "#CadenaDeCustodia", "#EvidenciaDigital"]
    }
  ];

  const filteredArticles = articles.filter(a => {
    if (selectedCategory === "articulos" && a.tipo !== "Artículo Arbitrado") return false;
    if (selectedCategory === "tesis" && a.tipo !== "Tesis Doctoral") return false;
    if (selectedCategory === "periciales" && a.tipo !== "Dictamen Pericial") return false;
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      return a.titulo.toLowerCase().includes(q) || a.autor.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full">
      {/* Header section */}
      <section className="w-full bg-surface-container-low px-margin-mobile md:px-margin-desktop py-space-xl">
        <div className="max-w-[1320px] mx-auto flex flex-col gap-space-md">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-xs text-on-surface-variant">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">home</span>
              Inicio
            </Link>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-semibold">Repositorio Académico</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
            <div className="space-y-space-xs max-w-3xl">
              <div className="inline-flex items-center gap-space-xs px-2.5 py-1 rounded-full bg-surface-container-high text-primary text-xs">
                <span className="material-symbols-outlined text-sm text-secondary">verified</span>
                Índice de Producción Científica Registrada | ISSN 2959-1422
              </div>
              <h1 className="text-3xl font-bold text-primary tracking-tight">
                Repositorio Institucional de Producción Científica
              </h1>
              <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">
                Archivo oficial de acceso abierto y arbitraje ciego especializado en ciencias penales, criminología forense, victimología y sociología jurídica para el Estado Plurinacional de Bolivia y la región andina.
              </p>
            </div>

            <div className="flex items-center gap-space-md p-space-md bg-surface-container-lowest rounded-xl shadow-sm self-start lg:self-auto border border-outline-variant/20">
              <div className="flex flex-col border-r border-outline-variant/30 pr-space-md">
                <span className="text-xl text-primary font-bold">1,480+</span>
                <span className="text-xs text-on-surface-variant">Artículos Indexados</span>
              </div>
              <div className="flex flex-col border-r border-outline-variant/30 pr-space-md">
                <span className="text-xl text-secondary font-bold">100%</span>
                <span className="text-xs text-on-surface-variant">Doble Ciego</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl text-on-tertiary-container font-bold">Latindex 2.0</span>
                <span className="text-xs text-on-surface-variant">Criterio Académico</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and search bar */}
      <section className="w-full bg-surface-container-lowest px-margin-mobile md:px-margin-desktop py-space-lg shadow-sm border-b border-outline-variant/20">
        <div className="max-w-[1320px] mx-auto flex flex-col gap-space-md">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-space-sm">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
              <input
                className="w-full pl-12 pr-4 py-3 bg-surface-container-low rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all"
                placeholder="Buscar por título, descriptor, autor, DOI o variable criminológica..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                type="search"
              />
            </div>
            <div className="flex items-center gap-space-sm">
              <Link to="/busqueda-semantica-pln" className="px-space-md py-3 rounded-lg bg-tertiary-container text-on-tertiary-container hover:bg-tertiary font-semibold text-sm flex items-center gap-space-xs shadow-sm transition-colors">
                <span className="material-symbols-outlined text-lg animate-pulse">neurology</span>
                <span>Activar Modo Semántico (PLN)</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-space-xs overflow-x-auto pb-1 text-xs">
            <span className="uppercase tracking-wider text-outline mr-2 shrink-0 font-semibold">Filtrar por:</span>
            <button onClick={() => setSelectedCategory("all")} className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${selectedCategory === "all" ? "bg-primary-container text-on-primary" : "bg-surface-container-low text-on-surface-variant"}`}>Todos los tipos</button>
            <button onClick={() => setSelectedCategory("articulos")} className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${selectedCategory === "articulos" ? "bg-primary-container text-on-primary" : "bg-surface-container-low text-on-surface-variant"}`}>Artículos de Revista</button>
            <button onClick={() => setSelectedCategory("tesis")} className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${selectedCategory === "tesis" ? "bg-primary-container text-on-primary" : "bg-surface-container-low text-on-surface-variant"}`}>Tesis Doctorales</button>
            <button onClick={() => setSelectedCategory("periciales")} className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${selectedCategory === "periciales" ? "bg-primary-container text-on-primary" : "bg-surface-container-low text-on-surface-variant"}`}>Informes Periciales</button>
          </div>
        </div>
      </section>

      {/* Explorer Layout */}
      <section className="w-full px-margin-mobile md:px-margin-desktop py-space-xl">
        <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
          <aside className="lg:col-span-4 flex flex-col gap-space-lg">
            <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Clasificación Temática</h3>
                <span className="material-symbols-outlined text-sm text-outline">expand_less</span>
              </div>
              <div className="space-y-space-sm text-xs text-on-surface">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="flex items-center gap-2">
                    <input defaultChecked className="w-4 h-4 rounded text-primary-container accent-primary" type="checkbox"/>
                    <span className="group-hover:text-primary transition-colors">Criminología Clínica y Forense</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold">48</span>
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="flex items-center gap-2">
                    <input className="w-4 h-4 rounded text-primary-container accent-primary" type="checkbox"/>
                    <span className="group-hover:text-primary transition-colors">Cibercrimen e Informática Forense</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold">31</span>
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="flex items-center gap-2">
                    <input defaultChecked className="w-4 h-4 rounded text-primary-container accent-primary" type="checkbox"/>
                    <span className="group-hover:text-primary transition-colors">Victimología y Derechos Humanos</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold">29</span>
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="flex items-center gap-2">
                    <input className="w-4 h-4 rounded text-primary-container accent-primary" type="checkbox"/>
                    <span className="group-hover:text-primary transition-colors">Política Criminal y Penología</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold">19</span>
                </label>
              </div>
            </div>

            <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md border border-outline-variant/20">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Garantía y Acceso</h3>
              <div className="space-y-space-sm text-xs text-on-surface">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input defaultChecked className="w-4 h-4 rounded text-primary-container accent-primary" type="checkbox"/>
                  <span>Acceso Abierto Completo (CC-BY 4.0)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input className="w-4 h-4 rounded text-primary-container accent-primary" type="checkbox"/>
                  <span>Exclusivo Miembros ABOCCRIM</span>
                </label>
                <div className="p-space-sm bg-surface-container-low rounded-lg mt-space-sm flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-base mt-0.5">verified_user</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Todos los manuscritos cuentan con certificación de <strong>Doble Ciego</strong> expedido por el Comité de Ética y Dictamen Científico.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8 flex flex-col gap-space-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md p-space-md bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20">
              <div className="flex items-center gap-space-xs text-sm">
                <span className="text-base text-primary font-bold">{filteredArticles.length}</span>
                <span className="text-on-surface-variant">publicaciones científicas arbitradas</span>
              </div>
              <div className="flex items-center gap-space-sm text-xs">
                <label className="text-outline shrink-0">Ordenar por:</label>
                <select className="bg-surface-container-low rounded-lg py-1.5 px-3 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container cursor-pointer font-medium">
                  <option value="recent">Más recientes (2024)</option>
                  <option value="cited">Mayor número de citas</option>
                  <option value="relevance">Relevancia temática</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-space-lg">
              {filteredArticles.map((art) => (
                <article key={art.id} className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-space-md border border-outline-variant/20 hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs bg-surface-container-high text-primary font-semibold">{art.tipo}</span>
                      {art.openAccess ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-800 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">lock_open</span> Open Access
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-50 text-amber-800 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">lock</span> Restringido Miembros
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-outline">{art.fecha}</span>
                  </div>

                  <div className="space-y-space-xs">
                    <Link to="/detalle-publicacion">
                      <h3 className="text-lg font-bold text-primary hover:text-on-tertiary-container transition-colors">
                        {art.titulo}
                      </h3>
                    </Link>
                    <div className="flex items-center flex-wrap gap-x-space-md gap-y-1 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-secondary">person</span>
                        <Link to="/investigadores" className="text-primary font-medium hover:underline">{art.autor}</Link>
                      </span>
                      <span>·</span>
                      <span className="text-primary font-medium">{art.coautor}</span>
                    </div>
                  </div>

                  <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="text-on-surface font-medium">{art.revista}</span>
                    <span className="text-secondary font-mono hover:underline flex items-center gap-1 cursor-pointer">
                      <span className="material-symbols-outlined text-xs">link</span>
                      {art.doi}
                    </span>
                  </div>

                  <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed line-clamp-3">
                    {art.resumen}
                  </p>

                  <div className="flex flex-wrap items-center gap-space-xs pt-1">
                    {art.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-space-sm border-t border-outline-variant/20 flex items-center justify-between">
                    <Link to="/detalle-publicacion" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-secondary">
                      <span>Ver detalles y ficha completa</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                    <span className="text-xs text-outline font-mono">PDF Arbitrado (2.4 MB)</span>
                  </div>
                </article>
              ))}
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}
