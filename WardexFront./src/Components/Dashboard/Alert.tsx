import './Alert.css'

export type Gravedad = 'critica' | 'alta' | 'media'

// Una alerta tal como llega de la base de datos
export type Alerta = {
  id: number
  titulo: string
  gravedad: Gravedad
}

const ETIQUETA: Record<Gravedad, string> = {
  critica: 'Crítico',
  alta: 'Alto',
  media: 'Medio',
}

type AlertProps = {
  numero: number
  alerta: Alerta
}

function Alert({ numero, alerta }: AlertProps) {
  return (
    <li className="alerta">
      <span className="alerta-numero" aria-hidden="true">{numero}</span>

      <div className="alerta-info">
        <h3 className="alerta-titulo">{alerta.titulo}</h3>
        <span className={`alerta-gravedad gravedad-${alerta.gravedad}`}>{ETIQUETA[alerta.gravedad]}</span>
      </div>

      {/* TODO: falta definir qué muestra Ver más */}
      <button type="button" className="alerta-ver-mas">
        Ver más
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </li>
  )
}

export default Alert
