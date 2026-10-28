import type { Servidor } from '../tipos.ts'
import { pedir } from './cliente.ts'

type ServidorApi = {
  id: number
  nombre: string
  activo: boolean
  conectado: boolean
  ultimo_uso: string | null
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
  }))
}

// POST /servidores: registra un servidor y devuelve la API key para su agente.
// La API no la guarda y no se puede volver a pedir: se muestra una sola vez y no se guarda en ningún lado
export async function crearServidor(nombre: string): Promise<string> {
  const { api_key } = await pedir<{ api_key: string }>('POST', '/servidores', { nombre }, {
    401: 'Iniciá sesión para generar tu credencial.',
  })
  return api_key
}
