import type { Cuenta } from '../tipos.ts'
import { ErrorApi, guardarToken, hayTokenVigente, pedir } from './cliente.ts'

// Los datos de la cuenta también quedan guardados en el navegador, para tenerlos al recargar sin esperar a la API
const CLAVE_CUENTA = 'wardex-cuenta'
// La contraseña con la que se inició sesión, para que el ojito de Perfil la pueda mostrar (la API nunca la devuelve).
// Dura lo mismo que la sesión: se borra al cerrarla o cuando vence
const CLAVE_CONTRASENA = 'wardex-contrasena'

// La cuenta como la manda la API (también manda el id y si el mail está verificado, que no se usan)
type UsuarioApi = {
  nombre_usuario: string
  mail: string
  telefono: string
}

function leerCuenta(): Cuenta | null {
  const guardada = localStorage.getItem(CLAVE_CUENTA)
  return guardada ? JSON.parse(guardada) : null
}

// Pasa la cuenta que mandó la API al formato de las pantallas y la deja guardada en el navegador
function guardarCuenta(usuario: UsuarioApi): Cuenta {
  const cuenta = { nombreUsuario: usuario.nombre_usuario, correo: usuario.mail, telefono: usuario.telefono }
  localStorage.setItem(CLAVE_CUENTA, JSON.stringify(cuenta))
  return cuenta
}

// Al abrir o recargar la app: la cuenta guardada, si el token todavía vale. Si no, null
export function cuentaGuardada(): Cuenta | null {
  if (!hayTokenVigente()) {
    cerrarSesion()
    return null
  }
  return leerCuenta()
}

export function guardarContrasena(contrasena: string) {
  localStorage.setItem(CLAVE_CONTRASENA, contrasena)
}

// Al abrir o recargar la app: la contraseña guardada, si la sesión sigue abierta. Si no, null
export function contrasenaGuardada(): string | null {
  return hayTokenVigente() ? localStorage.getItem(CLAVE_CONTRASENA) : null
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
  usuario: UsuarioApi
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
  cerrarSesion()
  return { correo: usuario.mail, codigoEnviado: codigo_enviado, mensaje: message }
}

// POST /auth/verificar: la única ruta que devuelve el token, junto con los datos de la cuenta.
// El código va como texto porque puede empezar con 0
export async function verificarCodigo(correo: string, codigo: string): Promise<Cuenta> {
  const { token, usuario } = await pedir<{ token?: string; usuario?: UsuarioApi }>('POST', '/auth/verificar', { mail: correo, codigo })
  if (!token || !usuario) throw new ErrorApi(500, 'Algo salió mal. Probá de nuevo en un rato.')
  guardarToken(token)
  return guardarCuenta(usuario)
}

// POST /auth/reenviar-codigo: otro código para terminar el registro.
// Desde el login no sirve (así lo pide el backend): ahí se reenvía llamando de nuevo a iniciarSesion
export async function reenviarCodigoRegistro(correo: string): Promise<string> {
  const { message } = await pedir<{ message: string }>('POST', '/auth/reenviar-codigo', { mail: correo })
  return message
}

// GET /auth/usuario: los datos de la cuenta, por si cambiaron desde otro dispositivo
export async function obtenerCuenta(): Promise<Cuenta> {
  const { usuario } = await pedir<{ usuario: UsuarioApi }>('GET', '/auth/usuario')
  return guardarCuenta(usuario)
}

// PATCH /auth/usuario: cambia el nombre de usuario y el teléfono (los que no se mandan quedan como están).
// Devuelve la cuenta como quedó guardada: por ejemplo, el teléfono sin espacios ni guiones
export async function editarCuenta(cambios: { nombreUsuario?: string; telefono?: string }): Promise<Cuenta> {
  const { usuario } = await pedir<{ usuario: UsuarioApi }>('PATCH', '/auth/usuario', {
    nombre_usuario: cambios.nombreUsuario,
    telefono: cambios.telefono,
  })
  return guardarCuenta(usuario)
}

// POST /auth/cambiar-password. Devuelve un token nuevo porque el anterior deja de servir
// (también se cierran las sesiones abiertas en otros dispositivos)
export async function cambiarContrasena(actual: string, nueva: string) {
  const { token } = await pedir<{ token?: string }>('POST', '/auth/cambiar-password', { password_actual: actual, password_nueva: nueva })
  if (!token) throw new ErrorApi(500, 'Algo salió mal. Probá de nuevo en un rato.')
  guardarToken(token)
  guardarContrasena(nueva)
}

// Cambiar el mail lleva dos pasos, como entrar. Primero POST /auth/cambiar-mail, con la contraseña actual:
// el backend manda un código al mail nuevo. Llamarla de nuevo sirve para reenviar el código
export async function pedirCambioDeMail(mailNuevo: string, contrasena: string): Promise<string> {
  const { message } = await pedir<{ message: string }>('POST', '/auth/cambiar-mail', { mail_nuevo: mailNuevo, password: contrasena })
  return message
}

// Después, POST /auth/confirmar-mail con ese código. Devuelve un token nuevo porque el anterior deja de servir
export async function confirmarCambioDeMail(codigo: string): Promise<Cuenta> {
  const { token, usuario } = await pedir<{ token?: string; usuario?: UsuarioApi }>('POST', '/auth/confirmar-mail', { codigo })
  if (!token || !usuario) throw new ErrorApi(500, 'Algo salió mal. Probá de nuevo en un rato.')
  guardarToken(token)
  return guardarCuenta(usuario)
}

// La API no tiene una ruta para cerrar sesión: alcanza con borrar el token de este navegador (y la contraseña guardada)
export function cerrarSesion() {
  guardarToken(null)
  localStorage.removeItem(CLAVE_CONTRASENA)
}
