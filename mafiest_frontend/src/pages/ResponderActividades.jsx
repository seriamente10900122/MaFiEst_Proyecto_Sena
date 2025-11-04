import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ResponderActividad from '../components/ResponderActividad';
import ToastNotification from '../components/Notification';

const ResponderActividadUnificadaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { actividad, user } = location.state || {};
  const [toast, setToast] = useState({ show: false, message: '', type: 'danger' });

  if (!actividad || !user) {
    return <div className="alert alert-danger">No se encontró la actividad o el usuario.</div>;
  }

  // Validación: Docente/Admin no puede responder su propia actividad
  const esPropietario = (user.rol === 'docente' || user.rol === 'administrador') && actividad.creadorId === user.id;

  const handleSubmit = async () => {
    try {
      // Actualizar la lista de actividades antes de navegar
      await actividadesService.obtenerMisActividades();
      
      setToast({ show: true, message: '✅ Respuesta enviada correctamente', type: 'success' });
      // Dar tiempo para que se muestre el toast y se actualicen los datos
      setTimeout(() => {
        navigate('/actividades', { replace: true });
      }, 1500);
    } catch (error) {
      setToast({ show: true, message: 'Error al enviar la respuesta', type: 'danger' });
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleIntentoResponder = () => {
    setToast({ show: true, message: 'No puedes responder tu misma actividad', type: 'danger' });
  };

  return (
    <div className="container mt-4">
      <ToastNotification
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
      <div style={{ width: '100%', maxWidth: '100vw', background: 'transparent', boxShadow: 'none', border: 'none', margin: 0, padding: 0 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0" style={{color:'#fff'}}>Detalles de la Actividad</h4>
          <button className="btn btn-secondary" onClick={handleCancel}>
            <i className="fas fa-arrow-left me-2"></i>
            Volver
          </button>
        </div>
        <div style={{color:'#fff'}}>
          <h5 style={{fontWeight:'bold'}}>{actividad.titulo}</h5>
          <p>{actividad.descripcion}</p>
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
          {(['estudiante', 'docente', 'independiente'].includes(user?.rol)) &&
            new Date(actividad.fechaLimite) < new Date() && (
              <div className="alert alert-warning mt-4">
                <i className="fas fa-exclamation-circle me-2"></i>
                Esta actividad está vencida y ya no se puede responder.
              </div>
            )}
          {/* Mostrar el formulario de respuesta solo si la actividad NO está vencida y el usuario tiene permiso */}
          {(['estudiante', 'docente', 'independiente'].includes(user?.rol)) &&
            new Date(actividad.fechaLimite) >= new Date() && (
              esPropietario ? (
                <button className="btn btn-warning mt-4" onClick={handleIntentoResponder}>
                  No puedes responder tu misma actividad
                </button>
              ) : (
                <div className="mt-4">
                  <ResponderActividad
                    actividad={actividad}
                    user={user}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                  />
                </div>
              )
            )}
        </div>
      </div>
    </div>
  );
};

export default ResponderActividadUnificadaPage;
