import React, { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

export const FAQ_DATA = [
  {
    question: '¿Qué tipo de software desarrolla NovaSoft Solutions?',
    answer: 'Desarrollamos soluciones de software personalizadas que abarcan aplicaciones web modernas (Single Page Applications y portales institucionales), sistemas de gestión empresarial (ERP, control administrativo), integración de asistentes inteligentes (IA y procesamiento de lenguaje natural), arquitectura de bases de datos y aplicaciones móviles para el sistema operativo Android.'
  },
  {
    question: '¿Realizan aplicaciones móviles?',
    answer: 'Sí. Diseñamos y desarrollamos aplicaciones móviles orientadas a Android adaptadas a las necesidades operativas de la organización, con capacidades de sincronización en tiempo real, persistencia local (modo offline) y empaquetado de archivos instaladores APK para su distribución directa e institucional.'
  },
  {
    question: '¿Puedo solicitar un sistema personalizado?',
    answer: 'Totalmente. Cada solución se construye a partir de un levantamiento riguroso de requerimientos técnicos y funcionales. Analizamos la lógica de su negocio, diseñamos la arquitectura de software y creamos módulos específicos que se adapten con exactitud a los procesos de su institución.'
  },
  {
    question: '¿Cómo descargo una actualización?',
    answer: 'Puede acceder a nuestra sección "Centro de descargas" en este sitio web corporativo. Allí encontrará los paquetes disponibles, el número de versión, sistema operativo compatible y los cambios implementados en el registro de versiones (changelog). Al hacer clic en "Descargar", obtendrá el archivo oficial correspondiente.'
  },
  {
    question: '¿Ofrecen soporte técnico?',
    answer: 'Sí. Contamos con servicios de soporte técnico preventivo, correctivo y evolutivo. Brindamos acompañamiento en el despliegue, corrección de incidencias, parches de seguridad, optimización de infraestructura y mantenimiento continuo para asegurar la alta disponibilidad de sus aplicaciones.'
  },
  {
    question: '¿Cómo puedo solicitar una cotización?',
    answer: 'Puede dirigirse a la sección "Contacto", seleccionar el servicio o plan de su interés y completar el formulario detallando el alcance de su proyecto. Al enviarlo, se abrirá su cliente de correo con la solicitud estructurada. Nuestro equipo técnico evaluará sus requerimientos y responderá en un plazo estimado de 24 a 48 horas hábiles.'
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0) // First question open by default

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? -1 : index)
  }

  return (
    <section id="faq" className="py-20 lg:py-28 bg-novaslate-50 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-novablue-primary text-xs font-semibold tracking-wide uppercase mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Resolución de Dudas</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-novablue-dark tracking-tight">
            Preguntas Frecuentes
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Respuestas a las consultas habituales sobre nuestros servicios, metodologías de trabajo y canales de distribución.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {FAQ_DATA.map((item, index) => {
            const isOpen = openIndex === index

            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm transition-all duration-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 focus:outline-none focus:bg-slate-50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-bold text-novablue-dark">
                    {item.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                    isOpen ? 'bg-novablue-primary text-white rotate-180' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-slate-600 text-sm leading-relaxed border-t border-slate-100 animate-in fade-in duration-200">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
