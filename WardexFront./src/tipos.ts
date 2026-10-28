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
