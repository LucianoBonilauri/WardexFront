import { useState } from 'react'
import CantAlerts, { type Alertas } from '../Components/Dashboard/CantAlerts.tsx'
import NiveldeSeguridad from '../Components/Dashboard/NiveldeSeguridad.tsx'
import UltimoEscaneo from '../Components/Dashboard/UltimoEscaneo.tsx'
import Header, { type Pagina } from '../Components/header.tsx'
import NombreEmpresa from '../Components/NombreEmpresa.tsx'
import './Dashboard.css'

// Lo que trae un escaneo de la base de datos. Cada card usa solo su parte
type DatosEscaneo = {
  nivelSeguridad: number
  alertas: Alertas
  fecha: Date
}

type DashboardProps = {
  onCambiarPagina: (pagina: Pagina) => void
  nombreEmpresa?: string
}

function Dashboard({ onCambiarPagina, nombreEmpresa }: DashboardProps) {
  // null = todavía no hay escaneo, y las cards se muestran vacías.
  // TODO: cuando exista el backend, sumar setEscaneo y guardar acá el último escaneo; las cards se llenan solas
  const [escaneo] = useState<DatosEscaneo | null>(null)

  return (
    <div className="dashboard-page">
      <Header paginaActual="dashboard" onCambiarPagina={onCambiarPagina} />

      <main className="dashboard">
        <NombreEmpresa nombre={nombreEmpresa} />

        <section className="stat-grid" aria-label="Estadísticas del último escaneo">
          <NiveldeSeguridad nivel={escaneo?.nivelSeguridad} />
          <CantAlerts alertas={escaneo?.alertas} />
          <UltimoEscaneo fecha={escaneo?.fecha} />
        </section>
      </main>
    </div>
  )
}

export default Dashboard
