import React from 'react'
import { useNavigate } from 'react-router-dom'

const VerActividad = ({ actividad, onVolver, user }) => {
  const navigate = useNavigate();
  if (!actividad) return null;

  return (
    <div className="card mx-auto" style={{maxWidth: '700px'}}>
      <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white">
        <h4 className="mb-0">Detalles de la Actividad</h4>
        <button className="btn btn-light" onClick={onVolver}>
          <i className="fas fa-arrow-left me-2"></i>
          Volver
        </button>
      </div>
      <div className="card-body">
        <h5 className="card-title fw-bold mb-2">{actividad.titulo}</h5>
        <p className="card-text mb-3">{actividad.descripcion}</p>
        <div className="row mb-3">
          <div className="col-md-6">
            <strong>Fecha límite:</strong>
            <span className="ms-2">{new Date(actividad.fechaLimite).toLocaleDateString()}</span>
          </div>
          <div className="col-md-6">
            <strong>Tipo de actividad:</strong>
            <span className="ms-2">{actividad.tipo === 'archivo' ? 'Entrega de archivo' : 'Formulario'}</span>
          </div>
        </div>

        {actividad.tipo === 'archivo' && actividad.archivoUrl && (
          <div className="mb-4 text-center">
            <a 
              href={actividad.archivoUrl} 
              className="btn btn-outline-primary px-4 py-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fas fa-download me-2"></i>
              Descargar Material
            </a>
          </div>
        )}

        {/* Solo mostrar el botón azul centrado para responder archivo */}
        {user?.rol === 'estudiante' && actividad.creador?.id !== user.id && actividad.tipo === 'archivo' && (
          <div className="d-flex justify-content-center my-4">
            <button
              className="btn btn-primary btn-lg px-4 py-2"
              style={{fontWeight:'bold', fontSize:'1.1rem'}}
              onClick={() => navigate('/responder-actividad', { state: { actividad, user } })}
            >
              <i className="fas fa-pencil-alt me-2"></i>
              Responder
            </button>
          </div>
        )}

        {/* Preguntas para formulario */}
        {actividad.tipo === 'formulario' && actividad.preguntas && (
          <div className="mt-4">
            <h6 className="mb-3">Preguntas del formulario:</h6>
            {actividad.preguntas.map((pregunta, index) => (
              <div key={index} className="card mb-3">
                <div className="card-body">
                  <h6 className="card-title">Pregunta {index + 1}</h6>
                  <p className="card-text">{pregunta.pregunta}</p>
                  <div className="ms-3">
                    {user?.rol !== 'estudiante' && pregunta.opciones.map((opcion, opIndex) => (
                      <div key={opIndex} className="form-check disabled">
                        <input
                          type="radio"
                          className="form-check-input"
                          checked={pregunta.esCorrecta === opIndex}
                          disabled
                        />
                        <label className="form-check-label">
                          {opcion}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default VerActividad