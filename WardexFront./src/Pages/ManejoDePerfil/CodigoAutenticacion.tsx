import { Fragment, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent, type SubmitEvent } from 'react'
import { mensajeDeError } from '../../api/cliente.ts'
import { confirmarCambioDeMail, iniciarSesion, pedirCambioDeMail, reenviarCodigoRegistro, verificarCodigo } from '../../api/cuenta.ts'
import Header, { type Pagina } from '../../Components/header.tsx'
import type { Cuenta } from '../../tipos.ts'
import './cuenta.css'
import './CodigoAutenticacion.css'

// Lo que necesita esta pantalla. Vive solo en la memoria de la app mientras se está acá:
// nunca se guarda en el navegador (así lo pide el backend) y se borra al salir de la pantalla
export type Verificacion = {
  // Adonde se mandó el código (al cambiar el mail, el mail nuevo)
  correo: string
  // De dónde se vino: cambia qué confirma el código y cómo se reenvía
  origen: 'login' | 'registro' | 'mail'
  // Para reenviar el código desde el login o el cambio de mail: la API pide de nuevo la contraseña
  contrasena: string
  // Un aviso del backend para mostrar al llegar (por ejemplo, si el mail del registro no salió)
  aviso?: string
}

const CANTIDAD = 6
// Después de cada envío, "Reenviar código" espera un minuto (el backend no manda más de uno por minuto)
const ESPERA_REENVIO = 60

type CodigoAutenticacionProps = {
  verificacion: Verificacion
  onVerificado: (cuenta: Cuenta) => void
  onCambiarPagina: (pagina: Pagina) => void
}

function CodigoAutenticacion({ verificacion, onVerificado, onCambiarPagina }: CodigoAutenticacionProps) {
  const { correo, origen, contrasena } = verificacion
  const cambiandoMail = origen === 'mail'
  const [digitos, setDigitos] = useState<string[]>(() => Array(CANTIDAD).fill(''))
  const [verificando, setVerificando] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState(verificacion.aviso ?? '')
  // Segundos que faltan para poder reenviar. Recién se mandó un código, así que arranca esperando
  const [faltan, setFaltan] = useState(ESPERA_REENVIO)
  const casillas = useRef<(HTMLInputElement | null)[]>([])

  // El cursor arranca en la primera casilla
  useEffect(() => {
    casillas.current[0]?.focus()
  }, [])

  // Cuenta regresiva de "Reenviar código": baja de a un segundo hasta llegar a 0
  useEffect(() => {
    const id = setInterval(() => setFaltan((segundos) => Math.max(0, segundos - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  const codigo = digitos.join('')
  const completo = codigo.length === CANTIDAD

  const enfocar = (i: number) => casillas.current[Math.min(Math.max(i, 0), CANTIDAD - 1)]?.focus()

  // Escribe números desde la casilla i: sirve para tipear de a uno, pegar el código o el autocompletado del celular
  const escribir = (i: number, numeros: string) => {
    // Si llega el código entero, se escribe desde la primera casilla aunque se haya pegado en otra
    const desde = numeros.length >= CANTIDAD ? 0 : i
    const nuevos = [...digitos]
    numeros
      .slice(0, CANTIDAD - desde)
      .split('')
      .forEach((numero, k) => {
        nuevos[desde + k] = numero
      })
    setDigitos(nuevos)
    enfocar(desde + numeros.length)
  }

  const alCambiar = (i: number, valor: string) => {
    let numeros = valor.replace(/\D/g, '')
    // Si la casilla ya tenía un número y se escribió otro al lado, queda solo el nuevo
    if (numeros.length === 2 && digitos[i]) numeros = numeros.replace(digitos[i], '')
    if (numeros === '') setDigitos(digitos.with(i, ''))
    else escribir(i, numeros)
  }

  const alApretarTecla = (i: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && digitos[i] === '' && i > 0) {
      // Borrar en una casilla vacía vuelve a la anterior y la borra
      event.preventDefault()
      setDigitos(digitos.with(i - 1, ''))
      enfocar(i - 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      enfocar(i - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      enfocar(i + 1)
    }
  }

  const alPegar = (i: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const numeros = event.clipboardData.getData('text').replace(/\D/g, '')
    if (numeros) escribir(i, numeros)
  }

  const verificar = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!completo) return
    setVerificando(true)
    setError('')
    setAviso('')

    try {
      onVerificado(await (cambiandoMail ? confirmarCambioDeMail(codigo) : verificarCodigo(correo, codigo)))
    } catch (err) {
      setError(mensajeDeError(err))
      setVerificando(false)
    }
  }

  // Desde el login se reenvía entrando de nuevo con la contraseña; desde el cambio de mail, pidiendo el cambio
  // de nuevo; desde el registro, con su propia ruta
  const pedirOtroCodigo = () => {
    if (origen === 'login') return iniciarSesion(correo, contrasena)
    if (origen === 'mail') return pedirCambioDeMail(correo, contrasena)
    return reenviarCodigoRegistro(correo)
  }

  const reenviar = async () => {
    setReenviando(true)
    setError('')
    setAviso('')

    try {
      setAviso(await pedirOtroCodigo())
      setFaltan(ESPERA_REENVIO)
      setDigitos(Array(CANTIDAD).fill(''))
      enfocar(0)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setReenviando(false)
    }
  }

  let textoReenviar = 'Reenviar código'
  if (reenviando) textoReenviar = 'Reenviando…'
  else if (faltan > 0) textoReenviar = `Reenviar código en ${faltan} s`

  return (
    <div className="cuenta-page">
      <Header paginaActual="codigoAutenticacion" onCambiarPagina={onCambiarPagina} />

      <main className="cuenta">
        <section className="cuenta-card codigo-card" aria-labelledby="codigo-title">
          <h1 id="codigo-title">{cambiandoMail ? 'Confirmá tu mail nuevo' : 'Verificá tu cuenta'}</h1>
          <p className="cuenta-lead">
            Ingresá el código de 6 dígitos que te enviamos a <span className="codigo-correo">{correo}</span>. Vence en 15 minutos.
          </p>

          <form className="codigo-form" onSubmit={verificar}>
            <div className="codigo-casillas" role="group" aria-label="Código de 6 dígitos">
              {digitos.map((digito, i) => (
                <Fragment key={i}>
                  {i === CANTIDAD / 2 && <span className="codigo-guion" aria-hidden="true">–</span>}
                  <input
                    ref={(casilla) => {
                      casillas.current[i] = casilla
                    }}
                    className="codigo-casilla"
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    placeholder="0"
                    aria-label={`Dígito ${i + 1} de ${CANTIDAD}`}
                    value={digito}
                    onChange={(event) => alCambiar(i, event.target.value)}
                    onKeyDown={(event) => alApretarTecla(i, event)}
                    onPaste={(event) => alPegar(i, event)}
                    onFocus={(event) => event.target.select()}
                  />
                </Fragment>
              ))}
            </div>

            {error && <p className="cuenta-error" role="alert">{error}</p>}
            {aviso && <p className="codigo-aviso" role="status">{aviso}</p>}

            <button type="submit" className="cuenta-submit" disabled={!completo || verificando}>
              {verificando ? 'Verificando…' : 'Verificar'}
            </button>

            <p className="codigo-reenviar">
              ¿No te llegó?{' '}
              <button type="button" className="cuenta-link" disabled={faltan > 0 || reenviando} onClick={reenviar}>
                {textoReenviar}
              </button>
            </p>
          </form>

          <p className="cuenta-footer">
            {/* Si se estaba cambiando el mail, volver deja el mail como estaba */}
            <button type="button" className="cuenta-link" onClick={() => onCambiarPagina(cambiandoMail ? 'perfil' : 'iniciarSesion')}>
              {cambiandoMail ? 'Volver al perfil' : 'Volver a iniciar sesión'}
            </button>
          </p>
        </section>
      </main>
    </div>
  )
}

export default CodigoAutenticacion
