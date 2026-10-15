import './NiveldeSeguridad.css'

const RECOMENDADO = 90

type NiveldeSeguridadProps = {
  // Porcentaje de 0 a 100. Sin escaneo no llega y la card se muestra vacía
  nivel?: number
}

function NiveldeSeguridad({ nivel }: NiveldeSeguridadProps) {
  const hayDatos = nivel !== undefined

  return (
    <article className="stat-card">
      <h2 className="stat-label">Nivel de seguridad</h2>

      <p className="stat-valor">
        {hayDatos ? Math.round(nivel) : <span className="stat-vacio" aria-hidden="true" />}
        <span className="stat-unidad">%</span>
      </p>

      <div className="seguridad-barra" aria-hidden="true">
        {hayDatos && (
          <div className="seguridad-relleno" style={{ width: `${Math.min(Math.max(nivel, 0), 100)}%` }} />
        )}
      </div>

      <p className="stat-pie">{hayDatos ? `Recomendado: ${RECOMENDADO}% o más` : 'Sin datos todavía'}</p>
    </article>
  )
}

export default NiveldeSeguridad
