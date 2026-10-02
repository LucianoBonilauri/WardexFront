import { useRef } from 'react'
import Header, { type Pagina } from '../Components/header.tsx'
import './credenciales.css'

type CredencialesProps = {
  onCambiarPagina: (pagina: Pagina) => void
}

function Credenciales({ onCambiarPagina }: CredencialesProps) {
  const guiaRef = useRef<HTMLDialogElement>(null)

  return (
    <div className="credenciales-page">
      <Header paginaActual="credenciales" onCambiarPagina={onCambiarPagina} />

      <main className="credenciales" aria-labelledby="credenciales-title">
        <p className="eyebrow">Instalación</p>
        <h1 id="credenciales-title">Instalación</h1>

        <div className="credencial-panel">
          <button type="button" className="generar-button">Generar credencial</button>

          <div className="credencial-box">
            <p className="credencial-code">000-000</p>
            <button type="button" className="copiar-button" aria-label="Copiar credencial">
              Copiar
            </button>
          </div>
        </div>

        <button type="button" className="guia-button" onClick={() => guiaRef.current?.showModal()}>
          Guía de instalación
        </button>

        {/* showModal() lo muestra centrado encima de todo y difumina el fondo (ver ::backdrop) */}
        <dialog ref={guiaRef} className="guia-dialog" aria-labelledby="guia-title">
          <h2 id="guia-title">Instalación</h2>

          <div className="guia-footer">
            <button type="button" className="entendido-button" onClick={() => guiaRef.current?.close()}>
              Entendido
            </button>
          </div>
        </dialog>
      </main>
    </div>
  )
}

export default Credenciales
