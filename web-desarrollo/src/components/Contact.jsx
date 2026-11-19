import React, { useState, useEffect } from 'react'
import { Mail, Send, CheckCircle2, AlertCircle, Info, Clock, Building, User, FileText, Check, Shield } from 'lucide-react'
import { COMPANY } from '../config/company'

export default function Contact({ preselectedService = '', onOpenPrivacy }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    serviceType: 'Desarrollo Web',
    subject: '',
    message: '',
    acceptPrivacy: false,
  })

  const [errors, setErrors] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [mailerNotice, setMailerNotice] = useState(false)

  // Update selected service if parent passes one
  useEffect(() => {
    if (preselectedService) {
      setFormData((prev) => ({
        ...prev,
        serviceType: preselectedService,
        subject: prev.subject || `Consulta sobre: ${preselectedService}`
      }))
    }
  }, [preselectedService])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es obligatorio.'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Ingrese un formato de correo electrónico válido.'
      }
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'El asunto es obligatorio.'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Por favor detalle su consulta o requerimiento.'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'El mensaje debe tener al menos 10 caracteres.'
    }

    if (!formData.acceptPrivacy) {
      newErrors.acceptPrivacy = 'Debe aceptar la política de privacidad institucional.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Clear field-specific error
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev }
        delete copy[name]
        return copy
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const contactEmail = COMPANY.contact.email
    const subjectLine = `[NovaSoft Solutions] ${formData.subject}`
    const bodyContent = 
`Solicitud de Contacto / Cotización - NovaSoft Solutions
-----------------------------------------------------------
Nombre: ${formData.fullName}
Correo Electrónico: ${formData.email}
Empresa / Organización: ${formData.company || 'No especificada'}
Tipo de Servicio: ${formData.serviceType}
Asunto: ${formData.subject}

Detalle del Requerimiento:
${formData.message}
-----------------------------------------------------------
Mensaje generado desde el portal web corporativo de NovaSoft Solutions.`

    // Construct mailto URI
    const mailtoUrl = `mailto:${contactEmail}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(bodyContent)}`

    setMailerNotice(true)
    setIsSubmitted(true)

    // Trigger user mail client
    window.location.href = mailtoUrl
  }

  return (
    <section id="contacto" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-novablue-primary text-xs font-semibold tracking-wide uppercase mb-3">
            <Mail className="w-3.5 h-3.5 text-novablue-primary" />
            <span>Atención Comercial & Técnica</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-novablue-dark tracking-tight">
            Contacto Corporativo
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Escríbenos para solicitar una cotización personalizada, resolver dudas técnicas o conocer más acerca de nuestros servicios y productos de software.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            
            {/* Operational notice about mailto mechanism */}
            <div className="mb-6 p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
              <Info className="w-4 h-4 text-novablue-primary shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Aviso de funcionamiento:</strong> Este formulario prepara su mensaje y abre de forma directa su cliente de correo predeterminado (Gmail, Outlook, Thunderbird) para el envío seguro hacia la casilla corporativa configurada (<code className="font-mono font-semibold text-novablue-dark">{COMPANY.contact.email}</code>).
              </div>
            </div>

            {/* Submission alert */}
            {mailerNotice && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-start gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">¡Cliente de correo iniciado!</p>
                  <p className="text-emerald-800 text-xs mt-0.5">
                    Se han cargado los datos del formulario en su aplicación de correo. Por favor revise el mensaje y presione "Enviar" en su aplicación para completar el despacho.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nombre completo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Ej. Ing. Carlos Mendoza"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        errors.fullName
                          ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                          : 'border-slate-300 focus:border-novablue-primary focus:ring-blue-100'
                      }`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Correo electrónico <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="carlos.mendoza@empresa.com"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                      errors.email
                        ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                        : 'border-slate-300 focus:border-novablue-primary focus:ring-blue-100'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Company / Organization */}
                <div>
                  <label htmlFor="company" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Empresa / Institución <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Ej. Corporación Andina S.A."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-novablue-primary focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                {/* Service Type Selection */}
                <div>
                  <label htmlFor="serviceType" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tipo de servicio o producto <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="serviceType"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 bg-white focus:outline-none focus:border-novablue-primary focus:ring-2 focus:ring-blue-100 transition-all"
                  >
                    <option value="Desarrollo Web">Desarrollo Web (Sitio / Portal / SPA)</option>
                    <option value="Aplicaciones Móviles">Aplicaciones Móviles (Android)</option>
                    <option value="Inteligencia Artificial">Inteligencia Artificial & Automatización</option>
                    <option value="Sistemas Empresariales">Sistemas Empresariales & ERP</option>
                    <option value="Bases de Datos">Bases de Datos & Optimización</option>
                    <option value="Soporte y Mantenimiento">Soporte Técnico y Mantenimiento</option>
                    <option value="Plan Básico">Plan Básico de Desarrollo</option>
                    <option value="Plan Profesional">Plan Profesional de Desarrollo</option>
                    <option value="Plan Empresarial">Plan Empresarial de Desarrollo</option>
                    <option value="Producto NovaGest">Consulta sobre NovaGest</option>
                    <option value="Producto NovaDocs">Consulta sobre NovaDocs</option>
                    <option value="Producto NovaMobile">Consulta sobre NovaMobile</option>
                    <option value="Otra Consulta">Otra consulta general</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Asunto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Ej. Solicitud de cotización para sistema web"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.subject
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:border-novablue-primary focus:ring-blue-100'
                  }`}
                />
                {errors.subject && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.subject}
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detalle del requerimiento o mensaje <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describa el objetivo de su proyecto, alcance preliminar, funcionalidades deseadas o dudas técnicas..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.message
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:border-novablue-primary focus:ring-blue-100'
                  }`}
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.message}
                  </p>
                )}
              </div>

              {/* Privacy acceptance */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="acceptPrivacy"
                    checked={formData.acceptPrivacy}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-novablue-primary focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-600 leading-normal">
                    He leído y acepto la{' '}
                    <button
                      type="button"
                      onClick={onOpenPrivacy}
                      className="text-novablue-primary font-semibold underline hover:text-blue-700"
                    >
                      Política de Privacidad y Tratamiento de Datos
                    </button>{' '}
                    de NovaSoft Solutions para la atención de esta solicitud.
                  </span>
                </label>
                {errors.acceptPrivacy && (
                  <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.acceptPrivacy}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-novablue-primary to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm shadow-md hover:shadow-glow-sm transition-all duration-200"
              >
                <Send className="w-4 h-4 text-novablue-sky" />
                <span>Preparar y Enviar Correo de Consulta</span>
              </button>

            </form>
          </div>

          {/* Right Column: Institutional Contacts & Hours */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-gradient-to-b from-novablue-dark to-[#0D1C44] text-white rounded-2xl p-7 shadow-xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-novablue-sky" />
                <span>Canales Institucionales</span>
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                NovaSoft Solutions centraliza su atención institucional y técnica mediante canales digitales para garantizar trazabilidad y atención oportuna.
              </p>

              <div className="space-y-4 border-t border-blue-900/80 pt-6">
                
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/30 text-novablue-sky flex items-center justify-center shrink-0 border border-blue-500/30">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Correo de Contacto</div>
                    <div className="text-sm font-semibold text-white font-mono">{COMPANY.contact.email}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/30 text-novablue-sky flex items-center justify-center shrink-0 border border-blue-500/30">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Horario de Atención</div>
                    <div className="text-xs sm:text-sm text-slate-200">{COMPANY.contact.schedule}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/30 text-novablue-sky flex items-center justify-center shrink-0 border border-blue-500/30">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Compromiso de Respuesta</div>
                    <div className="text-xs text-slate-300">Respuesta inicial estimada entre 24 y 48 horas hábiles.</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Architecture note for future API */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-novablue-primary" />
                <span>Extensibilidad Técnica</span>
              </div>
              <p className="leading-relaxed">
                El componente de contacto está preparado para desacoplar el despacho <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-novablue-primary font-mono">mailto:</code> y conectarse directamente a un endpoint REST API o servicio serverless (ej. Resend, SendGrid o backend propio) mediante una función de envío asíncrona sin modificar la capa visual.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}
