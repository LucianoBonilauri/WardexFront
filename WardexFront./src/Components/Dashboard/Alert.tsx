import { useId, useState } from 'react'
import type { Alerta, DetalleAlerta, Gravedad, Mitre } from '../../tipos.ts'
import { armarPromptResolver } from './promptResolver.ts'
import './Alert.css'

const ETIQUETA: Record<Gravedad, string> = {
  critica: 'Crítico',
  alta: 'Alto',
  media: 'Medio',
  baja: 'Bajo',
}

// Cómo se muestra cada tipo de alerta: su nombre y los rótulos de la tarjeta
type TipoDeAlerta = {
  nombre: string
  // El rótulo de detalle.pedidos
  pedidos: string
  // El título de la lista de detalle.urlsEjemplo
  probadas: string
  // Qué porcentaje se muestra y con qué rótulo. null: ninguno
  porcentaje: { campo: 'pct404' | 'pct4xx'; rotulo: string } | null
  // Algo que traían adelante los valores viejos de la lista, y que no se muestra
  prefijoViejo?: string
}

// Los rótulos del escaneo de rutas. Los usan también los tipos que no están en TIPOS
const ROTULOS_DE_ESCANEO: Omit<TipoDeAlerta, 'nombre'> = {
  pedidos: 'Pedidos',
  probadas: 'Rutas probadas',
  porcentaje: { campo: 'pct404', rotulo: '% de 404' },
}

// La inyección SQL y la inclusión de archivos reciben 400, no 404: se muestra el % de todos los 4xx
const PORCENTAJE_4XX = { campo: 'pct4xx', rotulo: '% de errores 4xx' } as const

const TIPOS: Record<string, TipoDeAlerta> = {
  escaneo_rutas: { nombre: 'Escaneo de rutas', ...ROTULOS_DE_ESCANEO },
  sql_i: { nombre: 'Inyección SQL', ...ROTULOS_DE_ESCANEO, porcentaje: PORCENTAJE_4XX },
  path_transversal: { nombre: 'Inclusión de archivos', ...ROTULOS_DE_ESCANEO, porcentaje: PORCENTAJE_4XX },
  // En SSH no hay rutas ni respuestas HTTP: los porcentajes siempre dan 0 y no se muestran
  fuerza_bruta: {
    nombre: 'Fuerza bruta contra SSH',
    pedidos: 'Contraseñas fallidas',
    probadas: 'Usuarios probados',
    porcentaje: null,
    // Las alertas viejas traían "usuario: admin" en vez de "admin"
    prefijoViejo: 'usuario: ',
  },
}

// Un tipo que no está en TIPOS se muestra tal cual llega, con los rótulos del escaneo
function tipoDeAlerta(tipo: string): TipoDeAlerta {
  return Object.hasOwn(TIPOS, tipo) ? TIPOS[tipo] : { nombre: tipo, ...ROTULOS_DE_ESCANEO }
}

// "usuario: admin" → "admin", si el tipo tiene un prefijo viejo para sacar
function sinPrefijo(valor: string, prefijo?: string): string {
  return prefijo && valor.startsWith(prefijo) ? valor.slice(prefijo.length) : valor
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

// "T1595.003" → https://attack.mitre.org/techniques/T1595/003/. Si la técnica no tiene el formato de MITRE
// (una T con 4 números, y a veces un punto con 3 más), no se arma el link
function linkMitre(tecnica: string): string | null {
  return /^T\d{4}(\.\d{3})?$/.test(tecnica) ? `https://attack.mitre.org/techniques/${tecnica.replace('.', '/')}/` : null
}

// La técnica de MITRE ATT&CK: "T1595.003 · Reconocimiento" como link a su página, y el nombre chico abajo
function EtiquetaMitre({ mitre }: { mitre: Mitre }) {
  const link = linkMitre(mitre.tecnica)
  const texto = [mitre.tecnica, mitre.nombreTactica].filter(Boolean).join(' · ')

  return (
    <div className="alerta-mitre">
      {link ? (
        <a className="alerta-mitre-etiqueta" href={link} target="_blank" rel="noopener noreferrer" aria-label={`${texto} (se abre en otra pestaña)`}>
          {texto}
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M7 7h10v10" />
            <path d="M7 17 17 7" />
          </svg>
        </a>
      ) : (
        <span className="alerta-mitre-etiqueta">{texto}</span>
      )}
      {mitre.nombre && <span className="alerta-mitre-nombre">{mitre.nombre}</span>}
    </div>
  )
}

type PanelDetalleProps = {
  detalle: DetalleAlerta
  tipo: TipoDeAlerta
  // La clave del tipo tal como la manda el agente (escaneo_rutas, sql_i, ...), para armar el prompt de resolución
  clave: string
  // Cuándo se abrió el panel, para decir "hoy" o "ayer"
  ahora: number
}

// Lo que se despliega con "Ver más". Las rutas, las herramientas y las líneas del log las escribe el atacante:
// van siempre entre llaves, como texto. Nunca dangerouslySetInnerHTML, ni links, ni en un href o un src
function PanelDetalle({ detalle, tipo, clave, ahora }: PanelDetalleProps) {
  const lineas = detalle.lineasEjemplo.map(leerLinea)
  // Rutas que existen en el sitio: respondieron 2xx y no son la página principal
  const encontradas = lineas.filter((linea) => linea.exito && linea.ruta !== '/')
  const [ipPrincipal, ...otrasIps] = detalle.ips
  // El porcentaje que corresponde al tipo. null si el tipo no muestra ninguno o la alerta no lo trae
  const porcentaje = tipo.porcentaje ? detalle[tipo.porcentaje.campo] : null
  const hayDatos = ipPrincipal !== undefined || detalle.pedidos !== null || porcentaje !== null

  const cuandoTexto = cuando(detalle.desde, detalle.hasta, ahora)
  // Un prompt listo para pegar en una IA, con los datos de esta alerta, para que guíe a resolver el ataque
  const promptResolver = armarPromptResolver({
    clave,
    detalle,
    cuando: cuandoTexto,
    rutasEncontradas: encontradas.map((linea) => linea.ruta).filter((ruta): ruta is string => ruta !== undefined),
  })
  const [copiado, setCopiado] = useState(false)

  const copiarPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptResolver)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

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

      {detalle.mitre && <EtiquetaMitre mitre={detalle.mitre} />}

      <p className="alerta-cuando">
        <time dateTime={detalle.desde.toISOString()}>{cuandoTexto}</time>
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
              <dt>{tipo.pedidos}</dt>
              <dd>{numero(detalle.pedidos)}</dd>
            </div>
          )}
          {tipo.porcentaje && porcentaje !== null && (
            <div className="alerta-dato">
              <dt>{tipo.porcentaje.rotulo}</dt>
              <dd>{numero(porcentaje)}%</dd>
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
          <h4 className="alerta-subtitulo">{tipo.probadas}</h4>
          <ul className="alerta-chips">
            {detalle.urlsEjemplo.map((url, i) => (
              <li key={i} className="alerta-chip">
                {sinPrefijo(url, tipo.prefijoViejo)}
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

      {/* Prompt para resolver: texto armado con los datos de la alerta, listo para pegar en una IA */}
      <section className="alerta-resolver">
        <h4 className="alerta-subtitulo">Resolver con IA</h4>
        <p className="alerta-resolver-aviso">
          Copiá este prompt y pegalo en Claude (o la IA que uses) para que te guíe a resolverlo paso a paso.
        </p>
        <pre className="alerta-resolver-prompt" tabIndex={0}>{promptResolver}</pre>
        <button type="button" className="alerta-resolver-copiar" onClick={copiarPrompt}>
          {copiado ? 'Copiado' : 'Copiar prompt'}
        </button>
      </section>
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
  const tipo = tipoDeAlerta(alerta.tipo)

  return (
    // La clase de gravedad en la fila deja destacar las críticas (ver Alert.css)
    <li className={`alerta gravedad-${alerta.gravedad}`}>
      <span className="alerta-numero" aria-hidden="true">{numero}</span>

      <div className="alerta-info">
        <h3 className="alerta-titulo">{tipo.nombre}</h3>
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
        {abiertoEn !== null && <PanelDetalle detalle={alerta.detalle} tipo={tipo} clave={alerta.tipo} ahora={abiertoEn} />}
      </div>
    </li>
  )
}

export default Alert
