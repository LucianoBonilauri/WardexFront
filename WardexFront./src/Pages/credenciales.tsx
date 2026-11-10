import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { mensajeDeError } from '../api/cliente.ts'
import { crearServidor, obtenerServidores, regenerarKey } from '../api/servidores.ts'
import Header, { type Pagina } from '../Components/header.tsx'
import type { Servidor } from '../tipos.ts'
import './credenciales.css'

type CredencialesProps = {
  onCambiarPagina: (pagina: Pagina) => void
}

function Credenciales({ onCambiarPagina }: CredencialesProps) {
  const guiaRef = useRef<HTMLDialogElement>(null)
  // El servidor del usuario (uno solo). undefined = todavía no llegó; null = no tiene ninguno
  const [servidor, setServidor] = useState<Servidor | null | undefined>(undefined)
  const [nombreServidor, setNombreServidor] = useState('')
  // La API key para el agente. Solo vive en esta pantalla: la API la muestra una sola vez y no se guarda en ningún lado
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [error, setError] = useState('')

  // Al entrar, se busca si el usuario ya tiene un servidor (para mostrar su fragmento en vez del formulario)
  const cargarServidor = async () => {
    try {
      const servidores = await obtenerServidores()
      setServidor(servidores[0] ?? null)
    } catch (err) {
      setError(mensajeDeError(err))
      setServidor(null)
    }
  }

  useEffect(() => {
    cargarServidor()
  }, [])

  const generar = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setGenerando(true)
    setError('')
    try {
      setApiKey(await crearServidor(nombreServidor.trim()))
      setCopiado(false)
      setNombreServidor('')
      await cargarServidor()
    } catch (err) {
      setError(mensajeDeError(err))
      // Si ya tenía un servidor (409), se recarga para mostrarlo
      await cargarServidor()
    } finally {
      setGenerando(false)
    }
  }

  const regenerar = async () => {
    if (!servidor) return
    setGenerando(true)
    setError('')
    try {
      setApiKey(await regenerarKey(servidor.id))
      setCopiado(false)
      await cargarServidor()
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
          {servidor ? (
            // Ya tiene un servidor: se muestra cuál es y se puede regenerar la key (no crear otro)
            <>
              <p className="servidor-actual">
                Tu servidor: <strong>{servidor.nombre}</strong>
                {servidor.fragmentoKey && <> · API key <strong>{servidor.fragmentoKey}</strong></>}
              </p>
              <button type="button" className="generar-button" onClick={regenerar} disabled={generando}>
                {generando ? 'Regenerando…' : 'Regenerar API key'}
              </button>
              <p className="credencial-aviso">La key completa solo se muestra al crearla o regenerarla. Regenerá si la perdiste: la anterior deja de servir.</p>
            </>
          ) : (
            // No tiene servidor: el backend pide un nombre para crearlo (y da la API key una sola vez)
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
              <button type="submit" className="generar-button" disabled={generando || servidor === undefined}>
                {generando ? 'Generando…' : 'Generar credencial'}
              </button>
            </form>
          )}

          {apiKey && (
            <>
              <div className="credencial-box">
                <p className="credencial-code es-key">{apiKey}</p>
                <button type="button" className="copiar-button" aria-label="Copiar API key" onClick={copiar}>
                  {copiado ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="credencial-aviso">Guardá esta API key ahora: no se vuelve a mostrar.</p>
            </>
          )}

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
