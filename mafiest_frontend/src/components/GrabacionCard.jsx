import React from 'react'

const GrabacionCard = ({ grabacion, onDelete, onEdit, user }) => {
  const isMyRecording = grabacion.userId === user.id || grabacion.docenteId === user.id
  
  const isAdminRecording = grabacion.user?.rol === 'administrador'
  
  const canEdit = user.rol === 'administrador' || 
                 (user.rol === 'docente' && isMyRecording && !isAdminRecording)
  
  const canDelete = user.rol === 'administrador' || 
                   (user.rol === 'docente' && isMyRecording && !isAdminRecording)

  const [showRetroMsg, setShowRetroMsg] = React.useState(false);

  const handleEntregadaClick = () => {
    setShowRetroMsg(true);
    setTimeout(() => setShowRetroMsg(false), 3000);
  };

  return (
    <div className="grabacion-card">
      <div className="grabacion-header">
        <h3>Título: <span  style={{ color: '#d3cbcbff' }}>{grabacion.title}</span></h3>
      </div>
      <div className="grabacion-body">
        <div><strong style={{ color: '#fff' }}>Descripción:</strong> <span  style={{ color: '#d3cbcbff' }}>{grabacion.description}</span></div>
        <div className="grabacion-info mb-2">
          <div><strong style={{ color: '#fff' }}>Tipo:</strong> <span  style={{ color: '#d3cbcbff' }}>{grabacion.tipo === 'grupal' ? 'Grupal' : 'General'}</span></div>
          <div><strong  style={{ color: '#fff' }}>Creador:</strong> <span  style={{ color: '#d3cbcbff' }}>{grabacion.usuario?.nombre || grabacion.user?.nombre || grabacion.docente?.nombre || 'Desconocido'}</span></div>
          <div><strong  style={{ color: '#fff' }}>Grupo:</strong> <span  style={{ color: '#d3cbcbff' }}>{grabacion.grupo?.nombre || (grabacion.grupoId ? `Grupo ${grabacion.grupoId}` : 'Sin grupo')}</span></div>
        </div>
        <div className="grabacion-info">
          {grabacion.userId === user.id && (
            <span className="badge bg-primary">Mi grabación</span>
          )}
        </div>
      </div>

      <div className="grabacion-actions">
        <a 
          href={grabacion.driveLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ marginRight: "8px" }}
        >
          <i className="fas fa-play-circle me-2"></i>
          Ver Grabación
        </a>
        {canEdit && (
          <button 
            onClick={() => onEdit(grabacion)}
            className="btn btn-secondary"
            style={{ marginRight: "8px" }}
          >
            <i className="fas fa-edit me-2"></i>
            Editar
          </button>
        )}
        {canDelete && (
          <button 
            onClick={() => onDelete(grabacion)}
            className="btn btn-danger"
          >
            <i className="fas fa-trash me-2"></i>
            Eliminar
          </button>
        )}
      </div>
    </div>
  )
}

export default GrabacionCard