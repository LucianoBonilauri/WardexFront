import { useEffect, useState } from 'react'
import { obtenerAlertas } from '../api/notificaciones.ts'
import { obtenerServidores } from '../api/servidores.ts'
import CantAlerts from '../Components/Dashboard/CantAlerts.tsx'
import ListaAlertas from '../Components/Dashboard/ListaAlertas.tsx'
import UltimoEscaneo from '../Components/Dashboard/UltimoEscaneo.tsx'
import Header, { type Pagina } from '../Components/header.tsx'
import NombreUsuario from '../Components/Dashboard/NombreUsuario.tsx'
import type { Alerta, Servidor } from '../tipos.ts'
import './Dashboard.css'

type DashboardProps = {
  onCambiarPagina: (pagina: Pagina) => void
  nombreUsuario?: string
  conSesion: boolean
}

function Dashboard({ onCambiarPagina, nombreUsuario, conSesion }: DashboardProps) {
  // null = todavía no llegaron (o no hay sesión), y las cards se muestran vacías
  const [alertas, setAlertas] = useState<Alerta[] | null>(null)
  const [servidores, setServidores] = useState<Servidor[] | null>(null)

  // Con sesión, al entrar se piden las alertas y los servidores (las dos cosas a la vez)
  useEffect(() => {
    if (!conSesion) return
    let sigueAbierta = true

    // TODO: falta definir cómo se muestra un error de conexión en el Dashboard
    obtenerAlertas()
      .then((datos) => {
        if (sigueAbierta) setAlertas(datos)
      })
      .catch((error) => console.error('No se pudieron traer las alertas:', error))

    obtenerServidores()
      .then((datos) => {
        if (sigueAbierta) setServidores(datos)
      })
      .catch((error) => console.error('No se pudieron traer los servidores:', error))

    // Si se cambia de pantalla antes de que lleguen las respuestas, no se guardan
    return () => {
      sigueAbierta = false
    }
  }, [conSesion])

  // Sin alertas y sin ningún servidor, la lista invita a instalar el agente en vez de decir "no se encontraron alertas"
  const sinAgente = alertas?.length === 0 && servidores?.length === 0

  return (
    <div className="dashboard-page">
      <Header paginaActual="dashboard" onCambiarPagina={onCambiarPagina} />

      <main className="dashboard">
        <NombreUsuario nombre={nombreUsuario} />

        {/* La grilla sigue siendo de tres columnas: la tercera queda libre, como en el diseño.
            Nivel de seguridad se sacó porque la API no manda ese dato (su componente sigue en Components/Dashboard) */}
        <section className="stat-grid" aria-label="Estadísticas de tus servidores">
          <CantAlerts alertas={alertas ?? undefined} />
          <UltimoEscaneo servidores={servidores ?? undefined} />
        </section>

        <ListaAlertas alertas={sinAgente ? undefined : alertas ?? undefined} onInstalar={() => onCambiarPagina('credenciales')} />
      </main>
    </div>
  )
}

export default Dashboard
