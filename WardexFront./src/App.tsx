import { useState } from 'react'
import type { Pagina } from './Components/header.tsx'
import Credenciales from './Pages/credenciales.tsx'
import Dashboard from './Pages/Dashboard.tsx'
import IniciarSesion from './Pages/IniciarSesion.tsx'
import Inicio from './Pages/inicio.tsx'
import Registro from './Pages/Registro.tsx'

function App() {
  const [pagina, setPagina] = useState<Pagina>('inicio')

  const cambiarPagina = (nueva: Pagina) => {
    // La página nueva arranca desde arriba, sin la animación del scroll suave
    window.scrollTo({ top: 0, behavior: 'instant' })
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
