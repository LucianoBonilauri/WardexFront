import type { DetalleAlerta } from '../../tipos.ts'

// "Prompt para resolver": arma un texto listo para pegar en Claude (o cualquier IA) pidiendo
// cómo resolver el ataque. Es genérico por tipo de ataque (las plantillas de abajo) y se completa
// con los datos de la alerta, así el usuario solo tiene que copiar y pegar.

type Plantilla = {
  // Cómo se describe el ataque, en primera persona ("mi sistema detectó ...")
  ataque: string
  // El rótulo de la cantidad de pedidos del atacante
  pedidos: string
  // El título de la lista de cosas que probó (rutas, entradas, usuarios)
  probadas: string
  // Lo que se le pide a la IA, propio de este ataque. El marco (contexto + "no ejecutes nada") es común
  pasos: string[]
}

const PLANTILLAS: Record<string, Plantilla> = {
  escaneo_rutas: {
    ataque: 'un escaneo de rutas: alguien probó muchas direcciones de mi sitio buscando páginas o archivos ocultos',
    pedidos: 'Pedidos',
    probadas: 'Rutas que probó',
    pasos: [
      'Qué está buscando el atacante y qué riesgo real tiene para mi servidor.',
      'Cómo bloqueo esa IP ya mismo y cómo freno escaneos así (fail2ban, reglas de nginx/Apache o del firewall). Dame los comandos y la configuración.',
      'Qué rutas de las que probó debería revisar o dejar de exponer, y cómo me aseguro de que no haya quedado nada sensible al alcance.',
      'Cómo prevengo que vuelva a pasar.',
    ],
  },
  sql_i: {
    ataque: 'un intento de inyección SQL: mandó comillas y fragmentos de consultas SQL en las direcciones de mi sitio para tratar de leer o romper la base de datos',
    pedidos: 'Pedidos',
    probadas: 'Entradas que probó',
    pasos: [
      'Qué intenta lograr una inyección SQL y qué podría haber conseguido.',
      'Cómo bloqueo esa IP ahora y cómo reviso en mis logs y en la base de datos si alguna de esas peticiones tuvo efecto.',
      'Cómo dejo mi código a salvo de inyección SQL (consultas parametrizadas / prepared statements) y qué endpoints de los que atacó tengo que revisar.',
      'Cómo prevengo que vuelva a pasar (validación de entradas, un WAF).',
    ],
  },
  path_transversal: {
    ataque: 'un intento de inclusión de archivos / path traversal: usó secuencias como ../ para tratar de leer archivos del servidor que no debería ver',
    pedidos: 'Pedidos',
    probadas: 'Rutas que probó',
    pasos: [
      'Qué archivos intenta leer este ataque y qué riesgo tiene.',
      'Cómo bloqueo esa IP ahora y cómo reviso si llegó a leer algún archivo sensible (/etc/passwd, configuraciones, credenciales).',
      'Cómo arreglo el código para que una ruta no pueda salir del directorio permitido.',
      'Cómo prevengo que vuelva a pasar.',
    ],
  },
  fuerza_bruta: {
    ataque: 'un ataque de fuerza bruta contra SSH: probó muchas contraseñas y usuarios para entrar a mi servidor',
    pedidos: 'Contraseñas que probó',
    probadas: 'Usuarios que probó',
    pasos: [
      'Qué tan grave es y cómo me doy cuenta si el atacante llegó a entrar.',
      'Cómo bloqueo esa IP ya mismo y cómo endurezco el acceso SSH (fail2ban, deshabilitar el ingreso por contraseña, usar claves, cambiar el puerto). Dame los comandos.',
      'Qué reviso para descartar que ya haya entrado (usuarios nuevos, accesos recientes, procesos o tareas raras).',
      'Cómo prevengo que vuelva a pasar.',
    ],
  },
}

// Un tipo que no está en PLANTILLAS usa un marco neutro con los rótulos del escaneo
const GENERICA: Plantilla = {
  ataque: 'una actividad sospechosa en mi servidor',
  pedidos: 'Pedidos',
  probadas: 'Lo que probó',
  pasos: [
    'Qué está intentando hacer el atacante y qué riesgo tiene.',
    'Cómo bloqueo esa IP ya mismo y cómo freno este tipo de actividad. Dame los comandos y la configuración.',
    'Qué reviso en el servidor para saber si consiguió algo.',
    'Cómo prevengo que vuelva a pasar.',
  ],
}

// Las alertas viejas de SSH traían "usuario: admin" en vez de "admin"
function sinPrefijoUsuario(valor: string): string {
  return valor.startsWith('usuario: ') ? valor.slice('usuario: '.length) : valor
}

// 4614 → "4.614"
function numero(valor: number): string {
  return valor.toLocaleString('es-AR', { maximumFractionDigits: 1 })
}

// Una lista con viñetas y sangría para el prompt, recortada a `maximo` ítems
function lista(items: string[], maximo = 12): string {
  const recorte = items.slice(0, maximo).map((item) => `    - ${item}`)
  if (items.length > maximo) recorte.push(`    - … (${items.length - maximo} más)`)
  return recorte.join('\n')
}

type DatosPrompt = {
  // La clave del tipo tal como la manda el agente (escaneo_rutas, sql_i, ...)
  clave: string
  detalle: DetalleAlerta
  // "Hoy de 08:47 a 08:48", ya armado por el panel (misma frase que se muestra arriba)
  cuando: string
  // Las rutas que respondieron 2xx (el atacante las encontró). Vacío si no hubo o no aplica (SSH)
  rutasEncontradas: string[]
}

// Arma el prompt completo, listo para pegar en una IA
export function armarPromptResolver({ clave, detalle, cuando, rutasEncontradas }: DatosPrompt): string {
  const plantilla = PLANTILLAS[clave] ?? GENERICA

  // "Esto es lo que registró": solo las líneas que la alerta realmente trae
  const contexto: string[] = []
  if (detalle.host) contexto.push(`- Sitio: ${detalle.host}`)

  const [ipPrincipal, ...otrasIps] = detalle.ips
  if (ipPrincipal !== undefined) {
    const extra = otrasIps.length > 0 ? ` (también: ${otrasIps.join(', ')})` : ''
    contexto.push(`- IP del atacante: ${ipPrincipal}${extra}`)
  }

  if (detalle.userAgents.length > 0) contexto.push(`- Herramienta: ${detalle.userAgents.join(', ')}`)
  if (cuando) contexto.push(`- Cuándo: ${cuando}`)
  if (detalle.pedidos !== null) contexto.push(`- ${plantilla.pedidos}: ${numero(detalle.pedidos)}`)

  if (detalle.urlsEjemplo.length > 0) {
    contexto.push(`- ${plantilla.probadas}:\n${lista(detalle.urlsEjemplo.map(sinPrefijoUsuario))}`)
  }
  if (rutasEncontradas.length > 0) {
    contexto.push(`- Rutas que SÍ respondieron (puede que las haya encontrado):\n${lista(rutasEncontradas)}`)
  }

  const pasos = plantilla.pasos.map((paso, i) => `${i + 1}. ${paso}`).join('\n')

  return [
    `Soy el responsable de un servidor y mi sistema de monitoreo detectó ${plantilla.ataque}.`,
    '',
    'Esto es lo que registró:',
    contexto.join('\n'),
    '',
    'Explicámelo en español, en pasos concretos. No ejecutes ni cambies nada: dame los comandos y la configuración para que los revise yo antes de aplicarlos.',
    '',
    pasos,
  ].join('\n')
}
