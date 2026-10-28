import type { Alerta, Gravedad } from '../../tipos.ts'
import Alert from './Alert.tsx'
import './ListaAlertas.css'

// Primero las críticas, después las altas, las medias y al final las bajas.
// Dentro de cada gravedad quedan como las manda la API: de la más nueva a la más vieja
const ORDEN: Record<Gravedad, number> = { critica: 0, alta: 1, media: 2, baja: 3 }

type ListaAlertasProps = {
  // Las alertas del último escaneo. Sin escaneo no llegan y se muestra el aviso para instalar el agente
  alertas?: Alerta[]
  onInstalar: () => void
}

function ListaAlertas({ alertas, onInstalar }: ListaAlertasProps) {
  return (
    <section className="lista-alertas" aria-labelledby="lista-alertas-titulo">
      <div className="lista-alertas-encabezado">
        <h2 id="lista-alertas-titulo">Alertas y explicación</h2>
        <span className="lista-alertas-cantidad">{alertas?.length ?? 0}</span>
      </div>

      {alertas && alertas.length > 0 ? (
        <ol className="lista-alertas-items">
          {alertas
            .toSorted((a, b) => ORDEN[a.gravedad] - ORDEN[b.gravedad])
            .map((alerta, i) => <Alert key={alerta.id} numero={i + 1} alerta={alerta} />)}
        </ol>
      ) : (
        <div className="lista-alertas-vacia">
          <span className="lista-alertas-icono" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <circle cx="11.5" cy="11" r="2.5" />
              <path d="m13.3 12.8 1.7 1.7" />
            </svg>
          </span>

          {alertas ? (
            <>
              <h3>No se encontraron alertas</h3>
              <p>El último escaneo no encontró problemas en tu servidor.</p>
            </>
          ) : (
            <>
              <h3>Todavía no hay escaneos</h3>
              <p>
                Cuando instales el agente en tu servidor, las alertas que encuentre Wardex van a aparecer acá,
                ordenadas por gravedad.
              </p>
              <button type="button" className="instalar-button" onClick={onInstalar}>
                Instalar Wardex
                <svg className="instalar-flecha" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default ListaAlertas
