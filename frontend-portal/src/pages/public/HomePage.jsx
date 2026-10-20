import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="flex flex-col w-full flex-1">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-surface-container-low to-background py-space-xl px-margin-mobile md:px-margin-desktop">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
          <div className="lg:col-span-7 space-y-space-md">
            <div className="inline-flex items-center gap-space-xs px-3 py-1.5 rounded-full bg-surface-container-high text-primary text-xs font-semibold">
              <span className="material-symbols-outlined text-sm text-primary-container">verified</span>
              <span>Sociedad Científica • Bolivia • Registro Académico Oficial No. 4920-BO</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-primary leading-tight">
              Academia Boliviana de Ciencias Criminológicas
            </h1>

            <p className="text-sm md:text-base text-on-surface-variant leading-relaxed max-w-2xl">
              Plataforma institucional y académica para la articulación de la evidencia científica, el peritaje de alto estándar y la gestión colegiada en el Estado Plurinacional de Bolivia.
            </p>

            {/* Direct Access Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-space-md">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  <span>Ingresar a Mi Panel ({user?.nombres})</span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/acceso-miembros"
                    className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">login</span>
                    <span>Iniciar Sesión</span>
                  </Link>
                  <Link
                    to="/acceso-miembros"
                    className="px-6 py-3 rounded-xl bg-surface-container-lowest hover:bg-surface-container-high text-primary font-bold text-sm border border-outline-variant/30 shadow-xs transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    <span>Registrar Cuenta</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Institutional Emblem Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col items-center text-center max-w-md w-full">
              <img
                src="/ABOCCRIM.webp"
                alt="Emblema Oficial ABOCCRIM"
                className="w-56 h-auto object-contain rounded-xl shadow-xs"
              />
              <h2 className="text-lg font-bold text-primary mt-4">ABOCCRIM</h2>
              <span className="text-[11px] uppercase tracking-widest text-on-surface-variant font-medium">
                Asociación Civil Científica
              </span>
              <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">
                Entidad científica dedicada al fomento, regulación y profundización de las ciencias penales, criminológicas y forenses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Pillars Section */}
      <section className="w-full py-space-xl px-margin-mobile md:px-margin-desktop bg-surface-container-lowest border-t border-outline-variant/20">
        <div className="max-w-[1200px] mx-auto space-y-space-lg">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-primary">Pilares Académicos e Institucionales</h2>
            <p className="text-xs md:text-sm text-on-surface-variant">
              Líneas de trabajo técnico y científico impulsadas por la Academia en todo el territorio nacional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg pt-4">
            <div className="p-space-lg rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">gavel</span>
              </div>
              <h3 className="text-base font-bold text-primary">Ciencias Penales y Forenses</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Investigación empírica en criminología clínica, psicología jurídica, victimología y dictámenes periciales especializados.
              </p>
            </div>

            <div className="p-space-lg rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-secondary text-on-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">shield_person</span>
              </div>
              <h3 className="text-base font-bold text-primary">Comunidad Colegiada</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Acreditación y articulación de investigadores, miembros titulares y comités académicos bajo altos estándares deontológicos.
              </p>
            </div>

            <div className="p-space-lg rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-on-tertiary-container text-on-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">policy</span>
              </div>
              <h3 className="text-base font-bold text-primary">Política Criminal y Seguridad</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Análisis criminológico orientado a la prevención del delito, criminología ambiental y políticas públicas basadas en evidencia.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
