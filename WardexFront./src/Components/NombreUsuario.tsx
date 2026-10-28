import './NombreEmpresa.css'

type NombreEmpresaProps = {
  // El nombre que la empresa puso al registrarse. Mientras no llegue de la base de datos, se muestra el texto de ejemplo
  nombre?: string
}

function NombreEmpresa({ nombre }: NombreEmpresaProps) {
  return (
    <div className="nombre-empresa">
      <h1>{nombre ?? 'Nombre de Empresa'}</h1>
    </div>
  )
}

export default NombreEmpresa
