import Header, { type Pagina } from '../Components/header.tsx'
import NombreEmpresa from '../Components/NombreEmpresa.tsx'
import './Dashboard.css'

type DashboardProps = {
  onCambiarPagina: (pagina: Pagina) => void
  nombreEmpresa?: string
}

function Dashboard({ onCambiarPagina, nombreEmpresa }: DashboardProps) {
  return (
    <div className="dashboard-page">
      <Header paginaActual="dashboard" onCambiarPagina={onCambiarPagina} />

      <main className="dashboard">
        <NombreEmpresa nombre={nombreEmpresa} />
      </main>
    </div>
  )
}

export default Dashboard
