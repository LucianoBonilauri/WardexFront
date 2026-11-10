import type { Servidor } from '../tipos.ts'
import { pedir } from './cliente.ts'

type ServidorApi = {
  id: number
  nombre: string
  activo: boolean
  conectado: boolean
  ultimo_uso: string | null
  api_key_fragmento: string | null
}

// GET /servidores
export async function obtenerServidores(): Promise<Servidor[]> {
  const { servidores } = await pedir<{ servidores: ServidorApi[] }>('GET', '/servidores')

  return servidores.map((servidor) => ({
    id: servidor.id,
    nombre: servidor.nombre,
    activo: servidor.activo,
    conectado: servidor.conectado,
    ultimoUso: servidor.ultimo_uso ? new Date(servidor.ultimo_uso) : null,
    fragmentoKey: servidor.api_key_fragmento ?? null,
  }))
}

// POST /servidores: registra el servidor (uno por usuario) y devuelve la API key para su agente.
// La API no la guarda y no se puede volver a pedir: se muestra una sola vez y no se guarda en ningún lado.
// Si el usuario ya tiene un servidor, el backend responde 409 (pedir lo convierte en error con su mensaje).
export async function crearServidor(nombre: string): Promise<string> {
  const { api_key } = await pedir<{ api_key: string }>('POST', '/servidores', { nombre }, {
    401: 'Iniciá sesión para generar tu credencial.',
  })
  return api_key
}

// POST /servidores/:id/regenerar: genera una API key nueva para el servidor que ya existe
// (la anterior deja de servir). Se muestra una sola vez, como al crearlo.
export async function regenerarKey(id: number): Promise<string> {
  const { api_key } = await pedir<{ api_key: string }>('POST', `/servidores/${id}/regenerar`, undefined, {
    401: 'Iniciá sesión para regenerar tu credencial.',
  })
  return api_key
}
