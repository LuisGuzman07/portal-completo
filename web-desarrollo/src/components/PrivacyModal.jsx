import React from 'react'
import { X, ShieldCheck, Lock } from 'lucide-react'
import { COMPANY } from '../config/company'

export default function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-novaslate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-novablue-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-novablue-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-novablue-dark">
                Política de Privacidad Institucional
              </h3>
              <p className="text-xs text-slate-500 font-mono">NovaSoft Solutions • Vigencia 2026</p>
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
            En <strong>NovaSoft Solutions</strong>, consideramos fundamental la protección, confidencialidad y tratamiento responsable de los datos provistos por clientes, colaboradores e interesados en nuestros servicios de desarrollo de software.
          </p>

          <h4 className="font-bold text-novablue-dark text-sm pt-2">1. Información recolectada</h4>
          <p>
            Los datos personales remitidos a través del formulario de contacto (nombre, dirección de correo electrónico, empresa y requerimiento técnico) son utilizados de manera exclusiva para evaluar técnica y comercialmente la solicitud, elaborar propuestas y establecer comunicación directa.
          </p>

          <h4 className="font-bold text-novablue-dark text-sm pt-2">2. Ausencia de almacenamiento innecesario</h4>
          <p>
            El portal web no almacena contraseñas ni datos bancarios en servidores intermedios para la función de contacto. La comunicación se canaliza a través del protocolo oficial de correo electrónico corporativo hacia <code className="bg-slate-100 px-1 py-0.5 rounded text-novablue-primary font-mono">{COMPANY.contact.email}</code>.
          </p>

          <h4 className="font-bold text-novablue-dark text-sm pt-2">3. Confidencialidad en desarrollo de software</h4>
          <p>
            Cualquier especificación de requerimientos, diagramas o código compartido durante las fases de análisis y desarrollo está amparado por acuerdos de estricta confidencialidad (NDA) para proteger la propiedad intelectual y los activos de información de nuestros clientes.
          </p>

          <h4 className="font-bold text-novablue-dark text-sm pt-2">4. Derechos del titular</h4>
          <p>
            Usted puede solicitar en cualquier momento la rectificación o eliminación de sus registros de contacto enviando una solicitud formal a nuestra casilla institucional.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-novaslate-50 rounded-b-2xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-novablue-dark hover:bg-novablue-primary text-white text-xs font-semibold transition-colors"
          >
            Entendido y cerrar
          </button>
        </div>

      </div>
    </div>
  )
}
