import type { Alerta, Gravedad, Mitre } from '../tipos.ts'
import { pedir } from './cliente.ts'

// La técnica de MITRE ATT&CK como la manda la API
type MitreApi = {
  tecnica: string
  nombre: string
  tactica: string
  nombre_tactica: string
}

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
  // Nuevo, y puede no venir (alertas viejas, o si el back todavía no se redeployó). La doc nueva lo pone en
  // resumen.mitre, pero lo demás de resumen (pedidos, ips...) la API lo manda suelto: se acepta en los dos lugares
  mitre?: MitreApi | null
  resumen?: { mitre?: MitreApi | null }
}

function mitreDeLaApi(mitre: MitreApi | null | undefined): Mitre | null {
  if (!mitre?.tecnica) return null
  return { tecnica: mitre.tecnica, nombre: mitre.nombre, tactica: mitre.tactica, nombreTactica: mitre.nombre_tactica }
}

// GET /notificaciones: las alertas que mandaron los agentes, de la más nueva a la más vieja.
// Trae hasta 100, el máximo que devuelve la API de una vez
export async function obtenerAlertas(): Promise<Alerta[]> {
  const { notificaciones } = await pedir<{ notificaciones: NotificacionApi[] }>('GET', '/notificaciones?limite=100')

  return notificaciones.map((notificacion) => ({
    id: notificacion.id,
    tipo: notificacion.tipo,
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
      mitre: mitreDeLaApi(notificacion.resumen?.mitre ?? notificacion.mitre),
    },
  }))
}
