import { useState } from 'react'
import type { Pagina } from './Components/header.tsx'
import Credenciales from './Pages/credenciales.tsx'
import Inicio from './Pages/inicio.tsx'

function App() {
  const [pagina, setPagina] = useState<Pagina>('inicio')

  const cambiarPagina = (nueva: Pagina) => {
    // La página nueva arranca desde arriba, sin la animación del scroll suave
    window.scrollTo({ top: 0, behavior: 'instant' })
    setPagina(nueva)
  }

  return pagina === 'inicio'
    ? <Inicio onCambiarPagina={cambiarPagina} />
    : <Credenciales onCambiarPagina={cambiarPagina} />
}

export default App
