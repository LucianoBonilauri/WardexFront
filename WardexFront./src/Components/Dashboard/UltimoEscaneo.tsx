import { useEffect, useState } from 'react'
import './UltimoEscaneo.css'

const MINUTO = 60_000

// Tiempo desde el escaneo en la unidad más cómoda de leer: 12 min, 3 h, 2 días
function tiempoDesde(fecha: Date, ahora: number): [number, string] {
  const minutos = Math.max(0, Math.floor((ahora - fecha.getTime()) / MINUTO))
  if (minutos < 60) return [minutos, 'min']

  const horas = Math.floor(minutos / 60)
  if (horas < 24) return [horas, 'h']

  const dias = Math.floor(horas / 24)
  return [dias, dias === 1 ? 'día' : 'días']
}

// "hoy, 14:32", "ayer, 09:05" o "12/10, 18:40"
function cuando(fecha: Date, ahora: number): string {
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const ayer = new Date(ahora)
  ayer.setDate(ayer.getDate() - 1)

  if (fecha.toDateString() === new Date(ahora).toDateString()) return `hoy, ${hora}`
  if (fecha.toDateString() === ayer.toDateString()) return `ayer, ${hora}`
  return `${fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}, ${hora}`
}

type UltimoEscaneoProps = {
  // Cuándo terminó el último escaneo. Sin escaneo no llega y la card se muestra vacía
  fecha?: Date
}

function UltimoEscaneo({ fecha }: UltimoEscaneoProps) {
  const [ahora, setAhora] = useState(() => Date.now())

  // Con la página abierta, el "hace 12 min" se va actualizando solo
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), MINUTO)
    return () => clearInterval(id)
  }, [])

  if (!fecha) {
    return (
      <article className="stat-card">
        <h2 className="stat-label">Último escaneo</h2>
        <p className="stat-valor">
          <span className="stat-vacio" aria-hidden="true" />
        </p>
        <p className="stat-pie agente">Agente sin instalar</p>
      </article>
    )
  }

  const [cantidad, unidad] = tiempoDesde(fecha, ahora)

  return (
    <article className="stat-card">
      <h2 className="stat-label">Último escaneo</h2>
      <p className="stat-valor">
        {cantidad}
        <span className="stat-unidad">{unidad}</span>
      </p>
      <p className="stat-pie agente is-activo">
        <span>
          Agente activo · <time dateTime={fecha.toISOString()}>{cuando(fecha, ahora)}</time>
        </span>
      </p>
    </article>
  )
}

export default UltimoEscaneo
