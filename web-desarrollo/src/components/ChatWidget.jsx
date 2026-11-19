import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, Sparkles, ArrowRight, CornerDownLeft, RefreshCw, ExternalLink } from 'lucide-react'
import { COMPANY } from '../config/company'

// Predefined automated dialog topics
const KNOWLEDGE_BASE = [
  {
    id: 'servicios',
    label: '💼 Servicios de software',
    keywords: ['servicio', 'servicios', 'desarrollo', 'web', 'movil', 'ia', 'sistemas', 'base de datos', 'soporte'],
    response: 'NovaSoft Solutions ofrece 6 líneas de desarrollo: Desarrollo Web (sitios y SPAs), Aplicaciones Móviles Android, Inteligencia Artificial aplicada, Sistemas Empresariales (ERP), Bases de Datos y Soporte & Mantenimiento.',
    actionLabel: 'Ver todos los servicios',
    actionTarget: '#servicios'
  },
  {
    id: 'descargas',
    label: '📲 Descargas y paquetes APK',
    keywords: ['descarga', 'descargas', 'apk', 'instalador', 'android', 'actualizacion', 'changelog', 'versión'],
    response: 'En nuestro "Centro de descargas" distribuimos paquetes instaladores y APKs para Android. Actualmente contamos con un paquete de prueba verificable y la infraestructura lista para la distribución de versiones estables.',
    actionLabel: 'Ir al Centro de Descargas',
    actionTarget: '#descargas'
  },
  {
    id: 'cotizacion',
    label: '📋 Solicitar cotización',
    keywords: ['cotizar', 'cotizacion', 'precio', 'presupuesto', 'costo', 'planes', 'cuanto cuesta'],
    response: 'Nuestros presupuestos se adaptan a la complejidad y requerimientos técnicos de cada proyecto. Para solicitar una propuesta, puede completar el formulario de contacto oficial o consultar nuestras modalidades en la sección de planes.',
    actionLabel: 'Ir al formulario de cotización',
    actionTarget: '#contacto'
  },
  {
    id: 'horarios',
    label: '⏰ Horarios de atención',
    keywords: ['horario', 'horarios', 'atencion', 'hora', 'cuando atienden', 'telefono'],
    response: `Nuestro horario de atención técnica e institucional es: ${COMPANY.contact.schedule}. Las consultas recibidas por correo (${COMPANY.contact.email}) son atendidas en un plazo promedio de 24 a 48 horas hábiles.`,
    actionLabel: null,
    actionTarget: null
  },
  {
    id: 'contacto',
    label: '✉️ Contactar con un asesor',
    keywords: ['asesor', 'humano', 'contacto', 'correo', 'escribir', 'hablar'],
    response: 'Para comunicarse directamente con nuestro equipo de ingeniería, complete el formulario de contacto en el pie de página o escriba directamente a nuestra casilla corporativa.',
    actionLabel: 'Abrir Contacto',
    actionTarget: '#contacto'
  }
]

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: '¡Hola! Bienvenido a NovaSoft Solutions. Soy el asistente virtual automatizado. ¿En qué información técnica o corporativa te puedo orientar hoy?',
      time: 'Ahora'
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen, isTyping])

  const handleSelectTopic = (topic) => {
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: topic.label.replace(/^[^\w\s]+/, '').trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    // Simulate short processing delay
    setTimeout(() => {
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: topic.response,
        actionLabel: topic.actionLabel,
        actionTarget: topic.actionTarget,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages((prev) => [...prev, botMsg])
      setIsTyping(false)
    }, 450)
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const userText = inputText.trim()
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setIsTyping(true)

    // Smart Keyword Matcher across knowledge base
    const lower = userText.toLowerCase()
    const matched = KNOWLEDGE_BASE.find((item) =>
      item.keywords.some((kw) => lower.includes(kw))
    )

    setTimeout(() => {
      let botResponse = ''
      let actionLabel = null
      let actionTarget = null

      if (matched) {
        botResponse = matched.response
        actionLabel = matched.actionLabel
        actionTarget = matched.actionTarget
      } else {
        botResponse = 'Gracias por tu consulta. Para este tipo de requerimiento específico o dudas avanzadas, te sugiero utilizar nuestro formulario de contacto corporativo o consultar una de las opciones sugeridas abajo.'
        actionLabel = 'Ir al formulario de contacto'
        actionTarget = '#contacto'
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: botResponse,
          actionLabel,
          actionTarget,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
      setIsTyping(false)
    }, 500)
  }

  const handleActionClick = (target) => {
    if (!target) return
    const el = document.querySelector(target)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      // On mobile screens, close chat to show the section
      if (window.innerWidth < 768) {
        setIsOpen(false)
      }
    }
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: 'Conversación reiniciada. ¿En qué otro tema puedo orientarte?',
        time: 'Ahora'
      }
    ])
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 bg-gradient-to-r from-novablue-primary to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl hover:shadow-glow-md transition-all duration-300 transform hover:scale-105"
          aria-label="Abrir chat de atención al cliente"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-pulse" />
          </div>
          <span className="hidden sm:inline-block font-semibold text-sm">
            Asistencia NovaSoft
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[380px] h-[540px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-novablue-dark via-[#0F1E40] to-novablue-dark text-white p-4 flex items-center justify-between border-b border-blue-900/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-novablue-sky border border-blue-500/40 flex items-center justify-center">
                <Bot className="w-5 h-5 text-novablue-sky" />
              </div>
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <span>Asistente NovaSoft</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                </div>
                <div className="text-[11px] text-slate-300">
                  Respuestas automáticas predefinidas
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Reiniciar conversación"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Cerrar chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader Notice */}
          <div className="bg-blue-50/90 px-3.5 py-1.5 border-b border-blue-100 text-[10.5px] text-blue-900 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-novablue-primary" /> Sistema interactivo v1.0
            </span>
            <span className="text-slate-500 font-mono">Modo: Predefinido</span>
          </div>

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-novaslate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-novablue-primary text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Action link if available */}
                  {msg.actionTarget && msg.actionLabel && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(msg.actionTarget)}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-novablue-primary text-xs font-semibold border border-blue-200 transition-colors w-full justify-center"
                    >
                      <span>{msg.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 w-fit px-3 py-2 rounded-2xl text-slate-400 text-xs shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="p-2.5 bg-white border-t border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 px-1">
              Temas rápidos:
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {KNOWLEDGE_BASE.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTopic(item)}
                  className="text-[11px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-novablue-primary text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-colors text-left"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe tu consulta..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-novablue-primary focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-novablue-primary text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  )
}
