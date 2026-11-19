import React from 'react'

export default function Logo({ size = 'md', light = false, showTagline = false }) {
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9'
  const textTitleSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'
  const textSubSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs' : 'text-[10px]'

  return (
    <div className="flex items-center gap-2.5 group select-none">
      {/* SVG Icon with polygon tech motif */}
      <div className={`relative flex items-center justify-center ${iconSize} rounded-xl bg-gradient-to-br from-novablue-dark via-[#13234F] to-novablue-navy shadow-md p-1.5 border border-blue-500/30 group-hover:border-novablue-sky/60 transition-all duration-300`}>
        <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Outer diamond network */}
          <path d="M18 4L31 18L18 32L5 18L18 4Z" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Inner digital node lines */}
          <path d="M18 10V26" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          <path d="M10 18H26" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          {/* Central node spark */}
          <circle cx="18" cy="18" r="3.5" fill="#38BDF8" />
          <circle cx="18" cy="4" r="2" fill="#2563EB" />
          <circle cx="31" cy="18" r="2" fill="#2563EB" />
          <circle cx="18" cy="32" r="2" fill="#2563EB" />
          <circle cx="5" cy="18" r="2" fill="#2563EB" />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1">
          <span className={`font-extrabold tracking-tight ${textTitleSize} ${light ? 'text-white' : 'text-novablue-dark'}`}>
            Nova<span className="text-novablue-primary">Soft</span>
          </span>
          <span className={`text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 ${light ? 'bg-blue-900/60 text-blue-200 border-blue-700/50' : ''}`}>
            Solutions
          </span>
        </div>
        {showTagline && (
          <span className={`font-medium ${textSubSize} ${light ? 'text-slate-400' : 'text-slate-500'} tracking-wide`}>
            Transformamos ideas en soluciones digitales
          </span>
        )}
      </div>
    </div>
  )
}
