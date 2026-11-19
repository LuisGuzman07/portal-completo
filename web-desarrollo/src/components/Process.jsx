import React from 'react'
import { FileSearch, Palette, Code2, Rocket, ArrowRight, CheckCircle2 } from 'lucide-react'

export const STEPS_DATA = [
  {
    step: '01',
    title: 'Análisis de Requerimientos',
    icon: FileSearch,
    tagline: 'Definición de alcance y necesidades',
    description: 'Levantamiento exhaustivo de requerimientos funcionales y no funcionales, definición de casos de uso y estimación técnica preliminar.',
    deliverables: ['Documento de Especificación (SRS)', 'Historias de usuario', 'Matriz de alcance y plazos']
  },
  {
    step: '02',
    title: 'Diseño de la Solución',
    icon: Palette,
    tagline: 'Arquitectura técnica y experiencia UI/UX',
    description: 'Modelado arquitectónico, diagramas de bases de datos, flujos de navegación y diseño de interfaces visuales responsive.',
    deliverables: ['Diagramas de arquitectura C4/UML', 'Modelado entidad-relación', 'Prototipos de interfaz de usuario']
  },
  {
    step: '03',
    title: 'Desarrollo e Implementación',
    icon: Code2,
    tagline: 'Codificación con estándares y control de versiones',
    description: 'Construcción iterativa del frontend, backend y servicios con código modular, control de versiones Git y buenas prácticas de ingeniería.',
    deliverables: ['Repositorio de código versionado', 'Integración continua (CI)', 'Estructura modular reutilizable']
  },
  {
    step: '04',
    title: 'Pruebas, Entrega y Soporte',
    icon: Rocket,
    tagline: 'Garantía de calidad y puesta en producción',
    description: 'Ejecución de pruebas funcionales, verificación de seguridad, empaquetado en contenedores Docker y acompañamiento en el despliegue.',
    deliverables: ['Reporte de pruebas y cobertura', 'Contenedor Docker operativo', 'Manual de despliegue y soporte']
  }
]

export default function Process() {
  return (
    <section id="proceso" className="py-20 lg:py-28 bg-novaslate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-novablue-primary text-xs font-semibold tracking-wide uppercase mb-3">
            <span>Metodología de Ingeniería</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-novablue-dark tracking-tight">
            Nuestro Proceso de Trabajo
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Metodología estructurada de desarrollo de software orientada a resultados predecibles, calidad de código y satisfacción de los requerimientos.
          </p>
        </div>

        {/* Process Cards Grid with Connecting Visuals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {STEPS_DATA.map((item, idx) => {
            const Icon = item.icon

            return (
              <div
                key={item.step}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-novablue-primary/50 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Step Number and Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-3xl font-extrabold text-novablue-primary/30 group-hover:text-novablue-primary transition-colors">
                      {item.step}
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-novablue-primary border border-blue-100 flex items-center justify-center group-hover:bg-novablue-primary group-hover:text-white transition-colors duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-novablue-dark mb-1 group-hover:text-novablue-primary transition-colors">
                    {item.title}
                  </h3>
                  <div className="text-xs font-semibold text-novablue-primary mb-3">
                    {item.tagline}
                  </div>

                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5">
                    {item.description}
                  </p>
                </div>

                {/* Deliverables Bullet list */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Entregables:
                  </div>
                  <ul className="space-y-1.5">
                    {item.deliverables.map((deliv, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{deliv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
