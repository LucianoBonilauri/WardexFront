import { useId, useState } from 'react'
import type { Alerta, DetalleAlerta, Gravedad } from '../../tipos.ts'
import './Alert.css'

const ETIQUETA: Record<Gravedad, string> = {
  critica: 'Crítico',
  alta: 'Alto',
  media: 'Medio',
  baja: 'Bajo',
}

// Separa la ruta y el código de respuesta de una línea del log del servidor (formato Apache):
// 127.0.0.1 - - [30/Oct/2026:11:47:29 +0000] "GET /config HTTP/1.1" 200 312 "-" "gobuster/3.8.2"
function leerLinea(texto: string) {
  const m = texto.match(/"(\S+) (\S+) [^"]*" (\d{3}) /)
  // exito: el servidor respondió 2xx, o sea que la ruta existe
  return { texto, ruta: m?.[2], estado: m?.[3], exito: m?.[3].startsWith('2') ?? false }
}

// "Hoy", "Ayer" o "12/10", como en Último escaneo
function dia(fecha: Date, ahora: number): string {
  const ayer = new Date(ahora)
  ayer.setDate(ayer.getDate() - 1)

  if (fecha.toDateString() === new Date(ahora).toDateString()) return 'Hoy'
  if (fecha.toDateString() === ayer.toDateString()) return 'Ayer'
  return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

// La hora local: 08:47
function hora(fecha: Date): string {
  return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
}

// "Hoy de 08:47 a 08:48", "Hoy a las 08:47" (si no se sabe cuándo terminó) o "Ayer 23:50 a hoy 00:10"
function cuando(desde: Date, hasta: Date | null, ahora: number): string {
  const mismoDia = hasta?.toDateString() === desde.toDateString()
  if (!hasta || (mismoDia && hora(hasta) === hora(desde))) return `${dia(desde, ahora)} a las ${hora(desde)}`
  if (mismoDia) return `${dia(desde, ahora)} de ${hora(desde)} a ${hora(hasta)}`
  return `${dia(desde, ahora)} ${hora(desde)} a ${dia(hasta, ahora).toLowerCase()} ${hora(hasta)}`
}

// 4614 → "4.614", 99.14 → "99,1"
function numero(valor: number): string {
  return valor.toLocaleString('es-AR', { maximumFractionDigits: 1 })
}

type PanelDetalleProps = {
  detalle: DetalleAlerta
  // Cuándo se abrió el panel, para decir "hoy" o "ayer"
  ahora: number
}

// Lo que se despliega con "Ver más". Las rutas, las herramientas y las líneas del log las escribe el atacante:
// van siempre entre llaves, como texto. Nunca dangerouslySetInnerHTML, ni links, ni en un href o un src
function PanelDetalle({ detalle, ahora }: PanelDetalleProps) {
  const lineas = detalle.lineasEjemplo.map(leerLinea)
  // Rutas que existen en el sitio: respondieron 2xx y no son la página principal
  const encontradas = lineas.filter((linea) => linea.exito && linea.ruta !== '/')
  const [ipPrincipal, ...otrasIps] = detalle.ips
  const hayDatos = ipPrincipal !== undefined || detalle.pedidos !== null || detalle.pct404 !== null

  return (
    <>
      {encontradas.length > 0 && (
        <section className="alerta-encontradas gravedad-critica">
          <h4 className="alerta-subtitulo">Rutas encontradas</h4>
          <p className="alerta-encontradas-aviso">
            El atacante encontró rutas que existen en tu sitio. Revisá si exponen información sensible.
          </p>
          <ul className="alerta-encontradas-lista">
            {encontradas.map((linea, i) => (
              <li key={i} className="alerta-encontrada">
                <span className="alerta-encontrada-ruta">{linea.ruta}</span>
                <span className="alerta-encontrada-estado">{linea.estado}</span>
                <code className="alerta-encontrada-linea">{linea.texto}</code>
              </li>
            ))}
          </ul>
        </section>
      )}

      {detalle.descripcion && <p className="alerta-descripcion">{detalle.descripcion}</p>}

      <p className="alerta-cuando">
        <time dateTime={detalle.desde.toISOString()}>{cuando(detalle.desde, detalle.hasta, ahora)}</time>
        {detalle.host && (
          <>
            <span className="alerta-separador" aria-hidden="true">·</span>
            <span className="alerta-host">{detalle.host}</span>
          </>
        )}
      </p>

      {hayDatos && (
        <dl className="alerta-datos">
          {ipPrincipal !== undefined && (
            <div className="alerta-dato">
              <dt>IP principal</dt>
              <dd>
                {ipPrincipal}
                {otrasIps.length > 0 && <span className="alerta-dato-extra">También: {otrasIps.join(', ')}</span>}
              </dd>
            </div>
          )}
          {detalle.pedidos !== null && (
            <div className="alerta-dato">
              <dt>Pedidos</dt>
              <dd>{numero(detalle.pedidos)}</dd>
            </div>
          )}
          {detalle.pct404 !== null && (
            <div className="alerta-dato">
              <dt>% de 404</dt>
              <dd>{numero(detalle.pct404)}%</dd>
            </div>
          )}
        </dl>
      )}

      {detalle.userAgents.length > 0 && (
        <div>
          <h4 className="alerta-subtitulo">Herramienta</h4>
          <ul className="alerta-herramientas">
            {detalle.userAgents.map((agente, i) => (
              <li key={i}>{agente}</li>
            ))}
          </ul>
        </div>
      )}

      {detalle.urlsEjemplo.length > 0 && (
        <div>
          <h4 className="alerta-subtitulo">Rutas probadas</h4>
          <ul className="alerta-chips">
            {detalle.urlsEjemplo.map((url, i) => (
              <li key={i} className="alerta-chip">
                {url}
              </li>
            ))}
          </ul>
        </div>
      )}

      {lineas.length > 0 && (
        <div>
          <h4 className="alerta-subtitulo">Evidencia del log</h4>
          {/* Las líneas son largas: el bloque scrollea de costado por dentro. Con tabIndex también se scrollea con el teclado */}
          <pre className="alerta-log" tabIndex={0}>
            {lineas.map((linea, i) => (
              <code key={i} className={linea.exito ? 'alerta-log-linea gravedad-critica' : 'alerta-log-linea'}>
                {linea.texto}
              </code>
            ))}
          </pre>
        </div>
      )}
    </>
  )
}

type AlertProps = {
  numero: number
  alerta: Alerta
}

function Alert({ numero, alerta }: AlertProps) {
  // Cuándo se abrió el detalle (para decir "hoy" o "ayer"). null = cerrado
  const [abiertoEn, setAbiertoEn] = useState<number | null>(null)
  const idDetalle = useId()

  return (
    <li className="alerta">
      <span className="alerta-numero" aria-hidden="true">{numero}</span>

      <div className="alerta-info">
        <h3 className="alerta-titulo">{alerta.titulo}</h3>
        <span className={`alerta-gravedad gravedad-${alerta.gravedad}`}>{ETIQUETA[alerta.gravedad]}</span>
      </div>

      <button
        type="button"
        className="alerta-ver-mas"
        aria-expanded={abiertoEn !== null}
        aria-controls={idDetalle}
        onClick={() => setAbiertoEn(abiertoEn === null ? Date.now() : null)}
      >
        {abiertoEn === null ? 'Ver más' : 'Ver menos'}
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Cerrado queda vacío y oculto: así aria-controls siempre apunta a algo */}
      <div id={idDetalle} className="alerta-detalle" hidden={abiertoEn === null}>
        {abiertoEn !== null && <PanelDetalle detalle={alerta.detalle} ahora={abiertoEn} />}
      </div>
    </li>
  )
}

export default Alert
