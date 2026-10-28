import { useRef, useState, type SubmitEvent } from 'react'
import { mensajeDeError } from '../api/cliente.ts'
import { crearServidor } from '../api/servidores.ts'
import Header, { type Pagina } from '../Components/header.tsx'
import './credenciales.css'

type CredencialesProps = {
  onCambiarPagina: (pagina: Pagina) => void
}

function Credenciales({ onCambiarPagina }: CredencialesProps) {
  const guiaRef = useRef<HTMLDialogElement>(null)
  const [nombreServidor, setNombreServidor] = useState('')
  // La API key para el agente. Solo vive en esta pantalla: la API la muestra una sola vez y no se guarda en ningún lado
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [error, setError] = useState('')

  const generar = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setGenerando(true)
    setError('')
    try {
      setApiKey(await crearServidor(nombreServidor.trim()))
      setCopiado(false)
      setNombreServidor('')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setGenerando(false)
    }
  }

  const copiar = async () => {
    if (!apiKey) return
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopiado(true)
    } catch {
      setError('No se pudo copiar. Seleccioná la API key y copiala a mano.')
    }
  }

  return (
    <div className="credenciales-page">
      <Header paginaActual="credenciales" onCambiarPagina={onCambiarPagina} />

      <main className="credenciales" aria-labelledby="credenciales-title">
        <p className="eyebrow">Instalación</p>
        <h1 id="credenciales-title">Instalación</h1>

        <div className="credencial-panel">
          {/* Cada API key es de un servidor: el backend pide un nombre para crearlo */}
          <form className="servidor-form" onSubmit={generar}>
            <input
              className="servidor-input"
              type="text"
              name="nombreServidor"
              placeholder="Nombre del servidor"
              aria-label="Nombre del servidor"
              required
              maxLength={100}
              value={nombreServidor}
              onChange={(event) => setNombreServidor(event.target.value)}
            />
            <button type="submit" className="generar-button" disabled={generando}>
              {generando ? 'Generando…' : 'Generar credencial'}
            </button>
          </form>

          <div className="credencial-box">
            <p className={apiKey ? 'credencial-code es-key' : 'credencial-code'}>{apiKey ?? '000-000'}</p>
            <button type="button" className="copiar-button" aria-label="Copiar API key" disabled={!apiKey} onClick={copiar}>
              {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          {apiKey && <p className="credencial-aviso">Guardá esta API key ahora: no se vuelve a mostrar.</p>}
          {error && <p className="credencial-error" role="alert">{error}</p>}
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
