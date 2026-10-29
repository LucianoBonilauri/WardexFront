import { useEffect, useState } from 'react'
import { alVencerLaSesion } from './api/cliente.ts'
import { cerrarSesion, cuentaGuardada } from './api/cuenta.ts'
import type { Pagina } from './Components/header.tsx'
import Credenciales from './Pages/credenciales.tsx'
import Dashboard from './Pages/Dashboard.tsx'
import IniciarSesion from './Pages/IniciarSesion.tsx'
import Inicio from './Pages/inicio.tsx'
import Perfil from './Pages/Perfil.tsx'
import Registro from './Pages/Registro.tsx'
import type { Cuenta } from './tipos.ts'

// Lo que se ve en la barra de direcciones en cada pantalla
const RUTAS: Record<Pagina, string> = {
  inicio: '/Inicio',
  credenciales: '/Instalacion',
  registro: '/Registro',
  iniciarSesion: '/Iniciar_Sesion',
  dashboard: '/Dashboard',
  perfil: '/Perfil',
}

// La pantalla de la dirección actual, sin importar mayúsculas ni la barra del final. Si no es ninguna (como "/"), Inicio
function paginaDeLaUrl(): Pagina {
  const ruta = window.location.pathname.replace(/\/$/, '').toLowerCase()
  const paginas = Object.keys(RUTAS) as Pagina[]
  return paginas.find((pagina) => RUTAS[pagina].toLowerCase() === ruta) ?? 'inicio'
}

function App() {
  const [pagina, setPagina] = useState<Pagina>(paginaDeLaUrl)
  // La cuenta que inició sesión; la comparten Perfil y Dashboard. null = nadie inició sesión.
  // Al abrir o recargar la app se recupera la que quedó guardada en el navegador, si el token todavía vale
  const [cuenta, setCuenta] = useState<Cuenta | null>(cuentaGuardada)
  // La contraseña con la que se entró, para que el ojito de Perfil la pueda mostrar.
  // Vive solo en la memoria de esta pestaña: nunca se guarda en el navegador y se pierde al recargar
  const [contrasenaSesion, setContrasenaSesion] = useState<string | null>(null)

  // El token dura 1 hora: cuando la API avisa que venció, se cierra la sesión y se vuelve al login
  useEffect(() => {
    alVencerLaSesion(() => {
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
    const seguirLaUrl = () => setPagina(paginaDeLaUrl())
    window.addEventListener('popstate', seguirLaUrl)
    return () => window.removeEventListener('popstate', seguirLaUrl)
  }, [])

  const cambiarPagina = (nueva: Pagina) => {
    // La página nueva arranca desde arriba, sin la animación del scroll suave
    window.scrollTo({ top: 0, behavior: 'instant' })
    window.history.pushState(null, '', RUTAS[nueva])
    setPagina(nueva)
  }

  // Después de iniciar sesión o registrarse
  const entrar = (nueva: Cuenta, contrasena: string) => {
    setCuenta(nueva)
    setContrasenaSesion(contrasena)
    cambiarPagina('dashboard')
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
    return <Registro onCambiarPagina={cambiarPagina} onEntrar={entrar} />
  }

  if (pagina === 'iniciarSesion') {
    return <IniciarSesion onCambiarPagina={cambiarPagina} onEntrar={entrar} />
  }

  if (pagina === 'dashboard') {
    // Si el nombre no se conoce (se inició sesión en otro navegador), se muestra el correo
    return <Dashboard onCambiarPagina={cambiarPagina} nombreUsuario={cuenta?.nombreUsuario || cuenta?.correo} conSesion={Boolean(cuenta)} />
  }

  if (pagina === 'perfil') {
    // La key hace que Perfil arranque de nuevo si cambia la sesión, para que los campos se llenen con los datos que corresponden
    return <Perfil key={cuenta?.correo ?? 'sin-cuenta'} onCambiarPagina={cambiarPagina} cuenta={cuenta} contrasenaActual={contrasenaSesion} onCerrarSesion={salir} />
  }

  return <Inicio onCambiarPagina={cambiarPagina} />
}

export default App
