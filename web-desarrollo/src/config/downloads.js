/**
 * Catálogo del Centro de Descargas y Registro de Actualizaciones (Changelog)
 * 
 * Para añadir un archivo real:
 * 1. Coloque el archivo (ej. novamobile-v1.0.0.apk) dentro de /public/downloads/
 * 2. Configure 'fileName' con el nombre exacto y 'isAvailable: true'
 */

export const DOWNLOADS = [
  {
    id: 'novamobile-apk',
    productName: 'NovaMobile Android Client',
    category: 'Móvil',
    version: 'v1.0.0-demo',
    os: 'Android 8.0+',
    fileSize: '1.2 KB (Demostrativo)',
    releaseDate: 'Noviembre 2026',
    fileName: 'novamobile-v1.0.0-demo.txt',
    filePath: '/downloads/novamobile-v1.0.0-demo.txt',
    isAvailable: true,
    isDemo: true,
    badge: 'Demostrativo',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Paquete de verificación de canal de distribución para la aplicación móvil NovaMobile. Permite comprobar la descarga del paquete preparatorio antes de la publicación del binario APK final.',
    requirements: ['Arquitectura ARM64 / x86_64', 'Mínimo 50 MB de almacenamiento libre'],
  },
  {
    id: 'novagest-desktop',
    productName: 'NovaGest Enterprise Client',
    category: 'Escritorio',
    version: 'v2.1.0',
    os: 'Windows 10 / 11 (64-bit)',
    fileSize: '64.5 MB',
    releaseDate: 'Próxima versión',
    fileName: null,
    filePath: null,
    isAvailable: false,
    isDemo: false,
    badge: 'Próximamente',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    description: 'Instalador de escritorio para el sistema de gestión administrativa NovaGest con soporte para sincronización local y módulos contables.',
    requirements: ['Windows 10 o superior (64 bits)', '4 GB de memoria RAM recomendada'],
  },
  {
    id: 'novadocs-sync',
    productName: 'NovaDocs Sync Utility',
    category: 'Herramienta',
    version: 'v1.3.0',
    os: 'Multiplataforma (Linux / Win)',
    fileSize: '28.1 MB',
    releaseDate: 'En auditoría',
    fileName: null,
    filePath: null,
    isAvailable: false,
    isDemo: false,
    badge: 'Próximamente',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    description: 'Cliente de sincronización automática en segundo plano para repositorio documental con cifrado AES-256 punto a punto.',
    requirements: ['Conexión a red institucional', 'Permisos de lectura/escritura en disco'],
  }
]

export const CHANGELOG = [
  {
    version: 'v1.0.0-demo',
    date: '19 de Noviembre, 2026',
    tag: 'Lanzamiento Inicial',
    items: [
      'Habilitación del canal oficial de distribución en el sitio web corporativo.',
      'Implementación del archivo de prueba de descarga directa y comprobación de integridad.',
      'Estructura modular preparada para distribución de binarios APK y clientes de escritorio.'
    ]
  },
  {
    version: 'v0.9.5-rc',
    date: '05 de Noviembre, 2026',
    tag: 'Fase de Pruebas',
    items: [
      'Finalización de pruebas de compatibilidad en entornos Docker y servidores Nginx.',
      'Optimización de tiempos de respuesta en la entrega de activos estáticos.'
    ]
  }
]
