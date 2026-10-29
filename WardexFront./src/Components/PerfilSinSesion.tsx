import type { Pagina } from './header.tsx'
import './PerfilSinSesion.css'

type PerfilSinSesionProps = {
  onCambiarPagina: (pagina: Pagina) => void
}

// Lo que muestra Perfil cuando nadie inició sesión
function PerfilSinSesion({ onCambiarPagina }: PerfilSinSesionProps) {
  return (
    <main className="sin-sesion">
      <div className="sin-sesion-texto">
        <p className="eyebrow">Tu cuenta</p>
        <h1>
          Tu perfil está <span>esperándote.</span>
        </h1>
        <p className="sin-sesion-bajada">
          Iniciá sesión o creá una cuenta para ver tu información, cambiar tus datos y administrar los servidores vinculados.
        </p>

        <div className="sin-sesion-botones">
          <button type="button" className="sin-sesion-crear" onClick={() => onCambiarPagina('registro')}>
            Crear cuenta
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          <button type="button" className="sin-sesion-iniciar" onClick={() => onCambiarPagina('iniciarSesion')}>
            Iniciar sesión
          </button>
        </div>
      </div>

      {/* Solo de adorno: un perfil "bloqueado", sin datos reales */}
      <div className="tarjeta-bloqueada" aria-hidden="true">
        <div className="tarjeta-cabecera">
          <span className="tarjeta-avatar">
            <svg viewBox="0 0 24 24" focusable="false">
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
          </span>
          <span className="tarjeta-lineas">
            <span className="tarjeta-linea es-larga" />
            <span className="tarjeta-linea es-corta" />
          </span>
        </div>

        <p className="tarjeta-etiqueta">Empresa</p>
        <span className="tarjeta-campo">
          <span className="tarjeta-linea es-empresa" />
        </span>

        <p className="tarjeta-etiqueta">Correo electrónico</p>
        <span className="tarjeta-campo">
          <span className="tarjeta-linea es-correo" />
        </span>

        <p className="tarjeta-etiqueta">Contraseña</p>
        <span className="tarjeta-campo es-ultimo tarjeta-puntos">••••••••••</span>

        <div className="tarjeta-candado">
          <span className="tarjeta-candado-icono">
            <svg viewBox="0 0 24 24" focusable="false">
              <rect width="16" height="11" x="4" y="11" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              <circle cx="12" cy="16.5" r="0.6" />
            </svg>
          </span>
          <span className="tarjeta-candado-texto">Sesión cerrada</span>
        </div>
      </div>
    </main>
  )
}

export default PerfilSinSesion
