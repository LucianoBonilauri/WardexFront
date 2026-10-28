import type { Cuenta } from '../tipos.ts'
import { guardarToken, hayTokenVigente, pedir } from './cliente.ts'

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

// POST /auth/login
export async function iniciarSesion(correo: string, contrasena: string): Promise<Cuenta> {
  const { token } = await pedir<{ token: string }>('POST', '/auth/login', { mail: correo, password: contrasena }, {
    401: 'El correo o la contraseña no son correctos.',
  })
  guardarToken(token)

  // El token no trae el nombre ni el teléfono: se usan los que quedaron de esta cuenta, si los hay
  const anterior = leerCuenta()
  const mismoCorreo = anterior?.correo.toLowerCase() === correo.toLowerCase()
  const cuenta = mismoCorreo && anterior ? anterior : { nombreUsuario: '', correo, telefono: '' }
  guardarCuenta(cuenta)
  return cuenta
}

// Lo que devuelve el registro
type UsuarioApi = {
  nombre_usuario: string
  mail: string
  telefono: string
}

// POST /auth/crearusuario. No devuelve token, así que después inicia sesión con los mismos datos
export async function registrarse(datos: Cuenta & { contrasena: string }): Promise<Cuenta> {
  const { usuario } = await pedir<{ usuario: UsuarioApi }>('POST', '/auth/crearusuario', {
    nombre_usuario: datos.nombreUsuario,
    mail: datos.correo,
    telefono: datos.telefono,
    password: datos.contrasena,
  })

  const cuenta = { nombreUsuario: usuario.nombre_usuario, correo: usuario.mail, telefono: usuario.telefono }
  guardarCuenta(cuenta)
  await iniciarSesion(cuenta.correo, datos.contrasena)
  return cuenta
}

// La API no tiene una ruta para cerrar sesión: alcanza con borrar el token de este navegador
export function cerrarSesion() {
  guardarToken(null)
}
