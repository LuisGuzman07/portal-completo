import React from 'react'
import { ArrowUp, Mail, Shield, Download, ArrowRight, Code } from 'lucide-react'
import Logo from './Logo'
import { COMPANY } from '../config/company'

export default function Footer({ onOpenPrivacy, onOpenTerms }) {
  const currentYear = new Date().getFullYear()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToSection = (e, href) => {
    e.preventDefault()
    const target = href.replace('#', '')
    const el = document.getElementById(target)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-novablue-dark text-slate-300 pt-16 pb-12 border-t border-slate-800 relative overflow-hidden">
      {/* Background radial gradient accent */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-800">
          
          {/* Col 1: Brand Info & Identity (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <Logo size="md" light showTagline />
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-2">
              {COMPANY.description}
            </p>
            <div className="pt-2 text-xs text-novablue-sky font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Sistemas corporativos en producción</span>
            </div>
          </div>

          {/* Col 2: Navigation Links (lg:col-span-2) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Navegación
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              {COMPANY.navLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => scrollToSection(e, link.href)}
                    className="hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Services (lg:col-span-3) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Servicios Principales
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <a href="#servicios" onClick={(e) => scrollToSection(e, '#servicios')} className="hover:text-white transition-colors">
                  Desarrollo Web & Portales
                </a>
              </li>
              <li>
                <a href="#servicios" onClick={(e) => scrollToSection(e, '#servicios')} className="hover:text-white transition-colors">
                  Aplicaciones Android (APK)
                </a>
              </li>
              <li>
                <a href="#servicios" onClick={(e) => scrollToSection(e, '#servicios')} className="hover:text-white transition-colors">
                  Inteligencia Artificial y NLP
                </a>
              </li>
              <li>
                <a href="#servicios" onClick={(e) => scrollToSection(e, '#servicios')} className="hover:text-white transition-colors">
                  Sistemas Empresariales (ERP)
                </a>
              </li>
              <li>
                <a href="#servicios" onClick={(e) => scrollToSection(e, '#servicios')} className="hover:text-white transition-colors">
                  Bases de Datos & Arquitectura
                </a>
              </li>
              <li>
                <a href="#servicios" onClick={(e) => scrollToSection(e, '#servicios')} className="hover:text-white transition-colors">
                  Soporte & Mantenimiento
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Downloads & Contact info (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Canales y Distribución
            </h4>
            
            <a
              href="#descargas"
              onClick={(e) => scrollToSection(e, '#descargas')}
              className="inline-flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-novablue-sky/50 transition-all text-xs text-slate-200 group w-full"
            >
              <Download className="w-4 h-4 text-novablue-sky group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-semibold text-white">Centro de Descargas</div>
                <div className="text-[11px] text-slate-400">Instaladores y APKs de prueba</div>
              </div>
            </a>

            <div className="text-xs text-slate-400 space-y-1 pt-1">
              <div className="font-semibold text-slate-300">Contacto Directo:</div>
              <div className="font-mono text-novablue-sky">{COMPANY.contact.email}</div>
              <div className="text-[11px]">{COMPANY.contact.schedule}</div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {currentYear} <strong className="text-slate-200 font-semibold">{COMPANY.name}</strong>. Todos los derechos reservados.
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="hover:text-white transition-colors underline"
            >
              Política de Privacidad
            </button>
            <button
              type="button"
              onClick={onOpenTerms}
              className="hover:text-white transition-colors underline"
            >
              Términos de Servicio
            </button>
            <button
              type="button"
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Volver arriba"
              aria-label="Volver al inicio de la página"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  )
}
