import React, { useState, useEffect } from 'react'
import { Menu, X, ArrowUpRight, PhoneCall } from 'lucide-react'
import Logo from './Logo'
import { COMPANY } from '../config/company'

export default function Navbar({ onQuoteClick }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('inicio')

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }

      // Check current visible section
      const sections = ['inicio', 'nosotros', 'servicios', 'productos', 'descargas', 'planes', 'contacto']
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const el = document.getElementById(section)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e, href) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const targetId = href.replace('#', '')
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleCtaClick = () => {
    setMobileMenuOpen(false)
    if (onQuoteClick) {
      onQuoteClick()
    } else {
      const contactEl = document.getElementById('contacto')
      if (contactEl) {
        contactEl.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200/80 py-3'
          : 'bg-white/80 backdrop-blur-sm py-4 border-b border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <a
            href="#inicio"
            onClick={(e) => handleNavClick(e, '#inicio')}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
            aria-label="NovaSoft Solutions - Inicio"
          >
            <Logo size="md" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Navegación principal">
            {COMPANY.navLinks.map((link) => {
              const targetId = link.href.replace('#', '')
              const isActive = activeSection === targetId

              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-novablue-primary bg-blue-50/80 font-semibold'
                      : 'text-slate-600 hover:text-novablue-primary hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </a>
              )
            })}
          </nav>

          {/* CTA Button & Mobile Trigger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCtaClick}
              className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-novablue-primary to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow-glow-sm transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <span>Solicitar cotización</span>
              <ArrowUpRight className="w-4 h-4 text-novablue-sky" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-700 hover:text-novablue-primary hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/98 backdrop-blur-lg border-b border-slate-200 px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            {COMPANY.navLinks.map((link) => {
              const targetId = link.href.replace('#', '')
              const isActive = activeSection === targetId

              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`px-4 py-2.5 rounded-lg text-base font-medium flex items-center justify-between ${
                    isActive
                      ? 'text-novablue-primary bg-blue-50 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-novablue-primary'
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-novablue-primary" />}
                </a>
              )
            })}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleCtaClick}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-novablue-primary to-blue-700 text-white px-4 py-3 rounded-lg text-base font-semibold shadow hover:shadow-md transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Solicitar cotización</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
