import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const SECTIONS = [
  { id: 'quienes-somos', label: '¿Quiénes somos?', icon: 'corporate_fare' },
  { id: 'historia', label: 'Historia', icon: 'history_edu' },
  { id: 'principios', label: 'Principios Rectores', icon: 'verified_user' },
  { id: 'autoridades', label: 'Órganos y Categorías', icon: 'account_tree' },
  { id: 'investigacion', label: 'Ejes de Investigación', icon: 'science' },
  { id: 'normativa', label: 'Normativa y Admisión', icon: 'gavel' },
];

const PRINCIPIOS_DATA = [
  {
    principio: 'Rigor científico',
    icono: 'biotech',
    aplicacion: 'Todo contenido académico deberá identificar autoría, metodología y fuentes.',
  },
  {
    principio: 'Interdisciplinariedad',
    icono: 'hub',
    aplicacion: 'Integrará criminología, criminalística, derecho, psicología, medicina, sociología y ciencias forenses.',
  },
  {
    principio: 'Acceso al conocimiento',
    icono: 'lock_open_right',
    aplicacion: 'Priorizará la difusión del conocimiento científico con criterios de calidad.',
  },
  {
    principio: 'Ética',
    icono: 'balance',
    aplicacion: 'Protección de víctimas, datos sensibles y derechos humanos.',
  },
  {
    principio: 'Memoria institucional',
    icono: 'inventory_2',
    aplicacion: 'Conservación permanente de investigaciones y producción académica.',
  },
  {
    principio: 'Colaboración',
    icono: 'handshake',
    aplicacion: 'Trabajo conjunto entre universidades e instituciones.',
  },
  {
    principio: 'Innovación',
    icono: 'psychology',
    aplicacion: 'Preparación para inteligencia artificial, análisis documental y búsqueda semántica.',
  },
  {
    principio: 'Independencia institucional',
    icono: 'shield',
    aplicacion: 'El conocimiento pertenecerá a ABOCCRIM y no dependerá de personas particulares.',
  },
];

export default function InstitucionalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const seccionParam = searchParams.get('seccion');

  const [activeTab, setActiveTab] = useState(
    SECTIONS.some((s) => s.id === seccionParam) ? seccionParam : 'quienes-somos'
  );

  useEffect(() => {
    if (seccionParam && SECTIONS.some((s) => s.id === seccionParam)) {
      setActiveTab(seccionParam);
    }
  }, [seccionParam]);

  const handleTabChange = (id) => {
    setActiveTab(id);
    setSearchParams({ seccion: id });
  };

  return (
    <div className="flex flex-col w-full flex-1 bg-gradient-to-b from-surface-container-low to-background py-space-xl px-margin-mobile md:px-margin-desktop">
      <div className="max-w-[1200px] mx-auto w-full space-y-8">
        {/* Header Hero */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">verified</span>
              Academia Boliviana de Ciencias Criminológicas
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
              <span className="material-symbols-outlined text-sm">gavel</span>
              Personería Jurídica R.A. N.º 232/2023 · Testimonio N.º 299/2023
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-primary leading-tight">
              Academia Boliviana de Ciencias Criminológicas
            </h1>
            <p className="text-base md:text-xl font-medium text-secondary leading-snug max-w-4xl">
              Plataforma institucional y académica para la articulación de la evidencia científica, el peritaje de alto estándar y la gestión colegiada en el Estado Plurinacional de Bolivia.
            </p>
          </div>

          <p className="text-sm md:text-base text-on-surface-variant max-w-4xl leading-relaxed">
            Infraestructura académica y tecnológica destinada a preservar, producir, organizar y difundir el conocimiento criminológico generado en Bolivia y Latinoamérica, articulando a investigadores, universidades, profesionales, estudiantes e instituciones.
          </p>
        </header>

        {/* Navigation Tabs Bar */}
        <div className="bg-surface-container-lowest p-2 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => handleTabChange(sec.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === sec.id
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-base">{sec.icon}</span>
              <span>{sec.label}</span>
            </button>
          ))}
          <Link
            to="/convenios"
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-secondary hover:text-primary hover:bg-surface-container-low transition-all flex items-center gap-1.5 ml-auto"
          >
            <span className="material-symbols-outlined text-base">handshake</span>
            <span>Convenios Vigentes</span>
            <span className="text-xs">↗</span>
          </Link>
        </div>

        {/* TAB 1: ¿QUIÉNES SOMOS? */}
        {activeTab === 'quienes-somos' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Cabecera institucional */}
            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant/30 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                Identidad Institucional
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-primary">
                La Academia Boliviana De Ciencias Criminológicas (ABOCCRIM)
              </h2>
            </div>

            {/* Misión y Visión */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Misión */}
              <div className="lg:col-span-6 bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">explore</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary">Misión</h3>
                  <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">
                    Establecerse como orientación institucional promover la investigación, la difusión y el desarrollo interdisciplinario de las ciencias criminológicas, así como preservar, producir, organizar y transferir conocimiento científico relacionado con la violencia, la criminalidad y el sistema de justicia.
                  </p>
                </div>
                <div className="pt-4 border-t border-outline-variant/20 text-xs font-semibold text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  <span>Compromiso con el rigor científico y deontológico</span>
                </div>
              </div>

              {/* Visión */}
              <div className="lg:col-span-6 bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">visibility</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary">Visión</h3>
                  <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">
                    La propuesta estratégica de ABOCCRIM plantea evolucionar de una academia centrada principalmente en actividades hacia una institución capaz de producir, conservar y transferir conocimiento criminológico. En ese contexto, el documento institucional presenta una iniciativa denominada Sistema Boliviano de Conocimiento Criminológico, concebida como una visión de largo plazo para la investigación, publicación científica, divulgación académica, formación especializada, producción audiovisual, análisis criminológico y vinculación entre universidad y sociedad.
                  </p>
                </div>
                <div className="pt-4 border-t border-outline-variant/20 text-xs font-semibold text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">hub</span>
                  <span>Articulación permanente entre academia, justicia y sociedad</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HISTORIA */}
        {activeTab === 'historia' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant/30 shadow-xs space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Origen y Consolidación Notarial
                </span>
                <h2 className="text-2xl font-bold text-primary">
                  Trayectoria Histórica e Hitos Estatutarios
                </h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  La Academia Boliviana de Ciencias Criminológicas nació en Santa Cruz de la Sierra como una iniciativa interdisciplinaria de académicos, juristas, médicos forenses e investigadores sociales con la convicción de dotar a Bolivia de una entidad de referencia técnica independiente en las ciencias criminológicas y penales.
                </p>
              </div>

              {/* Timeline */}
              <div className="relative border-l-2 border-primary/20 ml-4 pl-6 space-y-8">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-surface-container-lowest" />
                  <span className="text-xs font-mono font-bold text-secondary uppercase">Fundación e Iniciativa Colegiada</span>
                  <h3 className="text-lg font-bold text-primary mt-1">Núcleo Académico Interdisciplinario</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                    Conformación del núcleo fundador de profesionales en derecho penal, medicina legal, psicología forense y sociología criminal para coordinar actividades científicas y suplir la dispersión investigativa en Bolivia.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-surface-container-lowest" />
                  <span className="text-xs font-mono font-bold text-secondary uppercase">27 de abril de 2023</span>
                  <h3 className="text-lg font-bold text-primary mt-1">Reconocimiento de Personalidad Jurídica</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                    Otorgamiento de la personería jurídica formal mediante la <strong>Resolución Administrativa N.º 232/2023</strong> emitida por el Gobierno Autónomo Departamental de Santa Cruz, consolidando su naturaleza de persona colectiva sin fines lucrativos con plena capacidad de derecho.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-surface-container-lowest" />
                  <span className="text-xs font-mono font-bold text-secondary uppercase">4 de julio de 2023</span>
                  <h3 className="text-lg font-bold text-primary mt-1">Protocolización Notarial Definitiva</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                    Protocolización oficial mediante el <strong>Instrumento Público N.º 299/2023</strong> (Testimonio N.º 299/2023) ante la Notaría de Gobierno del Departamento de Santa Cruz, consagrando formalmente el estatuto orgánico y reglamentos de gobernanza institucional.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-600 border-4 border-surface-container-lowest" />
                  <span className="text-xs font-mono font-bold text-emerald-800 uppercase">Evolución Estratégica</span>
                  <h3 className="text-lg font-bold text-primary mt-1">Modernización y Plataforma Digital Académica</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                    Evolución institucional hacia un ecosistema digital de alcance nacional: plataforma con repositorio indexado, peritaje de alto estándar, perfiles de investigadores acreditados y observatorio analítico al servicio de la justicia y las políticas públicas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

                {/* TAB 4: PRINCIPIOS RECTORES */}
        {activeTab === 'principios' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant/30 shadow-xs space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Bases Éticas y Científicas
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-primary">
                  Principios Rectores Institucionales
                </h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  La plataforma digital y la gestión del conocimiento criminológico de ABOCCRIM se rigen por ocho principios fundamentales:
                </p>
              </div>

              {/* Grid de Principios */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {PRINCIPIOS_DATA.map((p, idx) => (
                  <div
                    key={p.principio}
                    className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between space-y-3 hover:border-primary/40 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <span className="material-symbols-outlined text-secondary text-xl">
                          {p.icono}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-primary">{p.principio}</h3>
                    </div>
                    <div className="pt-2 border-t border-outline-variant/20">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block mb-1">
                        Aplicación:
                      </span>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {p.aplicacion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ÓRGANOS Y CATEGORÍAS */}
        {activeTab === 'autoridades' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Órganos Colegiados */}
            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant/30 shadow-xs space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Gobernanza Estatutaria
                </span>
                <h2 className="text-2xl font-bold text-primary">
                  Órganos Institucionales de ABOCCRIM
                </h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  La estructura de gobierno está regida por los estatutos institucionales, garantizando decisiones colegiadas y separación entre la dirección administrativa y la función evaluadora:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h3 className="font-bold text-sm text-primary">Asamblea de Asociados</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Máxima instancia de deliberación y toma de decisiones estatutarias, presupuestarias y normativas de la Academia.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h3 className="font-bold text-sm text-primary">Consejo Ejecutivo de Administración</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Órgano directivo encargado de la conducción ejecutiva institucional, representación legal, gestión de convenios y secretarías especializadas.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h3 className="font-bold text-sm text-primary">Consejo Académico</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Instancia colegiada responsable del arbitraje científico, validación de líneas de investigación y evaluación de méritos de postulantes a membresía.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <h3 className="font-bold text-sm text-primary">Comité / Tribunal de Ética</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Órgano estatutario encargado de los asuntos deontológicos, resolución de conflictos de interés y preservación de la probidad en la práctica pericial.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2 sm:col-span-2 lg:col-span-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    5
                  </div>
                  <h3 className="font-bold text-sm text-primary">Premio "Granja de Espejos: contra la violencia"</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Reconocimiento honorífico estatutario concebido para galardonar aportes investigativos y de campo sobresalientes en la prevención y combate a la criminalidad.
                  </p>
                </div>
              </div>
            </div>

            {/* 5 Categorías de Miembros Estatutarios */}
            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant/30 shadow-xs space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Estructura Estatutaria de Miembros
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-primary">
                  Cinco Categorías de Miembros de ABOCCRIM
                </h3>
                <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
                  El Estatuto define taxativamente cinco calidades de miembros con derechos, deberes y roles diferenciados en la vida científica de la Academia:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Miembros de Número */}
                <div className="p-5 rounded-2xl border border-primary/20 bg-surface-container-low flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-on-primary text-[11px] font-bold">
                      <span className="material-symbols-outlined text-xs">workspace_premium</span>
                      Miembro de Número
                    </div>
                    <h4 className="font-bold text-base text-primary">Miembros Plenos</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Académicos titulares con plenas facultades deliberativas. Cuentan con derecho a voz y voto en las asambleas y son elegibles para integrar los cargos de los órganos directivos.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-outline-variant/20 text-[11px] text-on-surface-variant font-medium">
                    <strong>Requisito:</strong> Producción científica continua, respaldo de trayectoria y acreditación plena ante la Academia.
                  </div>
                </div>

                {/* 2. Miembros Honorarios */}
                <div className="p-5 rounded-2xl border border-secondary/20 bg-surface-container-low flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-on-secondary text-[11px] font-bold">
                      <span className="material-symbols-outlined text-xs">military_tech</span>
                      Miembro Honorario
                    </div>
                    <h4 className="font-bold text-base text-primary">Distinción de Alto Mérito</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Reconocimiento especial conferido por la Academia a personalidades de eminente trayectoria o aportes extraordinarios a las ciencias criminológicas nacionales o universales.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-outline-variant/20 text-[11px] text-on-surface-variant font-medium">
                    <strong>Condición:</strong> Voz consultiva en la asamblea y exención de cuotas ordinarias estatutarias.
                  </div>
                </div>

                {/* 3. Académicos Adherentes */}
                <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-highest text-primary text-[11px] font-bold">
                      <span className="material-symbols-outlined text-xs">volunteer_activism</span>
                      Académico Adherente
                    </div>
                    <h4 className="font-bold text-base text-primary">Colaboradores Institucionales</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Profesionales y benefactores que realizan aportes técnicos, logísticos y contribuciones voluntarias periódicas para sustentar los proyectos y fines de la Asociación.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-outline-variant/20 text-[11px] text-on-surface-variant font-medium">
                    <strong>Beneficios:</strong> Acceso preferente a eventos científicos, cursos y publicaciones especializadas.
                  </div>
                </div>

                {/* 4. Académicos Asociados */}
                <div className="p-5 rounded-2xl border border-primary/20 bg-surface-container-low flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                      <span className="material-symbols-outlined text-xs">science</span>
                      Académico Asociado
                    </div>
                    <h4 className="font-bold text-base text-primary">Investigadores Adscritos</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Investigadores vinculados activamente a programas de investigación, proyectos de formación o publicaciones del Repositorio Académico de ABOCCRIM.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-outline-variant/20 text-[11px] text-on-surface-variant font-medium">
                    <strong>Proyección:</strong> Pueden postular a la categoría de Miembro de Número al consolidar su producción científica.
                  </div>
                </div>

                {/* 5. Académicos Correspondientes */}
                <div className="p-5 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex flex-col justify-between space-y-3 md:col-span-2 lg:col-span-2">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/15 text-secondary text-[11px] font-bold">
                      <span className="material-symbols-outlined text-xs">public</span>
                      Académico Correspondiente
                    </div>
                    <h4 className="font-bold text-base text-primary">Embajadores Científicos Internacionales</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Criminólogos, forenses y juristas destacados radicados fuera de la sede departamental o en el extranjero que desarrollan actividades afines a los propósitos de ABOCCRIM y actúan como pares evaluadores externos y enlaces interinstitucionales.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-outline-variant/20 text-[11px] text-on-surface-variant font-medium">
                    <strong>Alcance:</strong> Facilitan la cooperación internacional, homologación de estándares periciales e intercambio académico.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: EJES Y LÍNEAS DE INVESTIGACIÓN */}
        {activeTab === 'investigacion' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Cuatro Ejes Piloto de Investigación */}
            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant/30 shadow-xs space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-xs">rocket_launch</span>
                  Proyectos en Marcha
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-primary">
                  Cuatro Ejes Temáticos Piloto de Investigación
                </h2>
                <p className="text-sm text-on-surface-variant leading-relaxed max-w-3xl">
                  ABOCCRIM ha priorizado cuatro frentes de investigación empírica aplicados a la realidad criminológica boliviana, cada uno estructurado con justificación técnica, actores clave y un producto inicial medible:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Eje 1 */}
                <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-secondary uppercase">Eje Piloto 1</span>
                      <span className="material-symbols-outlined text-primary text-xl">traffic</span>
                    </div>
                    <h3 className="text-lg font-bold text-primary">Siniestralidad Vial y Factor Humano</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Análisis criminológico y accidentológico de patrones espacio-temporales, factores de riesgo y conducta vial en el área metropolitana de Santa Cruz de la Sierra.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                      Producto Inicial Definido:
                    </span>
                    <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-primary">map</span>
                      Mapa de puntos críticos e informe técnico de factores de riesgo vial
                    </p>
                  </div>
                </div>

                {/* Eje 2 */}
                <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-secondary uppercase">Eje Piloto 2</span>
                      <span className="material-symbols-outlined text-primary text-xl">shield_person</span>
                    </div>
                    <h3 className="text-lg font-bold text-primary">Violencia de Género y Feminicidios</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Investigación procesal y criminológica de la respuesta judicial ante la violencia contra las mujeres, valoración del riesgo pericial y rutas de atención a sobrevivientes.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                      Producto Inicial Definido:
                    </span>
                    <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-primary">assignment_turned_in</span>
                      Diagnóstico de rutas críticas y propuesta de coordinación interinstitucional
                    </p>
                  </div>
                </div>

                {/* Eje 3 */}
                <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-secondary uppercase">Eje Piloto 3</span>
                      <span className="material-symbols-outlined text-primary text-xl">psychology_alt</span>
                    </div>
                    <h3 className="text-lg font-bold text-primary">Salud Mental y Drogodependencia</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Estudio de la prevalencia de trastornos de salud mental, adicciones a sustancias psicotrópicas y su relación con la reincidencia delictiva en el sistema penal cruceño.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                      Producto Inicial Definido:
                    </span>
                    <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-primary">medical_services</span>
                      Mapa de servicios, factores de riesgo y ruta de derivación asistencial
                    </p>
                  </div>
                </div>

                {/* Eje 4 */}
                <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-secondary uppercase">Eje Piloto 4</span>
                      <span className="material-symbols-outlined text-primary text-xl">connecting_airports</span>
                    </div>
                    <h3 className="text-lg font-bold text-primary">Trata y Tráfico Ilícito de Personas</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Identificación de rutas clandestinas, mercados ilícitos transfronterizos y dinámicas de captación en la frontera oriental y zonas de tránsito internacional en Bolivia.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                      Producto Inicial Definido:
                    </span>
                    <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-primary">security</span>
                      Diagnóstico de riesgos y protocolo preventivo de articulación comunitaria
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Siete Áreas Temáticas Permanentes del Sistema */}
            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant/30 shadow-xs space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Taxonomía de Conocimiento Institucional
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-primary">
                  Siete Áreas Temáticas Permanentes de ABOCCRIM
                </h3>
                <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed max-w-3xl">
                  El conocimiento científico, repositorio de publicaciones y acreditación de investigadores se organizan formalmente a través de siete ejes permanentes y sus subáreas especializadas:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Criminología */}
                <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-lg">psychology</span>
                    <span>1. Criminología</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Estudio interdisciplinario de las conductas antisociales, etiología del delito y control social.</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['Criminología Clínica', 'Criminología Crítica', 'Criminología Ambiental', 'Criminología Corporativa'].map((sub) => (
                      <span key={sub} className="px-2 py-0.5 rounded-md bg-surface-container-lowest text-primary text-[11px] font-medium border border-outline-variant/20">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. Criminalística */}
                <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-lg">search_insights</span>
                    <span>2. Criminalística</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Aplicación de métodos y técnicas de investigación científica del hecho delictivo y sus indicios materiales.</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['Escena del Crimen', 'Balística Forense', 'Documentología', 'Huellas y Lofoscopia'].map((sub) => (
                      <span key={sub} className="px-2 py-0.5 rounded-md bg-surface-container-lowest text-primary text-[11px] font-medium border border-outline-variant/20">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3. Ciencias Forenses */}
                <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-lg">biotech</span>
                    <span>3. Ciencias Forenses</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Disciplinas biomédicas y científicas orientadas al auxilio pericial de la administración de justicia.</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['Medicina Legal', 'Psicología Forense', 'Antropología Forense', 'Genética Forense / ADN'].map((sub) => (
                      <span key={sub} className="px-2 py-0.5 rounded-md bg-surface-container-lowest text-primary text-[11px] font-medium border border-outline-variant/20">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4. Victimología */}
                <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-lg">support_agent</span>
                    <span>4. Victimología</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Atención integral, mitigación del daño y estudio científico de los procesos de victimización.</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['Atención a Víctimas', 'Reparación Integral', 'Victimización Secundaria', 'Restitución de Derechos'].map((sub) => (
                      <span key={sub} className="px-2 py-0.5 rounded-md bg-surface-container-lowest text-primary text-[11px] font-medium border border-outline-variant/20">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 5. Sistema Penal */}
                <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-lg">balance</span>
                    <span>5. Sistema Penal</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Dogmática jurídica penal, garantías procesales y gestión de los regímenes de ejecución penitenciaria.</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['Política Criminal', 'Proceso Penal', 'Ejecución Penal', 'Justicia Restaurativa'].map((sub) => (
                      <span key={sub} className="px-2 py-0.5 rounded-md bg-surface-container-lowest text-primary text-[11px] font-medium border border-outline-variant/20">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 6. Seguridad */}
                <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-lg">local_police</span>
                    <span>6. Seguridad</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Estrategias de prevención situacional, seguridad pública, penitenciaria y gobernanza institucional.</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['Seguridad Ciudadana', 'Seguridad Penitenciaria', 'Seguridad Institucional', 'Análisis Delictual'].map((sub) => (
                      <span key={sub} className="px-2 py-0.5 rounded-md bg-surface-container-lowest text-primary text-[11px] font-medium border border-outline-variant/20">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 7. Violencia */}
                <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-3 md:col-span-2 lg:col-span-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-lg">group_remove</span>
                    <span>7. Violencia, Conflicto y Vulnerabilidad</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Fenomenología de la violencia interpersonal, colectiva y estructural en grupos en situación de vulnerabilidad.</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['Violencia de Género', 'Violencia contra la Niñez', 'Trata y Tráfico Ilícito', 'Violencia Social e Interpersonal'].map((sub) => (
                      <span key={sub} className="px-2 py-0.5 rounded-md bg-surface-container-lowest text-primary text-[11px] font-medium border border-outline-variant/20">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: NORMATIVA Y ADMISIÓN */}
        {activeTab === 'normativa' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline-variant/30 shadow-xs space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Legalidad y Estatutos
                </span>
                <h2 className="text-2xl font-bold text-primary">
                  Marco Legal e Instrumentos Notariales
                </h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Documentación formal y resoluciones administrativas que acreditan la personería jurídica de la Academia ante las autoridades competentes del Estado Plurinacional de Bolivia:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-surface-container-low border border-primary/20 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-xl">description</span>
                    <span>Resolución Administrativa N.º 232/2023</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    <strong>Fecha:</strong> 27 de abril de 2023.<br />
                    Reconocimiento oficial de Personalidad Jurídica para ABOCCRIM como persona colectiva sin fines de lucro en el Departamento de Santa Cruz.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-surface-container-low border border-primary/20 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-xl">verified</span>
                    <span>Instrumento Público N.º 299/2023</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    <strong>Fecha:</strong> 4 de julio de 2023.<br />
                    Protocolización notarial definitiva del estatuto orgánico y reglamentos ante la Notaría de Gobierno del Departamento de Santa Cruz (Testimonio N.º 299/2023).
                  </p>
                </div>
              </div>

              {/* Procedimiento de Admisión y Modernización Inteligente */}
              <div className="pt-4 border-t border-outline-variant/20 space-y-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold">
                    <span className="material-symbols-outlined text-xs">auto_awesome</span>
                    Admisión Asistida por Inteligencia Digital
                  </div>
                  <h3 className="text-lg font-bold text-primary">
                    Procedimiento de Incorporación y Acreditación de Miembros
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    La plataforma ABOCCRIM moderniza el proceso tradicional: el análisis estructurado de CV y la validación técnica en línea agilizan la postulación, garantizando trazabilidad y cumplimiento de los requisitos estatutarios:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest space-y-1">
                    <span className="font-bold text-primary block">1. Postulación en Línea</span>
                    <span className="text-outline text-[11px] block">Carga de datos personales, CV académico y títulos respaldatorios vía portal web.</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest space-y-1">
                    <span className="font-bold text-primary block">2. Análisis Asistido del CV</span>
                    <span className="text-outline text-[11px] block">Extracción estructurada de áreas de especialidad, grados académicos y publicaciones.</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest space-y-1">
                    <span className="font-bold text-primary block">3. Verificación de Requisitos</span>
                    <span className="text-outline text-[11px] block">Control automatizado y documental frente a los criterios de la categoría postulada.</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest space-y-1">
                    <span className="font-bold text-primary block">4. Dictamen Técnico y Evaluación</span>
                    <span className="text-outline text-[11px] block">Emisión de dictamen con trazabilidad y elevación a la instancia estatutaria correspondiente.</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest space-y-1">
                    <span className="font-bold text-primary block">5. Resolución del Consejo</span>
                    <span className="text-outline text-[11px] block">Ratificación formal de la admisión y asignación de la categoría estatutaria.</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest space-y-1">
                    <span className="font-bold text-primary block">6. Alta en el Directorio Digital</span>
                    <span className="text-outline text-[11px] block">Generación de credencial digital e indexación en el directorio público de investigadores.</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/solicitud-incorporacion"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs transition-all"
                  >
                    <span className="material-symbols-outlined text-base">person_add</span>
                    <span>Iniciar Postulación a Membresía</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
