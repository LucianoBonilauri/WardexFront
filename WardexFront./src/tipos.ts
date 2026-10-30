// Los datos tal como los usan las pantallas. Los archivos de src/api/ convierten lo que manda la API a estos tipos

// La cuenta que inició sesión. La contraseña no viene: la API nunca la devuelve
export type Cuenta = {
  nombreUsuario: string
  correo: string
  // Texto y no número: puede tener "+", espacios o un 0 adelante
  telefono: string
}

export type Gravedad = 'critica' | 'alta' | 'media' | 'baja'

// Una alerta de ataque que mandó el agente
export type Alerta = {
  id: string
  titulo: string
  gravedad: Gravedad
  // Lo que se ve al tocar "Ver más"
  detalle: DetalleAlerta
}

// Todo lo que el agente sabe del ataque. Las alertas viejas pueden traer null en algunos datos: ahí no se muestran.
// Las rutas, las herramientas y las líneas del log las escribe el atacante: se muestran siempre como texto,
// nunca como HTML ni como links
export type DetalleAlerta = {
  // Una frase para el usuario que arma el agente
  descripcion: string | null
  desde: Date
  hasta: Date | null
  detectadoEn: Date
  // El sitio atacado
  host: string
  // La primera es la principal
  ips: string[]
  // Cuántos pedidos hizo el atacante
  pedidos: number | null
  // Porcentajes de respuestas con error, de 0 a 100
  pct404: number | null
  pct4xx: number | null
  pct5xx: number | null
  // Las herramientas que usó el atacante, como "gobuster/3.8.2"
  userAgents: string[]
  // Las rutas que probó: las que existían van primero
  urlsEjemplo: string[]
  // Líneas tal cual del log del servidor (formato Apache)
  lineasEjemplo: string[]
  score: number
  fuenteDeteccion: string
}

// Un servidor del usuario, con el agente de WardeX instalado
export type Servidor = {
  id: number
  nombre: string
  activo: boolean
  // El agente dio señales de vida en los últimos 3 minutos
  conectado: boolean
  // La última vez que el agente se comunicó. null si nunca lo hizo
  ultimoUso: Date | null
}
