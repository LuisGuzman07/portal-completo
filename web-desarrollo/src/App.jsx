import React, { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Services from './components/Services'
import Products from './components/Products'
import Downloads from './components/Downloads'
import Pricing from './components/Pricing'
import Process from './components/Process'
import Contact from './components/Contact'
import FAQ from './components/FAQ'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'
import PrivacyModal from './components/PrivacyModal'
import TermsModal from './components/TermsModal'

export default function App() {
  const [selectedService, setSelectedService] = useState('')
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)

  // Scroll to contact and preselect inquiry
  const handleSelectService = (serviceName) => {
    setSelectedService(serviceName)
    const contactEl = document.getElementById('contacto')
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSelectProduct = (productName) => {
    setSelectedService(`Producto: ${productName}`)
    const contactEl = document.getElementById('contacto')
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSelectPlan = (planName) => {
    setSelectedService(`Plan: ${planName}`)
    const contactEl = document.getElementById('contacto')
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleQuoteClick = () => {
    setSelectedService('Solicitud de Cotización General')
    const contactEl = document.getElementById('contacto')
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleExploreServices = () => {
    const servicesEl = document.getElementById('servicios')
    if (servicesEl) {
      servicesEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-novaslate-50 text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* 4.1 Sticky Navigation Bar */}
      <Navbar onQuoteClick={handleQuoteClick} />

      {/* Main Page Layout */}
      <main className="flex-grow">
        {/* 4.2 Hero Section */}
        <Hero
          onExploreServices={handleExploreServices}
          onGetQuote={handleQuoteClick}
        />

        {/* 4.3 About Us */}
        <About />

        {/* 4.4 Development Services */}
        <Services onSelectService={handleSelectService} />

        {/* 4.5 Software Products */}
        <Products onSelectProduct={handleSelectProduct} />

        {/* 4.6 Downloads and Updates Center */}
        <Downloads />

        {/* 4.7 Plans and Pricing */}
        <Pricing onSelectPlan={handleSelectPlan} />

        {/* 4.8 Work Process */}
        <Process />

        {/* 4.11 Frequently Asked Questions */}
        <FAQ />

        {/* 4.9 Corporate Contact */}
        <Contact
          preselectedService={selectedService}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
        />
      </main>

      {/* 4.12 Corporate Footer */}
      <Footer
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenTerms={() => setIsTermsOpen(true)}
      />

      {/* 4.10 Floating Interactive Customer Chat Widget */}
      <ChatWidget />

      {/* Modals for Legal Assurance */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />
    </div>
  )
}
