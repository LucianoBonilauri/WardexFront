import { useEffect, useRef, useState, type ReactNode, type SubmitEvent } from 'react'
import Header, { type Pagina } from '../../Components/header.tsx'
import PerfilSinSesion from '../../Components/PerfilSinSesion.tsx'
import type { Cuenta } from '../../tipos.ts'
import './Perfil.css'

type NombreCampo = 'nombreUsuario' | 'correo' | 'telefono' | 'contrasena'

// "Juan Pérez" → "JP"
function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase()
}

type CampoProps = {
  id: string
  etiqueta: string
  tipo: string
  valor: string
  placeholder: string
  autoComplete: string
  editable: boolean
  corto?: boolean
  claseInput?: string
  onCambiar: (valor: string) => void
  onEditar: () => void
  // Lo que va adentro del campo, a la derecha (el ojito de la contraseña)
  children?: ReactNode
}

// Etiqueta, campo y el lápiz que lo habilita para editar
function Campo({ id, etiqueta, tipo, valor, placeholder, autoComplete, editable, corto, claseInput, onCambiar, onEditar, children }: CampoProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Al tocar el lápiz, el cursor queda listo para escribir
  useEffect(() => {
    if (editable) inputRef.current?.focus()
  }, [editable])

  return (
    <div className="perfil-campo">
      <label className="perfil-etiqueta" htmlFor={id}>{etiqueta}</label>

      <div className={corto ? 'perfil-fila es-corta' : 'perfil-fila'}>
        <div className="perfil-caja">
          <input
            ref={inputRef}
            id={id}
            className={claseInput ? `perfil-input ${claseInput}` : 'perfil-input'}
            type={tipo}
            value={valor}
            placeholder={placeholder}
            autoComplete={autoComplete}
            readOnly={!editable}
            onChange={(event) => onCambiar(event.target.value)}
          />
          {children}
        </div>

        <button type="button" className="perfil-lapiz" aria-label={`Editar ${etiqueta.toLowerCase()}`} onClick={onEditar}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
            <path d="m15 5 4 4" />
          </svg>
        </button>
      </div>
    </div>
  )
}

type PerfilProps = {
  // null = nadie inició sesión, y se muestra la pantalla de "Tu perfil está esperándote"
  cuenta: Cuenta | null
  onCambiarPagina: (pagina: Pagina) => void
  // La contraseña con la que se entró en esta pestaña. null después de recargar: la API nunca la devuelve
  contrasenaActual: string | null
  onCerrarSesion: () => void
}

function Perfil({ cuenta, onCambiarPagina, contrasenaActual, onCerrarSesion }: PerfilProps) {
  const [nombreUsuario, setNombreUsuario] = useState(cuenta?.nombreUsuario ?? '')
  const [correo, setCorreo] = useState(cuenta?.correo ?? '')
  const [telefono, setTelefono] = useState(cuenta?.telefono ?? '')
  // Solo la contraseña nueva, si la escribe
  const [contrasena, setContrasena] = useState('')
  const [editando, setEditando] = useState<NombreCampo | null>(null)
  const [verContrasena, setVerContrasena] = useState(false)
  const [error, setError] = useState('')

  if (!cuenta) {
    return (
      <div className="perfil-page">
        <Header paginaActual="perfil" onCambiarPagina={onCambiarPagina} />
        <PerfilSinSesion onCambiarPagina={onCambiarPagina} />
      </div>
    )
  }

  const hayCambios =
    nombreUsuario !== cuenta.nombreUsuario || correo !== cuenta.correo || telefono !== cuenta.telefono || contrasena !== ''
  // El teléfono puede quedar vacío; el nombre de usuario y el correo no
  const puedeGuardar = hayCambios && nombreUsuario.trim() !== '' && correo.trim() !== ''
  const inicialesUsuario = iniciales(cuenta.nombreUsuario)

  // El campo muestra la contraseña nueva si se está escribiendo una; si no, la actual (si se conoce)
  const valorContrasena = editando === 'contrasena' || contrasena !== '' ? contrasena : (contrasenaActual ?? '')
  // Si no se conoce ninguna (por ejemplo, después de recargar), se muestran puntitos de ejemplo
  const contrasenaDeEjemplo = editando !== 'contrasena' && valorContrasena === ''
  const placeholderContrasena = editando === 'contrasena' ? 'Escribí la contraseña nueva' : '••••••••••••'

  const guardar = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!puedeGuardar) return

    // TODO: la API todavía no tiene una ruta para editar la cuenta. Cuando la tenga, mandar acá solo los campos que cambiaron
    setError('Por ahora no se pueden guardar cambios en la cuenta.')
  }

  return (
    <div className="perfil-page">
      <Header paginaActual="perfil" onCambiarPagina={onCambiarPagina} />

      <main>
        <form className="perfil" onSubmit={guardar}>
          <div className="perfil-encabezado">
            <p className="eyebrow">Tu cuenta</p>
            <h1>Perfil</h1>
            <p className="perfil-subtitulo">Los datos de tu cuenta en Wardex.</p>
          </div>

          <div className="perfil-avatar">
            {inicialesUsuario ? (
              <span className="perfil-iniciales">{inicialesUsuario}</span>
            ) : (
              <svg className="perfil-avatar-icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
            )}

            {/* TODO: falta definir cómo se sube la foto o el logo (necesita la API) */}
            <button type="button" className="perfil-camara" aria-label="Cambiar foto">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </button>
          </div>

          <div className="perfil-campos">
            <Campo
              id="perfil-nombre-usuario"
              etiqueta="Nombre de usuario"
              tipo="text"
              valor={nombreUsuario}
              placeholder="Agregá tu nombre de usuario"
              autoComplete="username"
              editable={editando === 'nombreUsuario'}
              corto
              onCambiar={setNombreUsuario}
              onEditar={() => setEditando('nombreUsuario')}
            />

            <Campo
              id="perfil-correo"
              etiqueta="Correo electrónico"
              tipo="email"
              valor={correo}
              placeholder="Agregá tu correo"
              autoComplete="email"
              editable={editando === 'correo'}
              onCambiar={setCorreo}
              onEditar={() => setEditando('correo')}
            />

            <Campo
              id="perfil-telefono"
              etiqueta="Número de teléfono"
              tipo="tel"
              valor={telefono}
              placeholder="Agregá tu número de teléfono"
              autoComplete="tel"
              editable={editando === 'telefono'}
              corto
              onCambiar={setTelefono}
              onEditar={() => setEditando('telefono')}
            />

            <Campo
              id="perfil-contrasena"
              etiqueta="Contraseña"
              tipo={verContrasena ? 'text' : 'password'}
              valor={valorContrasena}
              placeholder={placeholderContrasena}
              autoComplete="new-password"
              editable={editando === 'contrasena'}
              claseInput={contrasenaDeEjemplo ? 'con-ojo es-ejemplo' : 'con-ojo'}
              onCambiar={setContrasena}
              onEditar={() => setEditando('contrasena')}
            >
              {/* Muestra lo que haya en el campo: la contraseña actual o la nueva que se está escribiendo */}
              <button
                type="button"
                className="perfil-ojo"
                aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                disabled={valorContrasena === ''}
                onClick={() => setVerContrasena(!verContrasena)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  {verContrasena ? (
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
            </Campo>
          </div>

          <div className="perfil-acciones">
            {error && <p className="perfil-error" role="alert">{error}</p>}
            <button type="submit" className="perfil-guardar" disabled={!puedeGuardar}>
              Guardar cambios
            </button>

            <button type="button" className="perfil-cerrar" onClick={onCerrarSesion}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default Perfil
