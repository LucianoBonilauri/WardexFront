import { useState, type SubmitEvent } from 'react'
import { mensajeDeError } from '../../api/cliente.ts'
import { pedirRecuperacion, restablecerContrasena, validarCodigoRecuperacion } from '../../api/cuenta.ts'
import Header, { type Pagina } from '../../Components/header.tsx'
import './cuenta.css'

type OlvideContrasenaProps = {
  onCambiarPagina: (pagina: Pagina) => void
}

// Recuperar la contraseña en tres pasos: pedir el código al mail, ingresarlo, y poner la nueva.
// El backend ya tiene las rutas (/auth/olvide-password, /validar-codigo-recuperacion, /restablecer-password).
// No toca el login: al terminar se vuelve a Iniciar sesión.
function OlvideContrasena({ onCambiarPagina }: OlvideContrasenaProps) {
  const [paso, setPaso] = useState<'mail' | 'codigo' | 'contrasena' | 'listo'>('mail')
  const [correo, setCorreo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const pedir = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setEnviando(true)
    setError('')
    try {
      const mensaje = await pedirRecuperacion(correo)
      setAviso(mensaje)
      setPaso('codigo')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  const validar = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setEnviando(true)
    setError('')
    try {
      await validarCodigoRecuperacion(correo, codigo)
      setAviso('')
      setPaso('contrasena')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  const restablecer = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setEnviando(true)
    setError('')
    try {
      await restablecerContrasena(correo, codigo, contrasena)
      setPaso('listo')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="cuenta-page">
      <Header paginaActual="olvideContrasena" onCambiarPagina={onCambiarPagina} />

      <main className="cuenta">
        <section className="cuenta-card" aria-labelledby="olvide-title">
          <h1 id="olvide-title">Recuperar contraseña</h1>

          {paso === 'mail' && (
            <>
              <p className="cuenta-lead">Poné tu correo y te mandamos un código para elegir una contraseña nueva.</p>
              <form className="cuenta-form" onSubmit={pedir}>
                <input
                  className="cuenta-input"
                  type="email"
                  name="email"
                  placeholder="Correo electrónico"
                  aria-label="Correo electrónico"
                  autoComplete="email"
                  required
                  value={correo}
                  onChange={(event) => setCorreo(event.target.value)}
                />
                {error && <p className="cuenta-error" role="alert">{error}</p>}
                <button type="submit" className="cuenta-submit" disabled={enviando}>
                  {enviando ? 'Enviando…' : 'Enviar código'}
                </button>
              </form>
            </>
          )}

          {paso === 'codigo' && (
            <>
              <p className="cuenta-lead">{aviso || 'Ingresá el código de 6 números que te llegó al mail.'}</p>
              <form className="cuenta-form" onSubmit={validar}>
                <input
                  className="cuenta-input"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="Código de 6 números"
                  aria-label="Código de verificación"
                  autoComplete="one-time-code"
                  required
                  value={codigo}
                  onChange={(event) => setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                {error && <p className="cuenta-error" role="alert">{error}</p>}
                <button type="submit" className="cuenta-submit" disabled={enviando || codigo.length !== 6}>
                  {enviando ? 'Verificando…' : 'Verificar código'}
                </button>
              </form>
            </>
          )}

          {paso === 'contrasena' && (
            <>
              <p className="cuenta-lead">Elegí una contraseña nueva (al menos 12 caracteres).</p>
              <form className="cuenta-form" onSubmit={restablecer}>
                <div className="cuenta-password">
                  <input
                    className="cuenta-input"
                    type={mostrarContrasena ? 'text' : 'password'}
                    name="new-password"
                    placeholder="Contraseña nueva"
                    aria-label="Contraseña nueva"
                    autoComplete="new-password"
                    minLength={12}
                    required
                    value={contrasena}
                    onChange={(event) => setContrasena(event.target.value)}
                  />
                  <button
                    type="button"
                    className="ver-contrasena"
                    aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      {mostrarContrasena ? (
                        <>
                          <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                          <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                          <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                          <path d="m2 2 20 20" />
                        </>
                      ) : (
                        <>
                          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {error && <p className="cuenta-error" role="alert">{error}</p>}
                <button type="submit" className="cuenta-submit" disabled={enviando}>
                  {enviando ? 'Guardando…' : 'Cambiar contraseña'}
                </button>
              </form>
            </>
          )}

          {paso === 'listo' && (
            <>
              <p className="cuenta-lead">Listo. Tu contraseña cambió. Ya podés iniciar sesión con la nueva.</p>
              <button type="button" className="cuenta-submit" onClick={() => onCambiarPagina('iniciarSesion')}>
                Iniciar sesión
              </button>
            </>
          )}

          {paso !== 'listo' && (
            <p className="cuenta-footer">
              <button type="button" className="cuenta-link" onClick={() => onCambiarPagina('iniciarSesion')}>
                Volver a iniciar sesión
              </button>
            </p>
          )}
        </section>
      </main>
    </div>
  )
}

export default OlvideContrasena
