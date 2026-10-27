import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-low text-on-surface pt-space-xl pb-space-lg mt-auto border-t border-outline-variant/20">
      <div className="w-full px-margin-mobile md:px-margin-desktop max-w-[1320px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl pb-space-xl border-b border-outline-variant/30">
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
          </div>

          <div>
            <h3 className="text-base font-bold text-on-surface mb-space-md">Áreas Institucionales</h3>
            <ul className="space-y-space-sm text-sm text-on-surface-variant">
              <li>Criminología Clínica y Forense</li>
              <li>Sociología Jurídico-Penal</li>
              <li>Victimología y Derechos Humanos</li>
              <li>Política Criminal Comparada</li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold text-on-surface mb-space-md">Acceso y Gestión</h3>
            <ul className="space-y-space-sm text-sm text-on-surface-variant">
              <li>
                <Link to="/investigadores" className="hover:text-primary transition-colors font-medium">
                  Directorio de Investigadores
                </Link>
              </li>
              <li>
                <Link to="/acceso-miembros" className="hover:text-primary transition-colors font-medium">
                  Portal de Acceso
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-primary transition-colors font-medium">
                  Portal Institucional
                </Link>
              </li>
              <li>Estatuto Orgánico y Reglamentos</li>
            </ul>
          </div>
        </div>

        <div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md text-xs text-on-surface-variant">
          <div>© 2026 Academia Boliviana de Ciencias Criminológicas (ABOCCRIM). Todos los derechos reservados.</div>
        </div>
      </div>
    </footer>
  );
}
