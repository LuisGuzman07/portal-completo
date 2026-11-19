import React from 'react'
import { X, FileText, CheckCircle } from 'lucide-react'

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-novaslate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-novablue-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-novablue-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-novablue-dark">
                Términos y Condiciones de Servicio
              </h3>
              <p className="text-xs text-slate-500 font-mono">NovaSoft Solutions • Marco Contractual</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto text-xs sm:text-sm text-slate-600 space-y-4 leading-relaxed">
          <p>
            El presente documento describe los lineamientos y términos aplicables a las propuestas de ingeniería, cotizaciones, desarrollo de aplicaciones y uso de los productos demostrativos exhibidos por <strong>NovaSoft Solutions</strong>.
          </p>

          <h4 className="font-bold text-novablue-dark text-sm pt-2">1. Alcance de los Productos Demostrativos</h4>
          <p>
            Los sistemas denominados <em>NovaGest</em>, <em>NovaDocs</em> y <em>NovaMobile</em> exhibidos en el catálogo comercial representan soluciones modelo diseñadas para ilustrar las capacidades técnicas de la empresa y servir como base para implementaciones a medida.
          </p>

          <h4 className="font-bold text-novablue-dark text-sm pt-2">2. Proceso de Cotización y Contratación</h4>
          <p>
            Las propuestas comerciales y técnicas emitidas tras el análisis preliminar de requerimientos tienen una validez de 30 días calendario y están sujetas a un acuerdo formal de desarrollo de software (SOW) y cronograma de hitos verificables.
          </p>

          <h4 className="font-bold text-novablue-dark text-sm pt-2">3. Propiedad Intelectual y Código Fuente</h4>
          <p>
            Salvo estipulación en contrario en el contrato específico, la titularidad del código fuente desarrollado a medida para un cliente es transferida íntegramente tras la conformidad final de entrega y liquidación del proyecto.
          </p>

          <h4 className="font-bold text-novablue-dark text-sm pt-2">4. Garantía Técnica y Soporte</h4>
          <p>
            NovaSoft Solutions otorga un periodo de garantía de estabilidad sobre el software entregado para corregir eventuales fallos de programación no detectados durante la fase de pruebas de aceptación (UAT).
          </p>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-novaslate-50 rounded-b-2xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-novablue-dark hover:bg-novablue-primary text-white text-xs font-semibold transition-colors"
          >
            Aceptar y cerrar
          </button>
        </div>

      </div>
    </div>
  )
}
