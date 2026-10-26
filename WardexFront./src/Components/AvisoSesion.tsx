import type { Pagina } from './header.tsx'
import './AvisoSesion.css'

type AvisoSesionProps = {
  // 'oculto' = no se muestra (por ejemplo, cuando ya hay una sesión iniciada)
  estado: 'visible' | 'oculto'
  onCambiarPagina: (pagina: Pagina) => void
}

// Aviso de "Todavía no iniciaste sesión", con los botones para entrar o crear una cuenta
function AvisoSesion({ estado, onCambiarPagina }: AvisoSesionProps) {
  if (estado === 'oculto') return null

  return (
    <div className="aviso-sesion">
      <div className="aviso-sesion-texto">
        <p className="aviso-sesion-titulo">Todavía no iniciaste sesión</p>
        <p>Iniciá sesión o creá una cuenta para ver tu información.</p>
      </div>

      <div className="aviso-sesion-botones">
        <button type="button" className="aviso-sesion-iniciar" onClick={() => onCambiarPagina('iniciarSesion')}>
          Iniciar sesión
        </button>
        <button type="button" className="aviso-sesion-crear" onClick={() => onCambiarPagina('registro')}>
          Crear cuenta
        </button>
      </div>
    </div>
  )
}

export default AvisoSesion
