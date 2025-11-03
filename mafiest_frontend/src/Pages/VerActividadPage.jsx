import React, { act } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ResponderActividad from '../components/ResponderActividad';

const VerActividadPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { actividad, user } = location.state || {};

  if (!actividad) {
    return <div className="alert alert-danger">No se encontró la actividad.</div>;
  }

  // Mostrar detalles solo si NO se está respondiendo (no es estudiante/independiente o la actividad está vencida o es el creador)
  // Normalizar fechas a medianoche para comparar solo la fecha, no la hora
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  const fechaLimite = new Date(actividad.fechaLimite);
  fechaLimite.setHours(0,0,0,0);
  const puedeResponder = (user?.rol === 'estudiante' || user?.rol === 'independiente') && actividad.creador?.id !== user.id && fechaLimite >= hoy;

  return (
    <div className="container mt-4">
      {!puedeResponder && (
        <div className="card mx-auto" style={{ maxWidth: 1200 }}>
          <div className="card-header d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Detalles de la Actividad</h4>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>
              <i className="fas fa-arrow-left me-2"></i>
              Volver
            </button>
          </div>
          <div className="card-body">
            <h5 className="card-title">{actividad.titulo}</h5>
            <p className="card-text">{actividad.descripcion}</p>
            <div className="mb-3">
              <strong>Fecha límite:</strong>
              <p>{new Date(actividad.fechaLimite).toLocaleDateString()}</p>
            </div>
            <div className="mb-3">
              <strong>Tipo de actividad:</strong>
              <p>{actividad.tipo === 'archivo' ? 'Entrega de archivo' : 'Formulario'}</p>
            </div>
            {actividad.tipo === 'archivo' && actividad.archivoUrl && (
              <div className="mt-3">
                <strong>Material de la Actividad:</strong>
                <div className="mt-2">
                  <a 
                    href={actividad.archivoUrl} 
                    className="btn btn-outline-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fas fa-download me-2"></i>
                    Descargar Material
                  </a>
                </div>
              </div>
            )}

            {/* Mostrar mensaje si la actividad está vencida */}
            {(['docente', 'administrador'].includes(user?.rol)) && (() => {
              const hoy = new Date();
              hoy.setHours(0,0,0,0);
              const fechaLimite = new Date(actividad.fechaLimite);
              fechaLimite.setHours(0,0,0,0);
              return fechaLimite < hoy;
            })() && (
              <div className="alert alert-warning mt-4">
                <i className="fas fa-exclamation-circle me-2"></i>
                Esta actividad está vencida y ya no se puede responder.
              </div>
            )}
          </div>
        </div>
      )}
      {/* Mostrar el formulario de respuesta solo si la actividad NO está vencida y el usuario tiene permiso */}
      {puedeResponder && (
        <div className="mt-4">
          <ResponderActividad
            actividad={actividad}
            user={user}
            onSubmit={(actividadActualizada) => {
              if (location.state?.onActualizarActividad) {
                location.state.onActualizarActividad(actividadActualizada);
              }
              setTimeout(() => {
                navigate('/actividades', { replace: true });
              }, 2000);
            }}
            onCancel={() => navigate('/actividades', { replace: true })}
          />
        </div>
      )}
    </div>
  );
};

export default VerActividadPage;
