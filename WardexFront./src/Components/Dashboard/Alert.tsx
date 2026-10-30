import type { Alerta, Gravedad } from '../../tipos.ts'
import './Alert.css'

const ETIQUETA: Record<Gravedad, string> = {
  critica: 'Crítico',
  alta: 'Alto',
  media: 'Medio',
  baja: 'Bajo',
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
    </li>
  )
}

export default Alert
