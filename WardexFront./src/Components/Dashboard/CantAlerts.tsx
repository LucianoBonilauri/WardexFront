import './CantAlerts.css'

export type Alertas = {
  criticas: number
  altas: number
  medias: number
}

// Orden en el que aparecen en la barra y en la leyenda
const TIPOS = [
  { clave: 'criticas', singular: 'crítica', plural: 'críticas' },
  { clave: 'altas', singular: 'alta', plural: 'altas' },
  { clave: 'medias', singular: 'media', plural: 'medias' },
] as const

type CantAlertsProps = {
  // Sin escaneo no llega y la card se muestra vacía
  alertas?: Alertas
}

function CantAlerts({ alertas }: CantAlertsProps) {
  return (
    <article className="stat-card">
      <h2 className="stat-label">Cantidad de alertas</h2>

      <p className="stat-valor">
        {alertas
          ? alertas.criticas + alertas.altas + alertas.medias
          : <span className="stat-vacio" aria-hidden="true" />}
      </p>

      {/* Cada tramo es tan largo como su cantidad; los tipos en 0 no se dibujan */}
      <div className="alertas-barra" aria-hidden="true">
        {alertas && TIPOS.map(({ clave }) => alertas[clave] > 0 && (
          <span key={clave} className={`alertas-tramo alerta-${clave}`} style={{ flexGrow: alertas[clave] }} />
        ))}
      </div>

      {alertas ? (
        <ul className="stat-pie alertas-leyenda">
          {TIPOS.map(({ clave, singular, plural }) => (
            <li key={clave} className={`alerta-${clave}`}>
              {alertas[clave]} {alertas[clave] === 1 ? singular : plural}
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
