import { useState, useEffect } from 'react'
import Notification from './Notification'
import grupoService from '../services/grupos'
import grabacionesService from '../services/grabaciones'

const AgregarGrabacion = ({ user, grabacion, onGrabacionAgregada }) => {
  const [title, setTitle] = useState(grabacion?.title || '')
  const [description, setDescription] = useState(grabacion?.description || '')
  const [driveLink, setDriveLink] = useState(grabacion?.driveLink || '')
  const [grupoId, setGrupoId] = useState(grabacion?.grupoId?.toString() || '')
  const [tipo, setTipo] = useState(grabacion?.tipo || (user.rol === 'docente' ? 'grupal' : 'general'))
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState(null)
  const [grupoError, setGrupoError] = useState(null)

  // Lista de grupos disponibles del usuario
  const [grupos, setGrupos] = useState([])
  useEffect(() => {
    if (user.rol === 'docente' || user.rol === 'administrador') {
      grupoService.getAll().then(data => {
        setGrupos(data.filter(g => g.id && g.nombre));
      });
    }
  }, [user.rol])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setGrupoError(null)

    // Validar grupo obligatorio para docente o para admin si tipo es grupal
    if ((user.rol === 'docente' && !grupoId) || (user.rol === 'administrador' && tipo === 'grupal' && !grupoId)) {
      setGrupoError('Debes seleccionar un grupo para la grabación grupal.')
      return
    }

    try {
      const data = {
        title,
        description,
        driveLink,
        tipo: tipo
      }
      if (tipo === 'grupal') {
        data.grupoId = Number(grupoId)
      }
      if (grabacion) {
        await grabacionesService.editarGrabacion(grabacion.id, data)
      } else {
        await grabacionesService.crearGrabacion(data)
      }
      setTitle('')
      setDescription('')
      setDriveLink('')
      setGrupoId('')
      setTipo(user.rol === 'docente' ? 'grupal' : 'general')
      const msg = grabacion ? 'Grabación actualizada correctamente' : 'Grabación agregada correctamente'
      setMensaje(msg)
      if (onGrabacionAgregada) {
        onGrabacionAgregada(msg)
      }
    } catch (err) {
      console.error('Error:', err)
      setError(err.response?.data?.error || 'Error al procesar la grabación')
    }

  // El mensaje se gestiona solo por la notificación visual
  }

  return (
    <>
      <Notification
        show={!!mensaje}
        message={typeof mensaje === 'string' ? mensaje : mensaje?.texto}
        type={mensaje === 'Grabación agregada correctamente' || mensaje === 'Grabación actualizada correctamente' ? 'success' : 'danger'}
        onClose={() => setMensaje(null)}
        duration={9000}
      />
      <form onSubmit={handleSubmit} className="grabacion-form">
        <div className="mb-3">
          <label className="form-label" style={{color:"#fff"}}>Título</label>
          <input
            type="text"
            className="form-control"
            placeholder="Título de la grabación"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label" style={{color:"#fff"}}>Descripción</label>
          <textarea
            className="form-control"
            placeholder="Descripción de la grabación"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows="3"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label" style={{color:"#fff"}}>Enlace de Drive</label>
          <input
            type="url"
            className="form-control"
            placeholder="https://drive.google.com/..."
            value={driveLink}
            onChange={e => setDriveLink(e.target.value)}
            required
          />
          <div className="form-text">
            Asegúrate de que el enlace sea público o accesible para los estudiantes
          </div>
        </div>
        {(tipo === 'grupal' && grupos.length > 0) && (
          <div className="form-group mb-3">
            <label htmlFor="grupoId" className="form-label form-text" style={{color: "#e4dbdbff"}}>Grupo <span style={{color:'red'}}>*</span></label>
            <select
              id="grupoId"
              value={grupoId}
              onChange={e => setGrupoId(e.target.value)}
              className="form-control"
              required
              disabled={!!grabacion}
            >
              <option value="">Selecciona un grupo</option>
              {grupos.map(grupo => (
                <option key={grupo.id} value={Number(grupo.id)}>
                  {grupo.nombre}
                </option>
              ))}
            </select>
            {grupoError && <div className="text-danger mt-1">{grupoError}</div>}
          </div>
        )}
        {user.rol === 'administrador' && (
          <div className="mb-3">
            <label className="form-label" style={{color: "#e4dbdbff"}}>Tipo de grabación</label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="form-control"
              disabled={!!grabacion}
            >
              <option value="general">General</option>
              <option value="grupal">Grupal</option>
            </select>
          </div>
        )}
        <div className="d-flex justify-content-end gap-2">
          <button 
            type="button" 
            className="btn btn-secondary"
            style={{ marginBottom: "8px" }}
            onClick={() => {
              setTitle('')
              setDescription('')
              setDriveLink('')
              setGrupoId('')
              setTipo(user.rol === 'docente' ? 'grupal' : 'general')
            }}
          >
            Limpiar
          </button>
          <button type="submit" className="btn btn-primary">
            {grabacion ? 'Actualizar' : 'Agregar'} Grabación
          </button>
        </div>
      </form>
    </>
    )
  }

export default AgregarGrabacion
