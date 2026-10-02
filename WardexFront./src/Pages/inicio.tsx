import type { ReactNode } from 'react'
import Header, { type Pagina } from '../Components/header.tsx'
import './inicio.css'

type Beneficio = {
  titulo: string
  texto: string
  icono: ReactNode
}

const BENEFICIOS: Beneficio[] = [
  {
    titulo: 'Seguridad',
    texto: 'Mantené tu página asegurada con Wardex',
    icono: (
      <svg className="is-filled" viewBox="0 0 24 24" focusable="false">
        <circle cx="9" cy="7" r="4" />
        <path d="M9 13c-3.87 0-7 2.46-7 5.5V20a1 1 0 0 0 1 1h9.5v-5.5c0-.83.3-1.6.8-2.18A10.6 10.6 0 0 0 9 13z" />
        <rect x="14" y="15.5" width="8" height="6" rx="1.2" />
        <path d="M15.75 15.5V14a2.25 2.25 0 0 1 4.5 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    titulo: 'Protección',
    texto: 'Wardex es un bot que realiza su trabajo sin ingresar a ningún tipo de dato dentro de la página',
    icono: (
      <svg viewBox="0 0 24 24" focusable="false">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14a9 3 0 0 0 18 0V5" />
        <path d="M3 12a9 3 0 0 0 18 0" />
      </svg>
    ),
  },
  {
    titulo: 'Rendimiento',
    texto: 'El bot monitorea 24/7 las posibles amenazas dentro de tu página',
    icono: (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="m12 14 4-4" />
        <path d="M3.34 19a10 10 0 1 1 17.32 0" />
      </svg>
    ),
  },
]

type InicioProps = {
  onCambiarPagina: (pagina: Pagina) => void
}

function Inicio({ onCambiarPagina }: InicioProps) {
  return (
    <>
      <Header paginaActual="inicio" onCambiarPagina={onCambiarPagina} />

      <main>
        <section className="hero" id="inicio" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              Tu servidor tiene<br />
              puntos debiles,<br />
              <span>Wardex los<br />encuentra primero</span>
            </h1>
          </div>
        </section>

        <section className="description-section" aria-label="Qué es Wardex">
          <div className="hero-action">
            <p>
              Wardex es un bot de ciberseguridad<br />
              encargado de detectar automáticamente<br />
              <strong>actividad sospechosa</strong> o inusual dentro de<br />
              tu página web
            </p>
            <a className="primary-button" href="#integraciones">
              Probar Ahora
              <svg className="button-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>
        </section>

        <section className="benefits" id="para-que-sirve" aria-labelledby="benefits-title">
          <p className="eyebrow">Beneficios</p>
          <h2 id="benefits-title">¿Para qué sirve Wardex?</h2>
          <p className="section-lead">
            Tres cosas que tu sitio necesita todos los días y que hoy nadie está mirando por vos.
          </p>

          <div className="benefit-grid">
            {BENEFICIOS.map((beneficio) => (
              <article key={beneficio.titulo} className="benefit-card">
                <div className="benefit-head">
                  <span className="benefit-icon" aria-hidden="true">
                    {beneficio.icono}
                  </span>
                  <h3>{beneficio.titulo}</h3>
                </div>
                <p>{beneficio.texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="empty-section" id="integraciones" aria-label="Integraciones"></section>
        <section className="empty-section" id="proyecto" aria-label="Proyecto"></section>
        <section className="empty-section" id="login" aria-label="Inicio de sesión"></section>
      </main>
    </>
  )
}

export default Inicio
