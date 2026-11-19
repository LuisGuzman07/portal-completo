import React from 'react'
import { ArrowRight, Sparkles, Terminal, Shield, Zap, CheckCircle2, Layers, Cpu, Database, Server } from 'lucide-react'

export default function Hero({ onExploreServices, onGetQuote }) {
  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="inicio" className="relative pt-28 pb-16 lg:pt-36 lg:pb-28 overflow-hidden bg-gradient-to-b from-novaslate-50 via-white to-novaslate-50">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-blue-300/20 via-sky-200/20 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500/10 blur-2xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-novablue-primary text-xs sm:text-sm font-semibold tracking-wide shadow-sm animate-pulse-slow">
              <Sparkles className="w-4 h-4 text-novablue-sky" />
              <span>Ingeniería de Software & Transformación Digital</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-novablue-dark tracking-tight leading-[1.12]">
              Desarrollamos el{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-novablue-primary via-blue-600 to-novablue-sky">
                software
              </span>{' '}
              que impulsa tu futuro
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed mx-auto lg:mx-0">
              En <strong className="font-semibold text-novablue-dark">NovaSoft Solutions</strong> transformamos tus ideas en aplicaciones web, sistemas empresariales y soluciones inteligentes adaptadas a tus necesidades.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                type="button"
                onClick={() => onExploreServices ? onExploreServices() : scrollTo('servicios')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-novablue-primary to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-glow-md transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <span>Explorar servicios</span>
                <ArrowRight className="w-4 h-4 text-novablue-sky" />
              </button>

              <button
                type="button"
                onClick={() => onGetQuote ? onGetQuote() : scrollTo('contacto')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold border border-slate-300 shadow-sm hover:border-slate-400 transition-all duration-200"
              >
                <span>Solicitar cotización</span>
              </button>
            </div>

            {/* Trust Points */}
            <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-700">Arquitectura Limpia</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-700">Docker & Cloud</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-700">Soporte Continuo</span>
              </div>
            </div>
          </div>

          {/* Right Column: SaaS Tech Mockup / Dashboard Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Code & Architecture Terminal Card */}
              <div className="relative rounded-2xl bg-novablue-dark border border-slate-800 shadow-2xl overflow-hidden text-slate-200">
                
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#080F24] border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    <span className="ml-2 text-xs font-mono text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-novablue-sky" />
                      NovaSoftKernel.ts
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[11px] font-mono text-emerald-400 font-medium">Build: Stable</span>
                  </div>
                </div>

                {/* Terminal Body with Code */}
                <div className="p-5 font-mono text-xs sm:text-[13px] leading-relaxed space-y-2 bg-[#0B1530]/95">
                  <div className="text-slate-500">// Arquitectura corporativa de alta disponibilidad</div>
                  <div>
                    <span className="text-purple-400">const</span> <span className="text-sky-300">enterpriseSuite</span> = <span className="text-amber-300">new</span> <span className="text-yellow-300">NovaSoftSolution</span>({'{'}
                  </div>
                  <div className="pl-4 text-slate-300">
                    <span className="text-sky-400">frontend</span>: <span className="text-emerald-300">'React + Vite + Tailwind'</span>,
                  </div>
                  <div className="pl-4 text-slate-300">
                    <span className="text-sky-400">infra</span>: <span className="text-emerald-300">'Docker + Nginx Reverse Proxy'</span>,
                  </div>
                  <div className="pl-4 text-slate-300">
                    <span className="text-sky-400">modules</span>: [<span className="text-emerald-300">'NovaGest'</span>, <span className="text-emerald-300">'NovaDocs'</span>, <span className="text-emerald-300">'NovaMobile'</span>],
                  </div>
                  <div className="pl-4 text-slate-300">
                    <span className="text-sky-400">scalability</span>: <span className="text-rose-400">true</span>,
                  </div>
                  <div>{'}'});</div>
                  <div className="pt-2">
                    <span className="text-purple-400">await</span> enterpriseSuite.<span className="text-blue-400">deploy</span>({'{'} <span className="text-sky-400">target</span>: <span className="text-emerald-300">'Production_Cloud'</span> {'}'});
                  </div>
                  <div className="text-emerald-400 pt-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Listo: 100% servicios activos y funcionales</span>
                  </div>
                </div>

                {/* Micro Metrics Footer */}
                <div className="px-5 py-3 bg-[#070D20] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" /> Latencia: &lt; 35ms
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-novablue-sky" /> TLS 1.3 / HSTS
                  </span>
                </div>
              </div>

              {/* Floating Badge 1: Top Right */}
              <div className="absolute -top-6 -right-4 sm:-right-6 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl p-3 shadow-xl flex items-center gap-3 animate-float-slow">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-novablue-primary flex items-center justify-center font-bold">
                  <Server className="w-5 h-5 text-novablue-primary" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Despliegue</div>
                  <div className="text-sm font-bold text-novablue-dark">GCP & Docker Ready</div>
                </div>
              </div>

              {/* Floating Badge 2: Bottom Left */}
              <div className="absolute -bottom-6 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl p-3 shadow-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Integridad</div>
                  <div className="text-sm font-bold text-novablue-dark">Ingeniería de Software</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
