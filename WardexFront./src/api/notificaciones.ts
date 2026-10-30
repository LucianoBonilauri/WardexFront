import type { Alerta, Gravedad } from '../tipos.ts'
import { pedir } from './cliente.ts'

// La API manda más datos por alerta (descripción, IPs, URLs...) que por ahora no se muestran.
// Ojo: esos datos vienen de los atacantes; si algún día se muestran, siempre como texto, nunca como HTML
type NotificacionApi = {
  id: string
  severidad: Gravedad
  tipo: string
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
  }))
}
