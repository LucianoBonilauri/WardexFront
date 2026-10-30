import type { Cuenta } from '../tipos.ts'
import { ErrorApi, guardarToken, hayTokenVigente, pedir } from './cliente.ts'

// La API no tiene una ruta que devuelva los datos de la cuenta: se guardan en el navegador
// con lo que se escribió al registrarse o al iniciar sesión
const CLAVE_CUENTA = 'wardex-cuenta'

function leerCuenta(): Cuenta | null {
  const guardada = localStorage.getItem(CLAVE_CUENTA)
  return guardada ? JSON.parse(guardada) : null
}

function guardarCuenta(cuenta: Cuenta) {
  localStorage.setItem(CLAVE_CUENTA, JSON.stringify(cuenta))
}

// Al abrir o recargar la app: la cuenta guardada, si el token todavía vale. Si no, null
export function cuentaGuardada(): Cuenta | null {
  if (!hayTokenVigente()) {
    guardarToken(null)
    return null
  }
  return leerCuenta()
}

// Para entrar hacen falta dos pasos: la contraseña (login o registro), que hace que el backend mande
// un código de 6 números al mail, y después ese código (verificarCodigo), que es lo único que devuelve el token

// POST /auth/login. No devuelve el token: devuelve el mensaje de que se mandó el código.
// También sirve para reenviar el código desde la pantalla del código
export async function iniciarSesion(correo: string, contrasena: string): Promise<string> {
  const datos = await pedir<{ requiere_codigo?: boolean; message?: string }>('POST', '/auth/login', { mail: correo, password: contrasena }, {
    401: 'El correo o la contraseña no son correctos.',
  })
  // Si el backend no pide el código, mejor frenar acá que seguir sin token
  if (!datos?.requiere_codigo) throw new ErrorApi(500, 'Algo salió mal. Probá de nuevo en un rato.')
  return datos.message ?? 'Te mandamos un código a tu mail'
}

// Lo que devuelve el registro
type RespuestaRegistro = {
  message: string
  usuario: {
    nombre_usuario: string
    mail: string
    telefono: string
  }
  // false si la cuenta se creó pero el mail con el código no salió
  codigo_enviado: boolean
}

// POST /auth/crearusuario. Crea la cuenta y manda el código al mail (no inicia sesión)
export async function registrarse(datos: Cuenta & { contrasena: string }) {
  const { message, usuario, codigo_enviado } = await pedir<RespuestaRegistro>('POST', '/auth/crearusuario', {
    nombre_usuario: datos.nombreUsuario,
    mail: datos.correo,
    telefono: datos.telefono,
    password: datos.contrasena,
  })

  // Si había otra sesión abierta en este navegador, se cierra: ahora se está entrando con esta cuenta
  guardarToken(null)
  // El nombre y el teléfono se guardan ya: la API no tiene una ruta para pedirlos después
  guardarCuenta({ nombreUsuario: usuario.nombre_usuario, correo: usuario.mail, telefono: usuario.telefono })
  return { correo: usuario.mail, codigoEnviado: codigo_enviado, mensaje: message }
}

// POST /auth/verificar: la única ruta que devuelve el token. El código va como texto porque puede empezar con 0
export async function verificarCodigo(correo: string, codigo: string): Promise<Cuenta> {
  const { token } = await pedir<{ token?: string }>('POST', '/auth/verificar', { mail: correo, codigo })
  if (!token) throw new ErrorApi(500, 'Algo salió mal. Probá de nuevo en un rato.')
  guardarToken(token)

  // El token no trae el nombre ni el teléfono: se usan los que quedaron de esta cuenta, si los hay
  const anterior = leerCuenta()
  const mismoCorreo = anterior?.correo.toLowerCase() === correo.toLowerCase()
  const cuenta = mismoCorreo && anterior ? anterior : { nombreUsuario: '', correo, telefono: '' }
  guardarCuenta(cuenta)
  return cuenta
}

// POST /auth/reenviar-codigo: otro código para terminar el registro.
// Desde el login no sirve (así lo pide el backend): ahí se reenvía llamando de nuevo a iniciarSesion
export async function reenviarCodigoRegistro(correo: string): Promise<string> {
  const { message } = await pedir<{ message: string }>('POST', '/auth/reenviar-codigo', { mail: correo })
  return message
}

// La API no tiene una ruta para cerrar sesión: alcanza con borrar el token de este navegador
export function cerrarSesion() {
  guardarToken(null)
}
