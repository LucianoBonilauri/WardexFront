import type { Alerta, Gravedad } from '../tipos.ts'
import { pedir } from './cliente.ts'

// Una alerta como la manda la API. Las alertas viejas pueden traer null en descripcion, hasta, pedidos y pct_*.
// Ojo: las rutas, las herramientas y las líneas del log vienen de los atacantes: siempre como texto, nunca como HTML
type NotificacionApi = {
  id: string
  severidad: Gravedad
  tipo: string
  descripcion: string | null
  // Fechas ISO en UTC
  desde: string
  hasta: string | null
  detectado_en: string
  host: string
  ips: string[]
  pedidos: number | null
  pct_404: number | null
  pct_4xx: number | null
  pct_5xx: number | null
  user_agents: string[]
  urls_ejemplo: string[]
  lineas_ejemplo: string[]
  score: number
  fuente_deteccion: string
}

// El texto para mostrar de cada tipo de ataque (el que sugiere el backend)
const TEXTO_TIPO: Record<string, string> = {
  fuerza_bruta: 'Fuerza bruta',
  sql_i: 'Inyección SQL',
  escaneo_rutas: 'Escaneo de rutas',
  path_transversal: 'Path traversal',
  escaneo_red: 'Escaneo de red',
  webshell: 'Webshell',
  exfiltracion: 'Exfiltración de datos',
  denegacion_servicio: 'Denegación de servicio',
}

// GET /notificaciones: las alertas que mandaron los agentes, de la más nueva a la más vieja.
// Trae hasta 100, el máximo que devuelve la API de una vez
export async function obtenerAlertas(): Promise<Alerta[]> {
  const { notificaciones } = await pedir<{ notificaciones: NotificacionApi[] }>('GET', '/notificaciones?limite=100')

  return notificaciones.map((notificacion) => ({
    id: notificacion.id,
    titulo: TEXTO_TIPO[notificacion.tipo] ?? 'Actividad sospechosa',
    gravedad: notificacion.severidad,
    detalle: {
      descripcion: notificacion.descripcion,
      desde: new Date(notificacion.desde),
      hasta: notificacion.hasta ? new Date(notificacion.hasta) : null,
      detectadoEn: new Date(notificacion.detectado_en),
      host: notificacion.host,
      ips: notificacion.ips,
      pedidos: notificacion.pedidos,
      pct404: notificacion.pct_404,
      pct4xx: notificacion.pct_4xx,
      pct5xx: notificacion.pct_5xx,
      userAgents: notificacion.user_agents,
      urlsEjemplo: notificacion.urls_ejemplo,
      lineasEjemplo: notificacion.lineas_ejemplo,
      score: notificacion.score,
      fuenteDeteccion: notificacion.fuente_deteccion,
    },
  }))
}
