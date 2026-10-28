import type { Alerta } from '../../tipos.ts'
import './CantAlerts.css'

// Orden en el que aparecen en la barra y en la leyenda
const TIPOS = [
  { gravedad: 'critica', singular: 'crítica', plural: 'críticas' },
  { gravedad: 'alta', singular: 'alta', plural: 'altas' },
  { gravedad: 'media', singular: 'media', plural: 'medias' },
  { gravedad: 'baja', singular: 'baja', plural: 'bajas' },
] as const

type CantAlertsProps = {
  // Las alertas del último escaneo, que la card cuenta por gravedad. Sin escaneo no llegan y la card se muestra vacía
  alertas?: Alerta[]
}

function CantAlerts({ alertas }: CantAlertsProps) {
  const tipos = TIPOS.map((tipo) => ({
    ...tipo,
    cantidad: alertas?.filter((alerta) => alerta.gravedad === tipo.gravedad).length ?? 0,
  }))

  return (
    <article className="stat-card">
      <h2 className="stat-label">Cantidad de alertas</h2>

      <p className="stat-valor">
        {alertas ? alertas.length : <span className="stat-vacio" aria-hidden="true" />}
      </p>

      {/* Cada tramo es tan largo como su cantidad; los tipos en 0 no se dibujan */}
      <div className="alertas-barra" aria-hidden="true">
        {tipos.map(({ gravedad, cantidad }) => cantidad > 0 && (
          <span key={gravedad} className={`alertas-tramo gravedad-${gravedad}`} style={{ flexGrow: cantidad }} />
        ))}
      </div>

      {alertas ? (
        <ul className="stat-pie alertas-leyenda">
          {tipos.map(({ gravedad, cantidad, singular, plural }) => (
            <li key={gravedad} className={`gravedad-${gravedad}`}>
              {cantidad} {cantidad === 1 ? singular : plural}
            </li>
          ))}
        </ul>
      ) : (
        <p className="stat-pie">Sin datos todavía</p>
      )}
    </article>
  )
}

export default CantAlerts
