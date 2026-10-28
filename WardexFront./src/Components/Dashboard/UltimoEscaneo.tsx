import { useEffect, useState } from 'react'
import type { Servidor } from '../../tipos.ts'
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
  // Los servidores del usuario. Sin sesión no llegan y la card se muestra vacía
  servidores?: Servidor[]
}

// Muestra hace cuánto se comunicó por última vez un agente, y si alguno está conectado ahora
function UltimoEscaneo({ servidores }: UltimoEscaneoProps) {
  const [ahora, setAhora] = useState(() => Date.now())

  // Con la página abierta, el "hace 12 min" se va actualizando solo
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), MINUTO)
    return () => clearInterval(id)
  }, [])

  const tiempos = (servidores ?? []).flatMap((servidor) => (servidor.ultimoUso ? [servidor.ultimoUso.getTime()] : []))
  const fecha = tiempos.length > 0 ? new Date(Math.max(...tiempos)) : null
  const conectado = (servidores ?? []).some((servidor) => servidor.activo && servidor.conectado)

  if (!fecha) {
    return (
      <article className="stat-card">
        <h2 className="stat-label">Último escaneo</h2>
        <p className="stat-valor">
          <span className="stat-vacio" aria-hidden="true" />
        </p>
        <p className="stat-pie agente">{servidores?.length ? 'Agente sin conectar todavía' : 'Agente sin instalar'}</p>
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
      <p className={conectado ? 'stat-pie agente is-activo' : 'stat-pie agente'}>
        <span>
          {conectado ? 'Agente activo' : 'Agente desconectado'} · <time dateTime={fecha.toISOString()}>{cuando(fecha, ahora)}</time>
        </span>
      </p>
    </article>
  )
}

export default UltimoEscaneo
