import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-low text-on-surface pt-space-xl pb-space-lg mt-space-xl">
      <div className="w-full px-margin-mobile md:px-margin-desktop max-w-[1320px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-xl pb-space-xl border-b border-outline-variant/30">
          <div className="lg:col-span-2 space-y-space-md pr-space-lg">
            <div className="flex items-center gap-space-sm">
              <img
                src="/ABOCCRIM.webp"
                alt="Logo ABOCCRIM"
                className="h-10 w-auto object-contain rounded"
              />
              <span className="text-lg font-bold text-primary">ABOCCRIM</span>
            </div>
            <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
              Sociedad civil de carácter científico, técnico e investigativo constituida formalmente para fomentar, regular y profundizar los estudios de las ciencias penales, criminológicas y forenses en el Estado Plurinacional de Bolivia y la región andina.
            </p>
            <div className="flex items-center gap-space-sm text-xs text-on-surface-variant pt-space-xs">
              <span className="px-2 py-1 rounded bg-surface-container-high text-primary font-semibold">
                Registro Científico Académico No. 4920-BO
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-on-surface mb-space-md">Áreas Científicas</h3>
            <ul className="space-y-space-sm text-sm text-on-surface-variant">
              <li><span className="hover:text-primary transition-colors cursor-pointer">Criminología Clínica y Forense</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Sociología Jurídico-Penal</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Victimología y Derechos Humanos</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Política Criminal Comparada</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Ciencia de Datos y PLN Forense</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold text-on-surface mb-space-md">Repositorio y Publicaciones</h3>
            <ul className="space-y-space-sm text-sm text-on-surface-variant">
              <li><Link to="/repositorio-academico" className="hover:text-primary transition-colors">Revista Boliviana de Criminología</Link></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Actas y Conferencias Magistrales</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Comité de Ética y Dictamen Ciego</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Directrices para Autores</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Bases de Datos Abiertas (Open Data)</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold text-on-surface mb-space-md">Gobernanza y Sedes</h3>
            <ul className="space-y-space-sm text-sm text-on-surface-variant">
              <li><span className="hover:text-primary transition-colors cursor-pointer">Estatuto Orgánico y Reglamentos</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Consejo Superior Consultivo</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Capítulos Departamentales</span></li>
              <li><Link to="/acceso-miembros" className="hover:text-primary transition-colors">Membresías e Incorporación</Link></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Portal de Transparencia</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md text-xs text-on-surface-variant">
          <div>© 2025 Academia Boliviana de Ciencias Criminológicas (ABOCCRIM). Todos los derechos reservados. Depósito Legal y Registro Académico Vigente.</div>
          <div className="flex items-center gap-space-lg">
            <span>Acreditación Académica CONAC</span>
            <span>Indexado en Latindex / Dialnet</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Políticas de Privacidad</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Aviso Legal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
