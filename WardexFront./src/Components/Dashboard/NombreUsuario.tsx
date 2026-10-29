import './NombreUsuario.css'

type NombreUsuarioProps = {
  // El nombre de usuario que puso al registrarse. Mientras no llegue de la base de datos, se muestra el texto de ejemplo
  nombre?: string
}

function NombreUsuario({ nombre }: NombreUsuarioProps) {
  return (
    <div className="nombre-usuario">
      <h1>{nombre ?? 'Nombre de Usuario'}</h1>
    </div>
  )
}

export default NombreUsuario
