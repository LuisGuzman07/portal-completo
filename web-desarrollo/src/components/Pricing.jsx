import React from 'react'
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react'

export const PLANS_DATA = [
  {
    id: 'basico',
    name: 'Básico',
    subtitle: 'Sitio web informativo e identidad digital',
    price: 'Gratis',
    period: '',
    isPopular: false,
    features: [
      'Sitio web informativo',
      'Diseño responsive',
      'Formulario de contacto',
      'Soporte inicial'
    ],
    buttonText: 'Comenzar gratis',
    buttonStyle: 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
  },
  {
    id: 'profesional',
    name: 'Profesional',
    subtitle: 'Aplicación web interactiva y gestión operativa',
    badge: 'MÁS POPULAR',
    price: '$29.99',
    period: '/mes USD',
    isPopular: true,
    features: [
      'Aplicación web personalizada',
      'Panel administrativo',
      'Integración de base de datos',
      'Gestión de usuarios y roles',
      'Soporte técnico'
    ],
    buttonText: 'Comenzar prueba',
    buttonStyle: 'bg-white hover:bg-blue-50 text-novablue-primary font-bold shadow-md'
  },
  {
    id: 'empresarial',
    name: 'Empresarial',
    subtitle: 'Solución integral a medida con IA y móvil',
    price: '$99.99',
    period: '/mes USD',
    isPopular: false,
    features: [
      'Desarrollo a medida',
      'Integración de servicios y APIs',
      'Soluciones de Inteligencia Artificial',
      'Aplicaciones móviles Android',
      'Mantenimiento y escalabilidad'
    ],
    buttonText: 'Contactar equipo comercial',
    buttonStyle: 'bg-[#0B1530] hover:bg-novablue-primary text-white shadow-md'
  }
]

export default function Pricing({ onSelectPlan }) {
  const handleSelectPlan = (plan) => {
    const planLabel = `Plan ${plan.name} (${plan.price}${plan.period ? ' ' + plan.period : ''})`
    if (onSelectPlan) {
      onSelectPlan(planLabel)
    } else {
      const contactEl = document.getElementById('contacto')
      if (contactEl) {
        contactEl.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <section id="planes" className="py-20 lg:py-28 bg-novaslate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-novablue-primary text-xs font-semibold tracking-wide mb-3">
            <Sparkles className="w-3.5 h-3.5 text-novablue-primary" />
            <span>Precios Transparentes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-novablue-dark tracking-tight">
            Planes que se adaptan a tu negocio
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Comienza gratis o escala según las necesidades de software y tecnología de tu empresa
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {PLANS_DATA.map((plan) => {
            return (
              <div
                key={plan.id}
                className={`relative rounded-[2rem] p-8 sm:p-9 flex flex-col justify-between transition-all duration-300 ${
                  plan.isPopular
                    ? 'bg-[#2563EB] text-white shadow-2xl shadow-blue-500/25 lg:-translate-y-3 ring-1 ring-blue-400'
                    : 'bg-white border border-slate-200/90 shadow-sm hover:shadow-xl text-slate-900'
                }`}
              >
                {/* Popular Pill Badge on top */}
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FACC15] text-slate-900 text-[11px] font-black uppercase tracking-wider py-1 px-4 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-slate-900 fill-slate-900" />
                    <span>{plan.badge}</span>
                  </div>
                )}

                <div>
                  {/* Plan Name & Subtitle */}
                  <div className="mb-4">
                    <h3 className={`text-2xl font-extrabold tracking-tight ${plan.isPopular ? 'text-white' : 'text-slate-900'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs mt-1 font-medium ${plan.isPopular ? 'text-blue-100' : 'text-slate-500'}`}>
                      {plan.subtitle}
                    </p>
                  </div>

                  {/* Price Section */}
                  <div className="my-6">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-4xl sm:text-5xl font-black tracking-tight ${
                        plan.isPopular ? 'text-white' : 'text-slate-900'
                      }`}>
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className={`text-xs font-semibold ${
                          plan.isPopular ? 'text-blue-200' : 'text-slate-500'
                        }`}>
                          {plan.period}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Divider line */}
                  <div className={`border-b my-6 ${
                    plan.isPopular ? 'border-blue-400/40' : 'border-slate-100'
                  }`} />

                  {/* Features Label */}
                  <div className={`text-[11px] font-bold tracking-wider uppercase mb-4 ${
                    plan.isPopular ? 'text-blue-200' : 'text-slate-400'
                  }`}>
                    INCLUYE:
                  </div>

                  {/* Features List (Short, Direct & Clean) */}
                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-xs sm:text-[13px] font-medium">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${
                          plan.isPopular ? 'text-white' : 'text-emerald-500'
                        }`} />
                        <span className={plan.isPopular ? 'text-white' : 'text-slate-700'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Action CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${plan.buttonStyle}`}
                  >
                    <span>{plan.buttonText}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
