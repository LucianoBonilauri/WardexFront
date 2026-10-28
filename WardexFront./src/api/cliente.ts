// La función que usan todas las requests: arma la dirección, manda el token y traduce los errores

const API_URL = import.meta.env.VITE_API_URL
const CLAVE_TOKEN = 'wardex-token'

// El token que devuelve el login. Queda guardado para no perder la sesión al recargar
export function guardarToken(token: string | null) {
  if (token) localStorage.setItem(CLAVE_TOKEN, token)
  else localStorage.removeItem(CLAVE_TOKEN)
}

// El token dura 1 hora: si ya venció, no sirve para nada guardarlo
export function hayTokenVigente(): boolean {
  const token = localStorage.getItem(CLAVE_TOKEN)
  if (!token) return false

  try {
    // El token es un JWT: la parte del medio dice hasta cuándo vale ("exp", en segundos)
    const { exp } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof exp !== 'number' || exp * 1000 > Date.now()
  } catch {
    // Si no se puede leer, que decida la API cuando se use
    return true
  }
}

// Qué hacer cuando la API avisa que el token venció o no sirve (lo define App: volver al login)
let alVencer = () => {}

export function alVencerLaSesion(accion: () => void) {
  alVencer = accion
}

// Error con el código HTTP (0 = no se pudo conectar) y un mensaje listo para mostrar en pantalla
export class ErrorApi extends Error {
  estado: number

  constructor(estado: number, mensaje: string) {
    super(mensaje)
    this.estado = estado
  }
}

export function mensajeDeError(error: unknown): string {
  return error instanceof ErrorApi ? error.message : 'Algo salió mal. Probá de nuevo en un rato.'
}

type Metodo = 'GET' | 'POST' | 'PATCH' | 'DELETE'

// mensajes: el texto para mostrar según el código de error de cada request (por ejemplo, 401 en el login)
export async function pedir<T>(metodo: Metodo, ruta: string, cuerpo?: unknown, mensajes: Record<number, string> = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json'
  const token = localStorage.getItem(CLAVE_TOKEN)
  if (token) headers.Authorization = `Bearer ${token}`

  let respuesta: Response
  try {
    respuesta = await fetch(API_URL + ruta, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    // fetch solo falla así cuando no hay conexión o el servidor no responde
    throw new ErrorApi(0, 'No se pudo conectar con el servidor. Revisá tu conexión y probá de nuevo.')
  }

  const datos = await respuesta.json().catch(() => null)

  // fetch no avisa si el servidor respondió con error: hay que revisarlo a mano
  if (!respuesta.ok) {
    // Se mandó un token y la API no lo aceptó: venció (dura 1 hora) y hay que volver a iniciar sesión
    if (respuesta.status === 401 && token) {
      guardarToken(null)
      alVencer()
    }

    // Los mensajes de 400 y 409 del backend están pensados para mostrarse tal cual
    const delBackend = respuesta.status === 400 || respuesta.status === 409 ? datos?.message : undefined
    const mensaje = mensajes[respuesta.status]
      ?? delBackend
      ?? (respuesta.status === 401 ? 'Tu sesión venció. Iniciá sesión de nuevo.' : 'Algo salió mal. Probá de nuevo en un rato.')
    throw new ErrorApi(respuesta.status, mensaje)
  }

  return datos as T
}
