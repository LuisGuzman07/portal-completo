import React from 'react'
import { Target, Compass, Award, ShieldCheck, Lightbulb, Lock, Users, Building2, Check } from 'lucide-react'
import { COMPANY } from '../config/company'

export default function About() {
  const valueIcons = {
    Lightbulb: Lightbulb,
    ShieldCheck: ShieldCheck,
    Award: Award,
    Lock: Lock,
    Users: Users
  }

  return (
    <section id="nosotros" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-novablue-primary text-xs font-semibold tracking-wide uppercase mb-3">
            <Building2 className="w-3.5 h-3.5 text-novablue-primary" />
            <span>Identidad Institucional</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-novablue-dark tracking-tight">
            Sobre NovaSoft Solutions
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Una organización de ingeniería de software orientada a construir soluciones tecnológicas eficientes, modernas y con altos estándares de calidad.
          </p>
        </div>

        {/* Identity Cards: Quiénes Somos, Misión, Visión */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          {/* Quiénes somos */}
          <div className="bg-gradient-to-b from-novaslate-50 to-white rounded-2xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-novablue-primary flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6 text-novablue-primary" />
              </div>
              <h3 className="text-xl font-bold text-novablue-dark mb-3">Quiénes Somos</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {COMPANY.description}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-novablue-primary flex items-center gap-1.5">
              <span>{COMPANY.slogan}</span>
            </div>
          </div>

          {/* Misión */}
          <div className="bg-gradient-to-b from-novaslate-50 to-white rounded-2xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-sky-600" />
              </div>
              <h3 className="text-xl font-bold text-novablue-dark mb-3">Nuestra Misión</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {COMPANY.mission}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-sky-600 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Enfoque en accesibilidad y eficiencia
            </div>
          </div>

          {/* Visión */}
          <div className="bg-gradient-to-b from-novaslate-50 to-white rounded-2xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                <Compass className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-novablue-dark mb-3">Nuestra Visión</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {COMPANY.vision}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-indigo-600 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Calidad e innovación sostenida
            </div>
          </div>

        </div>

        {/* Corporate Values */}
        <div className="bg-novablue-dark rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-novablue-sky">Pilares Fundamentales</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold mt-1">Nuestros Valores Corporativos</h3>
              <p className="text-slate-300 text-sm mt-2">
                Principios éticos y técnicos que rigen la arquitectura y entrega de cada solución de software.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {COMPANY.values.map((val, idx) => {
                const IconComponent = valueIcons[val.icon] || ShieldCheck

                return (
                  <div
                    key={val.title}
                    className="bg-[#101D42]/80 border border-blue-900/60 rounded-xl p-5 hover:border-novablue-sky/50 transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-novablue-sky border border-blue-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <IconComponent className="w-5 h-5 text-novablue-sky" />
                      </div>
                      <div className="text-xs font-mono text-slate-400 mb-1">0{idx + 1}</div>
                      <h4 className="text-base font-bold text-white mb-2">{val.title}</h4>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {val.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
