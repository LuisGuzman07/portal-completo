/**
 * Configuración institucional y parámetros de identidad de NovaSoft Solutions
 * Capítulo VII - Sitio Web Corporativo
 */

export const COMPANY = {
  name: 'NovaSoft Solutions',
  shortName: 'NovaSoft',
  slogan: 'Transformamos ideas en soluciones digitales',
  activity: 'Desarrollo de software y soluciones tecnológicas',
  
  description: 'NovaSoft Solutions es una empresa dedicada al diseño, desarrollo e implementación de soluciones digitales para organizaciones, instituciones y empresas. Ofrecemos desarrollo web, aplicaciones móviles, automatización de procesos, integración de inteligencia artificial y mantenimiento de sistemas informáticos.',
  
  mission: 'Desarrollar soluciones tecnológicas innovadoras, accesibles y eficientes que contribuyan a la transformación digital de nuestros clientes.',
  
  vision: 'Consolidarnos como una empresa referente en el desarrollo de software, reconocida por la calidad, innovación y confiabilidad de nuestros productos.',
  
  values: [
    {
      title: 'Innovación',
      description: 'Exploramos tecnologías emergentes para ofrecer soluciones modernas, escalables y de alto impacto.',
      icon: 'Lightbulb'
    },
    {
      title: 'Responsabilidad',
      description: 'Cumplimiento riguroso de requerimientos, cronogramas y compromisos adquiridos con cada proyecto.',
      icon: 'ShieldCheck'
    },
    {
      title: 'Calidad',
      description: 'Criterios de ingeniería de software enfocados en mantenibilidad, rendimiento y alta disponibilidad.',
      icon: 'Award'
    },
    {
      title: 'Seguridad',
      description: 'Aplicación de estándares de protección de datos, autenticación robusta y buenas prácticas de desarrollo seguro.',
      icon: 'Lock'
    },
    {
      title: 'Compromiso con el cliente',
      description: 'Acompañamiento técnico continuo, comunicación transparente y soporte evolutivo post-entrega.',
      icon: 'Users'
    }
  ],

  // Canales de contacto configurables
  contact: {
    email: import.meta.env.VITE_CONTACT_EMAIL || 'contacto@novasoft.dev',
    schedule: 'Lunes a Viernes: 08:30 - 18:00 hrs',
    location: 'Disponibilidad para proyectos presenciales y remotos',
  },

  // Enlaces de navegación rápida
  navLinks: [
    { name: 'Inicio', href: '#inicio' },
    { name: 'Nosotros', href: '#nosotros' },
    { name: 'Servicios', href: '#servicios' },
    { name: 'Productos', href: '#productos' },
    { name: 'Descargas', href: '#descargas' },
    { name: 'Planes', href: '#planes' },
    { name: 'Contacto', href: '#contacto' },
  ],

  // Paleta corporativa oficial
  colors: {
    darkBlue: '#0B1530',
    primaryBlue: '#2563EB',
    skyBlue: '#38BDF8',
    white: '#FFFFFF',
    lightGray: '#F8FAFC'
  }
}
