import React from 'react'
import { Briefcase, FileText, Smartphone, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

export const PRODUCTS_DATA = [
  {
    id: 'novagest',
    name: 'NovaGest',
    category: 'ERP & Gestión Empresarial',
    icon: Briefcase,
    status: 'Producto demostrativo',
    tagline: 'Sistema integral de gestión de operaciones comerciales y control administrativo',
    description: 'Plataforma empresarial diseñada para centralizar procesos operativos, control de inventarios, registro de ventas, compras a proveedores y generación de balances analíticos.',
    features: [
      'Control de inventario y kardex automatizado',
      'Módulo de facturación y cotizaciones comerciales',
      'Gestión de proveedores y cuentas por cobrar/pagar',
      'Dashboard analítico con gráficos ejecutivos'
    ],
    tech: ['React', 'PostgreSQL', 'Docker', 'REST API']
  },
  {
    id: 'novadocs',
    name: 'NovaDocs',
    category: 'Gestión Documental',
    icon: FileText,
    status: 'Producto demostrativo',
    tagline: 'Plataforma centralizada de archivo digital y control de flujo documental',
    description: 'Solución enfocada en la administración eficiente de expedientes digitales, clasificación mediante metadatos, trazabilidad de modificaciones y control de accesos por roles organizacionales.',
    features: [
      'Clasificación por categorías, etiquetas y metadatos',
      'Control estricto de versiones de documentos',
      'Flujo de aprobación y firmas de conformidad',
      'Búsqueda indexada de contenido y archivos adjuntos'
    ],
    tech: ['Node.js', 'React', 'Storage S3/Local', 'Cifrado']
  },
  {
    id: 'novamobile',
    name: 'NovaMobile',
    category: 'Solución Móvil',
    icon: Smartphone,
    status: 'Producto demostrativo',
    tagline: 'Aplicación Android para sincronización de actividades y alertas en tiempo real',
    description: 'Aplicación móvil orientada a operarios y equipos en terreno para registrar actividades, recibir notificaciones prioritarias y trabajar en modalidad desconectada con sincronización automática.',
    features: [
      'Interfaz optimizada para dispositivos Android',
      'Soporte de funcionamiento offline con caché local',
      'Recepción de alertas y notificaciones push',
      'Registro fotográfico y geolocalización de tareas'
    ],
    tech: ['Android OS', 'SQLite', 'Push Messaging', 'APK']
  }
]

export default function Products({ onSelectProduct }) {
  const handleInquiry = (productName) => {
    if (onSelectProduct) {
      onSelectProduct(productName)
    } else {
      const contactEl = document.getElementById('contacto')
      if (contactEl) {
        contactEl.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <section id="productos" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-novablue-primary text-xs font-semibold tracking-wide uppercase mb-3">
            <span>Soluciones Propias</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-novablue-dark tracking-tight">
            Nuestros Productos de Software
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Módulos y plataformas prediseñadas por NovaSoft Solutions para acelerar el despliegue tecnológico en entornos organizacionales.
          </p>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {PRODUCTS_DATA.map((product) => {
            const Icon = product.icon

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-novablue-primary/50"
              >
                {/* Header with Color Accent */}
                <div className="p-7 pb-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-novablue-primary border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    {/* Status Badge */}
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      {product.status}
                    </span>
                  </div>

                  <div className="text-xs font-bold uppercase tracking-wider text-novablue-primary mb-1">
                    {product.category}
                  </div>
                  <h3 className="text-2xl font-extrabold text-novablue-dark mb-2">
                    {product.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-700 mb-3">
                    {product.tagline}
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed mb-5">
                    {product.description}
                  </p>

                  {/* Feature Checklist */}
                  <div className="border-t border-slate-100 pt-4 mb-4">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                      Capacidades Principales
                    </div>
                    <ul className="space-y-2">
                      {product.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tech stack tags */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {product.tech.map((t, idx) => (
                      <span key={idx} className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-7 py-4 bg-novaslate-50 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleInquiry(product.name)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-novablue-dark hover:bg-novablue-primary text-white text-xs font-semibold shadow-sm transition-all duration-200"
                  >
                    <span>Solicitar información</span>
                    <ArrowRight className="w-3.5 h-3.5 text-novablue-sky" />
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
