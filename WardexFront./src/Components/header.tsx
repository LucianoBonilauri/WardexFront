import { useEffect, useState } from 'react'
import logo from '../assets/Logo_final.png'
import './header.css'

export type Pagina = 'inicio' | 'credenciales' | 'registro' | 'iniciarSesion' | 'codigoAutenticacion' | 'dashboard' | 'perfil'

// Las pantallas para entrar a una cuenta: ahí no se muestra "Iniciar Sesión"
const PANTALLAS_DE_CUENTA: Pagina[] = ['registro', 'iniciarSesion', 'codigoAutenticacion']

const NAV_ITEMS = ['Inicio', 'Instalación', 'Dashboard', 'Perfil'] as const
type NavItem = (typeof NAV_ITEMS)[number]

// Qué página abre cada ítem del menú
const PAGINA_DE_ITEM: Record<NavItem, Pagina> = {
  Inicio: 'inicio',
  Instalación: 'credenciales',
  Dashboard: 'dashboard',
  Perfil: 'perfil',
}

// Qué ítem del menú aparece resaltado al entrar a cada página (registro e iniciar sesión no tienen ninguno)
const ITEM_DE_PAGINA: Partial<Record<Pagina, NavItem>> = {
  inicio: 'Inicio',
  credenciales: 'Instalación',
  dashboard: 'Dashboard',
  perfil: 'Perfil',
}

// 1vh de scroll antes de activar el fondo difuminado
function estaScrolleado(): boolean {
  return window.scrollY > window.innerHeight * 0.01
}

type HeaderProps = {
  paginaActual: Pagina
  onCambiarPagina: (pagina: Pagina) => void
}

function Header({ paginaActual, onCambiarPagina }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(estaScrolleado)
  const [activeItem, setActiveItem] = useState<NavItem | undefined>(ITEM_DE_PAGINA[paginaActual])

  useEffect(() => {
    const updateHeader = () => setIsScrolled(estaScrolleado())

    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [])

  const handleNavClick = (item: NavItem) => {
    setActiveItem(item)

    const destino = PAGINA_DE_ITEM[item]
    if (destino && destino !== paginaActual) {
      onCambiarPagina(destino)
    }
  }

  return (
    <header className={isScrolled ? 'site-header is-scrolled' : 'site-header'}>
      <button type="button" className="logo-placeholder">
        <img src={logo} alt="Logo de Wardex" className="logo" />
      </button>

      <nav className="main-nav" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => (
          <button
            key={item}
            type="button"
            className={item === activeItem ? 'nav-link is-active' : 'nav-link'}
            aria-current={item === activeItem ? 'page' : undefined}
            onClick={() => handleNavClick(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* En las pantallas de cuenta no se muestra: ya estás entrando. Sin él, el menú queda pegado a la derecha */}
      {!PANTALLAS_DE_CUENTA.includes(paginaActual) && (
        <button type="button" className="login-button" onClick={() => onCambiarPagina('iniciarSesion')}>
          Iniciar Sesión
        </button>
      )}
    </header>
  )
}

export default Header
