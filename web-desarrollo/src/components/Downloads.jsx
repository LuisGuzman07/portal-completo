import React, { useState } from 'react'
import { Download, Smartphone, Monitor, Terminal, FileCode, CheckCircle, Clock, AlertTriangle, Info, Calendar, HardDrive, Shield } from 'lucide-react'
import { DOWNLOADS, CHANGELOG } from '../config/downloads'

export default function Downloads() {
  const [downloadToast, setDownloadToast] = useState(null)
  const [showChangelog, setShowChangelog] = useState(false)

  const handleDownload = (item) => {
    if (!item.isAvailable || !item.filePath) return

    setDownloadToast(`Iniciando descarga de ${item.productName} (${item.version})...`)
    setTimeout(() => {
      setDownloadToast(null)
    }, 4500)
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Móvil':
        return <Smartphone className="w-5 h-5" />
      case 'Escritorio':
        return <Monitor className="w-5 h-5" />
      default:
        return <Terminal className="w-5 h-5" />
    }
  }

  return (
    <section id="descargas" className="py-20 lg:py-28 bg-novaslate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-novablue-primary text-xs font-semibold tracking-wide uppercase mb-3">
            <Download className="w-3.5 h-3.5" />
            <span>Distribución de Software</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-novablue-dark tracking-tight">
            Centro de Descargas y Actualizaciones
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Canal institucional para la distribución de instaladores, paquetes móviles Android (APK) y utilitarios de sincronización desarrollados por NovaSoft Solutions.
          </p>
        </div>

        {/* Feedback Toast Notification */}
        {downloadToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-novablue-dark text-white px-5 py-3 rounded-xl shadow-2xl border border-blue-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{downloadToast}</span>
          </div>
        )}

        {/* Downloads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {DOWNLOADS.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div className="p-7">
                {/* Top status & category */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold">
                    {getCategoryIcon(item.category)}
                    <span>{item.category}</span>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>

                {/* Title & Version */}
                <h3 className="text-xl font-bold text-novablue-dark mb-1">
                  {item.productName}
                </h3>
                <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-novablue-primary bg-blue-50 px-2 py-0.5 rounded mb-4">
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{item.version}</span>
                </div>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5">
                  {item.description}
                </p>

                {/* Technical Meta Specs */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2 text-xs text-slate-600 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Monitor className="w-3.5 h-3.5 text-slate-400" /> Sistema:
                    </span>
                    <span className="font-medium text-slate-800">{item.os}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Tamaño:
                    </span>
                    <span className="font-medium text-slate-800">{item.fileSize}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Fecha:
                    </span>
                    <span className="font-medium text-slate-800">{item.releaseDate}</span>
                  </div>
                </div>

                {/* Requirements list */}
                {item.requirements && (
                  <div className="text-[11px] text-slate-500 space-y-1 mb-2">
                    <span className="font-semibold text-slate-700 block">Requisitos:</span>
                    {item.requirements.map((req, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-400" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button Footer */}
              <div className="p-6 pt-0">
                {item.isAvailable && item.filePath ? (
                  <a
                    href={item.filePath}
                    download
                    onClick={() => handleDownload(item)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-novablue-primary to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm shadow hover:shadow-glow-sm transition-all duration-200"
                  >
                    <Download className="w-4 h-4 text-novablue-sky" />
                    <span>Descargar paquete ({item.badge})</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-400 font-semibold text-sm cursor-not-allowed border border-slate-200"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Próximamente disponible</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Distribution Architecture Notice */}
        <div className="bg-white rounded-2xl border border-blue-200 p-6 sm:p-8 shadow-sm mb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-novablue-primary flex items-center justify-center shrink-0 border border-blue-100">
                <Shield className="w-6 h-6 text-novablue-primary" />
              </div>
              <div>
                <h4 className="text-base font-bold text-novablue-dark mb-1">
                  Estructura de Distribución de Archivos APK e Instaladores
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  El servidor Nginx está preconfigurado para servir directamente binarios y paquetes colocados en la ruta <code className="bg-slate-100 text-novablue-primary px-1.5 py-0.5 rounded font-mono text-xs">public/downloads/</code>. Para desplegar un APK compilado final, basta con alojarlo en dicha carpeta y actualizar la ficha en <code className="bg-slate-100 text-novablue-primary px-1.5 py-0.5 rounded font-mono text-xs">src/config/downloads.js</code>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowChangelog(!showChangelog)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors shrink-0"
            >
              <Clock className="w-3.5 h-3.5 text-novablue-primary" />
              <span>{showChangelog ? 'Ocultar historial' : 'Ver historial (Changelog)'}</span>
            </button>
          </div>

          {/* Collapsible Changelog */}
          {showChangelog && (
            <div className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in duration-300">
              <h5 className="text-sm font-bold text-novablue-dark uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>Historial de Versiones y Despliegues</span>
              </h5>
              <div className="space-y-4">
                {CHANGELOG.map((log) => (
                  <div key={log.version} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-novablue-primary">{log.version}</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold">{log.tag}</span>
                      </div>
                      <span className="text-slate-500 text-[11px]">{log.date}</span>
                    </div>
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                      {log.items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  )
}
