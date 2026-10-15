import { useState } from 'react'
import Header, { type Pagina } from '../Components/header.tsx'
import './cuenta.css'

type IniciarSesionProps = {
  onCambiarPagina: (pagina: Pagina) => void
}

function IniciarSesion({ onCambiarPagina }: IniciarSesionProps) {
  const [mostrarContrasena, setMostrarContrasena] = useState(false)

  return (
    <div className="cuenta-page">
      <Header paginaActual="iniciarSesion" onCambiarPagina={onCambiarPagina} />

      <main className="cuenta">
        <section className="cuenta-card" aria-labelledby="iniciar-sesion-title">
          <h1 id="iniciar-sesion-title">Iniciar sesión</h1>
          <p className="cuenta-lead">Entrá para ver los escaneos de tus servidores.</p>

          {/* TODO: cuando exista el backend, acá se validan el correo y la contraseña */}
          <form className="cuenta-form" onSubmit={(event) => event.preventDefault()}>
            <input
              className="cuenta-input"
              type="email"
              name="email"
              placeholder="Correo electrónico"
              aria-label="Correo electrónico"
              autoComplete="email"
            />

            <div className="cuenta-password">
              <input
                className="cuenta-input"
                type={mostrarContrasena ? 'text' : 'password'}
                name="password"
                placeholder="Contraseña"
                aria-label="Contraseña"
                autoComplete="current-password"
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

            <button type="submit" className="cuenta-submit">Iniciar sesión</button>
          </form>

          <p className="cuenta-footer">
            ¿Todavía no tenés cuenta?{' '}
            <button type="button" className="cuenta-link" onClick={() => onCambiarPagina('registro')}>
              Registrate
            </button>
          </p>
        </section>
      </main>
    </div>
  )
}

export default IniciarSesion
