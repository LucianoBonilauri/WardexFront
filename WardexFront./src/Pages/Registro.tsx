import { useState, type SubmitEvent } from 'react'
import { mensajeDeError } from '../api/cliente.ts'
import { registrarse } from '../api/cuenta.ts'
import Header, { type Pagina } from '../Components/header.tsx'
import type { Cuenta } from '../tipos.ts'
import './cuenta.css'

type RegistroProps = {
  onCambiarPagina: (pagina: Pagina) => void
  onEntrar: (cuenta: Cuenta) => void
}

function Registro({ onCambiarPagina, onEntrar }: RegistroProps) {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [telefono, setTelefono] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  const crearCuenta = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setEnviando(true)
    setError('')

    try {
      onEntrar(await registrarse({ correo, contrasena, nombreUsuario, telefono }))
    } catch (err) {
      setError(mensajeDeError(err))
      setEnviando(false)
    }
  }

  return (
    <div className="cuenta-page">
      <Header paginaActual="registro" onCambiarPagina={onCambiarPagina} />

      <main className="cuenta">
        <section className="cuenta-card" aria-labelledby="registro-title">
          <h1 id="registro-title">Registrarse</h1>
          <p className="cuenta-lead">Para empezar a usar WardeX, Creá una cuenta y escaneá tu primer servidor.</p>

          <form className="cuenta-form" onSubmit={crearCuenta}>
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

            <div className="cuenta-password">
              <input
                className="cuenta-input"
                type={mostrarContrasena ? 'text' : 'password'}
                name="password"
                placeholder="Contraseña"
                aria-label="Contraseña"
                autoComplete="new-password"
                required
                minLength={12}
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

            <input
              className="cuenta-input"
              type="text"
              name="nombreUsuario"
              placeholder="Nombre de usuario"
              aria-label="Nombre de usuario"
              autoComplete="username"
              required
              value={nombreUsuario}
              onChange={(event) => setNombreUsuario(event.target.value)}
            />

            <input
              className="cuenta-input"
              type="tel"
              name="telefono"
              placeholder="Número de teléfono"
              aria-label="Número de teléfono"
              autoComplete="tel"
              required
              value={telefono}
              onChange={(event) => setTelefono(event.target.value)}
            />

            {error && <p className="cuenta-error" role="alert">{error}</p>}

            <button type="submit" className="cuenta-submit" disabled={enviando}>
              {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          <p className="cuenta-footer">
            ¿Ya tenés cuenta?{' '}
            <button type="button" className="cuenta-link" onClick={() => onCambiarPagina('iniciarSesion')}>
              Iniciá sesión
            </button>
          </p>
        </section>
      </main>
    </div>
  )
}

export default Registro
