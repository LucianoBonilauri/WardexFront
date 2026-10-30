import { useEffect, useState } from 'react'
import { alVencerLaSesion, hayTokenVigente } from './api/cliente.ts'
import { cerrarSesion, contrasenaGuardada, cuentaGuardada, guardarContrasena, obtenerCuenta } from './api/cuenta.ts'
import type { Pagina } from './Components/header.tsx'
import Credenciales from './Pages/credenciales.tsx'
import Dashboard from './Pages/Dashboard.tsx'
import CodigoAutenticacion, { type Verificacion } from './Pages/ManejoDePerfil/CodigoAutenticacion.tsx'
import IniciarSesion from './Pages/ManejoDePerfil/IniciarSesion.tsx'
import Inicio from './Pages/inicio.tsx'
import Perfil from './Pages/ManejoDePerfil/Perfil.tsx'
import Registro from './Pages/ManejoDePerfil/Registro.tsx'
import type { Cuenta } from './tipos.ts'

// Lo que se ve en la barra de direcciones en cada pantalla
const RUTAS: Record<Pagina, string> = {
  inicio: '/Inicio',
  credenciales: '/Instalacion',
  registro: '/Registro',
  iniciarSesion: '/Iniciar_Sesion',
  codigoAutenticacion: '/Codigo_Autenticacion',
  dashboard: '/Dashboard',
  perfil: '/Perfil',
}

// La pantalla de la dirección actual, sin importar mayúsculas ni la barra del final. Si no es ninguna (como "/"), Inicio.
// La del código necesita datos que solo viven en memoria: si se llega escribiendo la dirección, recargando
// o con las flechas del navegador, esos datos ya no están y se va al login (o a Perfil si hay sesión: se estaba cambiando el mail)
function paginaDeLaUrl(): Pagina {
  const ruta = window.location.pathname.replace(/\/$/, '').toLowerCase()
  const paginas = Object.keys(RUTAS) as Pagina[]
  const pagina = paginas.find((p) => RUTAS[p].toLowerCase() === ruta) ?? 'inicio'
  if (pagina !== 'codigoAutenticacion') return pagina
  return hayTokenVigente() ? 'perfil' : 'iniciarSesion'
}

function App() {
  const [pagina, setPagina] = useState<Pagina>(paginaDeLaUrl)
  // La cuenta que inició sesión; la comparten Perfil y Dashboard. null = nadie inició sesión.
  // Al abrir o recargar la app se recupera la que quedó guardada en el navegador, si el token todavía vale
  const [cuenta, setCuenta] = useState<Cuenta | null>(cuentaGuardada)
  // La contraseña con la que se entró, para que el ojito de Perfil la pueda mostrar.
  // Queda guardada en el navegador mientras dure la sesión (la API nunca la devuelve) y se borra al cerrarla
  const [contrasenaSesion, setContrasenaSesion] = useState<string | null>(contrasenaGuardada)
  // Los datos de la pantalla del código (correo, de dónde se vino y la contraseña para reenviarlo).
  // Solo en memoria y solo mientras se está en esa pantalla: al salir se borran
  const [verificacion, setVerificacion] = useState<Verificacion | null>(null)

  // El token dura 1 hora: cuando la API avisa que venció, se cierra la sesión y se vuelve al login
  useEffect(() => {
    alVencerLaSesion(() => {
      cerrarSesion()
      setCuenta(null)
      setContrasenaSesion(null)
      window.history.pushState(null, '', RUTAS.iniciarSesion)
      setPagina('iniciarSesion')
    })
  }, [])

  useEffect(() => {
    // Al abrir la app, la dirección queda con el nombre de la pantalla: "/" o "/#integraciones" pasan a "/Inicio"
    window.history.replaceState(null, '', RUTAS[paginaDeLaUrl()])

    // Con los botones Atrás y Adelante del navegador cambia la dirección, y la pantalla la sigue
    const seguirLaUrl = () => {
      const destino = paginaDeLaUrl()
      // Si se volvió a la dirección del código, queda la del login (que es la pantalla que se ve)
      window.history.replaceState(null, '', RUTAS[destino])
      setVerificacion(null)
      setPagina(destino)
    }
    window.addEventListener('popstate', seguirLaUrl)
    return () => window.removeEventListener('popstate', seguirLaUrl)
  }, [])

  // Al entrar a Perfil se vuelven a pedir los datos de la cuenta, por si cambiaron desde otro dispositivo
  useEffect(() => {
    if (pagina !== 'perfil' || !hayTokenVigente()) return

    obtenerCuenta()
      .then((nueva) => {
        // Si mientras tanto se cerró la sesión, ya no sirven
        if (hayTokenVigente()) setCuenta(nueva)
      })
      .catch((error) => console.error('No se pudieron traer los datos de la cuenta:', error))
  }, [pagina])

  const cambiarPagina = (nueva: Pagina) => {
    // La página nueva arranca desde arriba, sin la animación del scroll suave
    window.scrollTo({ top: 0, behavior: 'instant' })
    window.history.pushState(null, '', RUTAS[nueva])
    // Al salir de la pantalla del código se borran sus datos (incluida la contraseña)
    if (nueva !== 'codigoAutenticacion') setVerificacion(null)
    setPagina(nueva)
  }

  // Después de la contraseña (login, registro o cambio de mail), el backend manda un código al mail: sigue la pantalla del código
  const pedirCodigo = (datos: Verificacion) => {
    // Al crear una cuenta nueva se cierra la sesión que hubiera abierta en este navegador
    if (datos.origen === 'registro') {
      setCuenta(null)
      setContrasenaSesion(null)
    }
    setVerificacion(datos)
    cambiarPagina('codigoAutenticacion')
  }

  // Después de ingresar el código: recién ahí hay sesión. Si se estaba cambiando el mail, la sesión sigue
  // (con un token nuevo) y se vuelve a Perfil
  const entrar = (nueva: Cuenta, contrasena: string, destino: Pagina) => {
    guardarContrasena(contrasena)
    setCuenta(nueva)
    setContrasenaSesion(contrasena)
    cambiarPagina(destino)
  }

  // Botón Cerrar sesión de Perfil
  const salir = () => {
    cerrarSesion()
    setCuenta(null)
    setContrasenaSesion(null)
    cambiarPagina('inicio')
  }

  if (pagina === 'credenciales') {
    return <Credenciales onCambiarPagina={cambiarPagina} />
  }

  if (pagina === 'registro') {
    return <Registro onCambiarPagina={cambiarPagina} onPedirCodigo={pedirCodigo} />
  }

  if (pagina === 'codigoAutenticacion' && verificacion) {
    return (
      <CodigoAutenticacion
        verificacion={verificacion}
        onVerificado={(nueva) => entrar(nueva, verificacion.contrasena, verificacion.origen === 'mail' ? 'perfil' : 'dashboard')}
        onCambiarPagina={cambiarPagina}
      />
    )
  }

  // Sin los datos del código (no debería pasar: solo se llega desde el login o el registro) se muestra el login
  if (pagina === 'iniciarSesion' || pagina === 'codigoAutenticacion') {
    return <IniciarSesion onCambiarPagina={cambiarPagina} onPedirCodigo={pedirCodigo} />
  }

  if (pagina === 'dashboard') {
    // Si el nombre no se conoce (se inició sesión en otro navegador), se muestra el correo
    return <Dashboard onCambiarPagina={cambiarPagina} nombreUsuario={cuenta?.nombreUsuario || cuenta?.correo} conSesion={Boolean(cuenta)} />
  }

  if (pagina === 'perfil') {
    // La key hace que Perfil arranque de nuevo si cambia la sesión, para que los campos se llenen con los datos que corresponden
    return (
      <Perfil
        key={cuenta?.correo ?? 'sin-cuenta'}
        onCambiarPagina={cambiarPagina}
        cuenta={cuenta}
        contrasenaActual={contrasenaSesion}
        onCuentaActualizada={setCuenta}
        onContrasenaCambiada={setContrasenaSesion}
        onPedirCodigo={pedirCodigo}
        onCerrarSesion={salir}
      />
    )
  }

  return <Inicio onCambiarPagina={cambiarPagina} />
}

export default App
