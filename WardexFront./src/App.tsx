import { useEffect, useState } from 'react'
import type { Pagina } from './Components/header.tsx'
import Credenciales from './Pages/credenciales.tsx'
import Dashboard from './Pages/Dashboard.tsx'
import IniciarSesion from './Pages/IniciarSesion.tsx'
import Inicio from './Pages/inicio.tsx'
import Registro from './Pages/Registro.tsx'

// Lo que se ve en la barra de direcciones en cada pantalla
const RUTAS: Record<Pagina, string> = {
  inicio: '/Inicio',
  credenciales: '/Instalacion',
  registro: '/Registro',
  iniciarSesion: '/Iniciar_Sesion',
  dashboard: '/Dashboard',
}

// La pantalla de la dirección actual, sin importar mayúsculas ni la barra del final. Si no es ninguna (como "/"), Inicio
function paginaDeLaUrl(): Pagina {
  const ruta = window.location.pathname.replace(/\/$/, '').toLowerCase()
  const paginas = Object.keys(RUTAS) as Pagina[]
  return paginas.find((pagina) => RUTAS[pagina].toLowerCase() === ruta) ?? 'inicio'
}

function App() {
  const [pagina, setPagina] = useState<Pagina>(paginaDeLaUrl)

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

  if (pagina === 'credenciales') {
    return <Credenciales onCambiarPagina={cambiarPagina} />
  }

  if (pagina === 'registro') {
    return <Registro onCambiarPagina={cambiarPagina} />
  }

  if (pagina === 'iniciarSesion') {
    return <IniciarSesion onCambiarPagina={cambiarPagina} />
  }

  if (pagina === 'dashboard') {
    // TODO: cuando exista el backend, pasar el nombre de la empresa con nombreEmpresa={...}
    return <Dashboard onCambiarPagina={cambiarPagina} />
  }

  return <Inicio onCambiarPagina={cambiarPagina} />
}

export default App
