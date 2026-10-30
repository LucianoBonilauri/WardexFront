import { useEffect, useRef, useState, type ReactNode, type SubmitEvent } from 'react'
import { mensajeDeError } from '../../api/cliente.ts'
import { cambiarContrasena, editarCuenta, pedirCambioDeMail } from '../../api/cuenta.ts'
import Header, { type Pagina } from '../../Components/header.tsx'
import PerfilSinSesion from '../../Components/PerfilSinSesion.tsx'
import type { Cuenta } from '../../tipos.ts'
import type { Verificacion } from './CodigoAutenticacion.tsx'
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
  // La contraseña con la que se inició sesión (queda guardada en el navegador). null si no se conoce: la API nunca la devuelve
  contrasenaActual: string | null
  // Después de guardar, para que toda la app use los datos nuevos
  onCuentaActualizada: (cuenta: Cuenta) => void
  onContrasenaCambiada: (contrasena: string) => void
  // Para cambiar el mail, el backend manda un código al mail nuevo: se sigue en la pantalla del código
  onPedirCodigo: (verificacion: Verificacion) => void
  onCerrarSesion: () => void
}

function Perfil({ cuenta, onCambiarPagina, contrasenaActual, onCuentaActualizada, onContrasenaCambiada, onPedirCodigo, onCerrarSesion }: PerfilProps) {
  // Lo que se escribió en cada campo. Los que no se tocaron muestran el dato de la cuenta (y se actualizan si llega uno nuevo)
  const [cambios, setCambios] = useState<Partial<Cuenta>>({})
  // Solo la contraseña nueva, si la escribe
  const [contrasena, setContrasena] = useState('')
  // La contraseña actual: el backend la pide para cambiar el mail o la contraseña
  const [confirmacion, setConfirmacion] = useState('')
  const [editando, setEditando] = useState<NombreCampo | null>(null)
  const [verContrasena, setVerContrasena] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  // Lo que se guardó bien
  const [aviso, setAviso] = useState('')

  if (!cuenta) {
    return (
      <div className="perfil-page">
        <Header paginaActual="perfil" onCambiarPagina={onCambiarPagina} />
        <PerfilSinSesion onCambiarPagina={onCambiarPagina} />
      </div>
    )
  }

  const datos = { ...cuenta, ...cambios }
  const cambiaNombre = datos.nombreUsuario !== cuenta.nombreUsuario
  const cambiaCorreo = datos.correo !== cuenta.correo
  const cambiaTelefono = datos.telefono !== cuenta.telefono
  const cambiaContrasena = contrasena !== ''
  const hayCambios = cambiaNombre || cambiaCorreo || cambiaTelefono || cambiaContrasena
  // Para cambiar el mail o la contraseña, el backend pide la actual: aparece un campo para escribirla
  const pideConfirmacion = cambiaCorreo || cambiaContrasena
  // Ningún dato puede quedar vacío: el teléfono es adonde llegan los SMS de las alertas
  const datosCompletos = datos.nombreUsuario.trim() !== '' && datos.correo.trim() !== '' && datos.telefono.trim() !== ''
  const puedeGuardar = hayCambios && datosCompletos && (!pideConfirmacion || confirmacion !== '') && !guardando
  const inicialesUsuario = iniciales(cuenta.nombreUsuario)

  // El campo muestra la contraseña nueva si se está escribiendo una; si no, la actual (si se conoce)
  const valorContrasena = editando === 'contrasena' || contrasena !== '' ? contrasena : (contrasenaActual ?? '')
  // Si no se conoce ninguna, se muestran puntitos de ejemplo
  const contrasenaDeEjemplo = editando !== 'contrasena' && valorContrasena === ''
  const placeholderContrasena = editando === 'contrasena' ? 'Escribí la contraseña nueva' : '••••••••••••'

  // Se guarda en orden: nombre y teléfono, la contraseña y por último el mail, que sigue en la pantalla del código.
  // Si algo falla, lo anterior ya quedó guardado y se muestra el error
  const guardar = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!puedeGuardar) return
    setGuardando(true)
    setError('')
    setAviso('')

    // La contraseña actual que pide el backend. Si se cambia la contraseña, desde ahí la actual es la nueva
    let actual = confirmacion

    try {
      if (cambiaNombre || cambiaTelefono) {
        // Solo los que cambiaron
        const guardada = await editarCuenta({
          nombreUsuario: cambiaNombre ? datos.nombreUsuario : undefined,
          telefono: cambiaTelefono ? datos.telefono : undefined,
        })
        onCuentaActualizada(guardada)
        // Ahora los campos muestran lo guardado (el teléfono puede volver sin espacios); el mail, si cambió, sigue pendiente
        setCambios(cambiaCorreo ? { correo: datos.correo } : {})
      }

      if (cambiaContrasena) {
        await cambiarContrasena(actual, contrasena)
        actual = contrasena
        onContrasenaCambiada(contrasena)
        setContrasena('')
        // Si después falla el cambio de mail, al reintentar ya va la nueva
        setConfirmacion(contrasena)
      }

      // El mail cambia recién cuando se ingresa el código que el backend manda al mail nuevo
      if (cambiaCorreo) {
        await pedirCambioDeMail(datos.correo, actual)
        onPedirCodigo({ correo: datos.correo, contrasena: actual, origen: 'mail' })
        return
      }

      setCambios({})
      setConfirmacion('')
      setEditando(null)
      setAviso(cambiaContrasena ? 'Guardamos los cambios. Se cerraron las sesiones abiertas en otros dispositivos.' : 'Guardamos los cambios.')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setGuardando(false)
    }
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
              valor={datos.nombreUsuario}
              placeholder="Agregá tu nombre de usuario"
              autoComplete="username"
              editable={editando === 'nombreUsuario'}
              corto
              onCambiar={(valor) => setCambios({ ...cambios, nombreUsuario: valor })}
              onEditar={() => setEditando('nombreUsuario')}
            />

            <Campo
              id="perfil-correo"
              etiqueta="Correo electrónico"
              tipo="email"
              valor={datos.correo}
              placeholder="Agregá tu correo"
              autoComplete="email"
              editable={editando === 'correo'}
              onCambiar={(valor) => setCambios({ ...cambios, correo: valor })}
              onEditar={() => setEditando('correo')}
            />

            <Campo
              id="perfil-telefono"
              etiqueta="Número de teléfono"
              tipo="tel"
              valor={datos.telefono}
              placeholder="Agregá tu número de teléfono"
              autoComplete="tel"
              editable={editando === 'telefono'}
              corto
              onCambiar={(valor) => setCambios({ ...cambios, telefono: valor })}
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
              {/* Muestra lo que haya en el campo: la contraseña actual o la nueva que se está escribiendo. Apagado si no hay nada */}
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

            {/* Solo si se cambia el mail o la contraseña: el backend pide la actual, para que nadie más pueda cambiarlos */}
            {pideConfirmacion && (
              <div className="perfil-campo">
                <label className="perfil-etiqueta" htmlFor="perfil-confirmacion">Contraseña actual</label>
                <div className="perfil-fila es-corta">
                  <div className="perfil-caja">
                    <input
                      id="perfil-confirmacion"
                      className="perfil-input"
                      type="password"
                      value={confirmacion}
                      placeholder="Escribí tu contraseña actual"
                      autoComplete="current-password"
                      onChange={(event) => setConfirmacion(event.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="perfil-acciones">
            {error && <p className="perfil-error" role="alert">{error}</p>}
            {/* Si se vuelve a cambiar algo, el aviso de lo que se guardó antes ya no corresponde */}
            {aviso && !hayCambios && <p className="perfil-aviso" role="status">{aviso}</p>}
            <button type="submit" className="perfil-guardar" disabled={!puedeGuardar}>
              {guardando ? 'Guardando…' : 'Guardar cambios'}
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
