import { useEffect, useRef, useState, type ReactNode, type SubmitEvent } from 'react'
import Header, { type Pagina } from '../Components/header.tsx'
import './Perfil.css'

// La cuenta que inició sesión, como llega de la base de datos. La contraseña no viene: la base nunca la devuelve
export type Cuenta = {
  empresa: string
  correo: string
}

type NombreCampo = 'empresa' | 'correo' | 'contrasena'

// "Distribuidora Norte S.A." → "DN"
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
  deshabilitado: boolean
  corto?: boolean
  claseInput?: string
  onCambiar: (valor: string) => void
  onEditar: () => void
  // Lo que va adentro del campo, a la derecha (el ojito de la contraseña)
  children?: ReactNode
}

// Etiqueta, campo y el lápiz que lo habilita para editar
function Campo({ id, etiqueta, tipo, valor, placeholder, autoComplete, editable, deshabilitado, corto, claseInput, onCambiar, onEditar, children }: CampoProps) {
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
            disabled={deshabilitado}
            onChange={(event) => onCambiar(event.target.value)}
          />
          {children}
        </div>

        <button type="button" className="perfil-lapiz" aria-label={`Editar ${etiqueta.toLowerCase()}`} disabled={deshabilitado} onClick={onEditar}>
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
  // null = nadie inició sesión, y la pantalla se muestra vacía
  cuenta: Cuenta | null
  onGuardar: (cuenta: Cuenta) => void
  onCambiarPagina: (pagina: Pagina) => void
}

function Perfil({ cuenta, onGuardar, onCambiarPagina }: PerfilProps) {
  const [empresa, setEmpresa] = useState(cuenta?.empresa ?? '')
  const [correo, setCorreo] = useState(cuenta?.correo ?? '')
  // Solo la contraseña nueva, si la escribe
  const [contrasena, setContrasena] = useState('')
  const [editando, setEditando] = useState<NombreCampo | null>(null)
  const [verContrasena, setVerContrasena] = useState(false)

  const sinCuenta = cuenta === null
  const hayCambios = !sinCuenta && (empresa !== cuenta.empresa || correo !== cuenta.correo || contrasena !== '')
  const puedeGuardar = hayCambios && empresa.trim() !== '' && correo.trim() !== ''
  const inicialesEmpresa = cuenta ? iniciales(cuenta.empresa) : ''

  // Con cuenta y sin escribir una nueva, se muestran puntitos de ejemplo (no es la contraseña real)
  const contrasenaDeEjemplo = !sinCuenta && editando !== 'contrasena' && contrasena === ''
  let placeholderContrasena = 'Creá una contraseña'
  if (!sinCuenta) placeholderContrasena = editando === 'contrasena' ? 'Escribí la contraseña nueva' : '••••••••••••'

  const guardar = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!cuenta || !puedeGuardar) return

    // TODO: cuando exista el backend, mandar los cambios a la API (con la contraseña nueva, si la escribió) y guardar lo que devuelva
    onGuardar({ ...cuenta, empresa, correo })
    setContrasena('')
    setVerContrasena(false)
    setEditando(null)
  }

  return (
    <div className="perfil-page">
      <Header paginaActual="perfil" onCambiarPagina={onCambiarPagina} />

      <main>
        <form className="perfil" onSubmit={guardar}>
          <div className="perfil-encabezado">
            <p className="eyebrow">Tu cuenta</p>
            <h1>Perfil</h1>
            <p className="perfil-subtitulo">
              {sinCuenta ? 'Acá vas a ver los datos de tu cuenta.' : 'Los datos de tu cuenta en Wardex.'}
            </p>

            {sinCuenta && (
              <div className="perfil-aviso">
                <span className="perfil-aviso-icono" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <rect width="16" height="11" x="4" y="11" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                </span>

                <div className="perfil-aviso-texto">
                  <p className="perfil-aviso-titulo">Todavía no iniciaste sesión</p>
                  <p>Iniciá sesión o creá una cuenta para ver tu información.</p>
                </div>

                <div className="perfil-aviso-botones">
                  <button type="button" className="perfil-aviso-iniciar" onClick={() => onCambiarPagina('iniciarSesion')}>
                    Iniciar sesión
                  </button>
                  <button type="button" className="perfil-aviso-crear" onClick={() => onCambiarPagina('registro')}>
                    Crear cuenta
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={cuenta ? 'perfil-avatar' : 'perfil-avatar es-vacio'}>
            {inicialesEmpresa ? (
              <span className="perfil-iniciales">{inicialesEmpresa}</span>
            ) : (
              <svg className="perfil-avatar-icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
            )}

            {cuenta && (
              // TODO: falta definir cómo se sube la foto o el logo (necesita la API)
              <button type="button" className="perfil-camara" aria-label="Cambiar foto">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </button>
            )}
          </div>

          <div className="perfil-campos">
            <Campo
              id="perfil-empresa"
              etiqueta="Empresa"
              tipo="text"
              valor={empresa}
              placeholder="Agregá el nombre de tu empresa"
              autoComplete="organization"
              editable={editando === 'empresa'}
              deshabilitado={sinCuenta}
              corto
              onCambiar={setEmpresa}
              onEditar={() => setEditando('empresa')}
            />

            <Campo
              id="perfil-correo"
              etiqueta="Correo electrónico"
              tipo="email"
              valor={correo}
              placeholder="Agregá tu correo"
              autoComplete="email"
              editable={editando === 'correo'}
              deshabilitado={sinCuenta}
              onCambiar={setCorreo}
              onEditar={() => setEditando('correo')}
            />

            <Campo
              id="perfil-contrasena"
              etiqueta="Contraseña"
              tipo={verContrasena ? 'text' : 'password'}
              valor={contrasena}
              placeholder={placeholderContrasena}
              autoComplete="new-password"
              editable={editando === 'contrasena'}
              deshabilitado={sinCuenta}
              claseInput={contrasenaDeEjemplo ? 'con-ojo es-ejemplo' : 'con-ojo'}
              onCambiar={setContrasena}
              onEditar={() => setEditando('contrasena')}
            >
              {/* Solo se puede mirar la contraseña nueva que se está escribiendo */}
              <button
                type="button"
                className="perfil-ojo"
                aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                disabled={contrasena === ''}
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

          <button type="submit" className="perfil-guardar" disabled={!puedeGuardar}>
            Guardar cambios
          </button>
        </form>
      </main>
    </div>
  )
}

export default Perfil
