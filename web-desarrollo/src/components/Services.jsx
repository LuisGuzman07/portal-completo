import React from 'react'
import { Globe, Smartphone, Bot, LayoutDashboard, Database, Wrench, ArrowRight, Check } from 'lucide-react'

export const SERVICES_DATA = [
  {
    id: 'web',
    title: 'Desarrollo Web',
    icon: Globe,
    badge: 'Frontend & Backend',
    description: 'Diseño e implementación de sitios web, portales institucionales y aplicaciones empresariales interactivas con diseño adaptativo y alta velocidad de carga.',
    features: [
      'Portales corporativos e institucionales',
      'Single Page Applications (SPA) y SSR',
      'Integración de APIs y paneles de control'
    ]
  },
  {
    id: 'movil',
    title: 'Aplicaciones Móviles',
    icon: Smartphone,
    badge: 'Android OS',
    description: 'Desarrollo de aplicaciones Android adaptadas a diferentes necesidades, con interfaces intuitivas, funcionamiento offline y sincronización en la nube.',
    features: [
      'Arquitectura modular para Android',
      'Distribución de instaladores APK seguros',
      'Notificaciones push y persistencia local'
    ]
  },
  {
    id: 'ia',
    title: 'Inteligencia Artificial',
    icon: Bot,
    badge: 'Automatización & NLP',
    description: 'Integración de asistentes inteligentes, procesamiento de lenguaje natural y automatización de flujos de trabajo orientados a la productividad.',
    features: [
      'Asistentes conversacionales inteligentes',
      'Procesamiento automatizado de textos',
      'Extracción de información e integraciones API'
    ]
  },
  {
    id: 'sistemas',
    title: 'Sistemas Empresariales',
    icon: LayoutDashboard,
    badge: 'Gestión & ERP',
    description: 'Desarrollo de plataformas para gestionar información, usuarios, procesos de negocio, flujos documentales y generación de reportes analíticos.',
    features: [
      'Módulos de administración y control de roles',
      'Gestión de flujos de trabajo organizacionales',
      'Reportes ejecutivos y métricas en tiempo real'
    ]
  },
  {
    id: 'bd',
    title: 'Bases de Datos',
    icon: Database,
    badge: 'Arquitectura & Datos',
    description: 'Diseño, administración y optimización de bases de datos relacionales y no relacionales para garantizar integridad, rendimiento y disponibilidad.',
    features: [
      'Modelado de datos normalizado',
      'Optimización de consultas e indexación',
      'Políticas de respaldo y recuperación'
    ]
  },
  {
    id: 'soporte',
    title: 'Soporte y Mantenimiento',
    icon: Wrench,
    badge: 'Continuidad Operativa',
    description: 'Actualizaciones periódicas, corrección de errores, auditorías de seguridad y mantenimiento evolutivo continuo para garantizar la estabilidad de las aplicaciones.',
    features: [
      'Monitoreo y resolución de incidencias',
      'Parches de seguridad y dependencias',
      'Mejoras evolutivas y refactorización'
    ]
  }
]

export default function Services({ onSelectService }) {
  const handleRequestService = (serviceTitle) => {
    if (onSelectService) {
      onSelectService(serviceTitle)
    } else {
      const contactEl = document.getElementById('contacto')
      if (contactEl) {
        contactEl.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <section id="servicios" className="py-20 lg:py-28 bg-novaslate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-novablue-primary text-xs font-semibold tracking-wide uppercase mb-3">
            <span>Catálogo Tecnológico</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-novablue-dark tracking-tight">
            Servicios de Desarrollo de Software
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Ofrecemos soluciones digitales integrales y escalables, adaptadas a los requerimientos técnicos y estratégicos de tu organización.
          </p>
        </div>

        {/* Services 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES_DATA.map((service) => {
            const Icon = service.icon

            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-novablue-primary/50 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar with Icon and Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-novablue-primary border border-blue-100 flex items-center justify-center group-hover:bg-novablue-primary group-hover:text-white transition-colors duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      {service.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-novablue-dark mb-2.5 group-hover:text-novablue-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-5">
                    {service.description}
                  </p>

                  {/* Feature Bullets */}
                  <ul className="space-y-2 mb-6 border-t border-slate-100 pt-4">
                    {service.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="w-3.5 h-3.5 text-novablue-primary shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Request Info Button */}
                <button
                  type="button"
                  onClick={() => handleRequestService(service.title)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-novablue-primary text-slate-700 hover:text-white text-xs font-semibold border border-slate-200 hover:border-novablue-primary transition-all duration-200 group-hover:shadow-sm"
                >
                  <span>Solicitar información</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
