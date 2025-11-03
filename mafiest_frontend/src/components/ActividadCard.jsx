import React, { useState } from 'react';
import actividadesService from '../services/actividades';
import respuestasActividadService from '../services/respuestasActividad';
import Toast from './Notification';

const ActividadCard = ({ actividad, user, onVer, onEditar, onEliminar, onVerRespuestas, onIntentoResponderVencida, onActualizarActividad, onDeshacerEntregaExito }) => {
  const [showRetroMsg, setShowRetroMsg] = useState(false);
  const handleEntregadaClick = () => {
    setShowRetroMsg(true);
    setTimeout(() => setShowRetroMsg(false), 3000);
  };
  const [mensaje, setMensaje] = useState(null);
  // Comparar solo año, mes y día
  const hoy = new Date(); 
  hoy.setHours(0,0,0,0);
  const fechaLimite = new Date(actividad.fechaLimite); 
  fechaLimite.setHours(0,0,0,0);
  // Asegurarnos de que la comparación de fechas sea correcta
  const esVencida = fechaLimite < hoy;
  const respondida = !!actividad.respondida;
  // Si la actividad tiene respuestas, buscar la del usuario y ver si está deshecha
  // Obtener la respuesta más reciente del usuario
  let respuestaUsuario = null;
  if (Array.isArray(actividad.respuestas)) {
    const respuestasUsuario = actividad.respuestas
      .filter(r => String(r.userId || r.user_id) === String(user.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    respuestaUsuario = respuestasUsuario[0];
  }
  // Estado local sincronizado con backend
  const [estadoLocal, setEstadoLocal] = useState(() => {
    // Verificar si la respuesta está deshecha
    const deshecha = respuestaUsuario?.deshecha === true;
    // Una actividad está entregada solo si tiene respuesta y NO está deshecha
    const entregada = respuestaUsuario && !deshecha;
    const respondida = entregada;

    // El estado visual depende de entregada
    const estado = entregada ? 'entregada' : (deshecha ? (esVencida ? 'vencida' : 'disponible') : (esVencida ? 'vencida' : 'disponible'));

    return {
      deshecha,
      respondida,
      mostrarEntregada: entregada,
      estado: estado
    };
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleResponderPregunta = async (preguntaIndex, opcionIndex) => {
    try {
      const actividadActualizada = await actividadesService.responderActividad(actividad.id, preguntaIndex, opcionIndex);
      if (actividadActualizada) {
        const pregunta = actividadActualizada.preguntas[preguntaIndex];
        const respuestaUsuario = pregunta.respuestas?.find(r => r.usuarioId === user.id);
        const esCorrecta = pregunta.opciones[respuestaUsuario?.seleccion]?.esCorrecta;
        setMensaje(esCorrecta ? "¡Correcto!" : "Incorrecto");
        // Mensaje de éxito genérico
        if (esCorrecta !== false) {
          setMensaje("✅ ¡Respuesta enviada exitosamente!");
        }
      }
    } catch (error) {
      console.error('Error al responder:', error);
      setMensaje(error?.response?.data?.error || "Error al enviar la respuesta");
    }
    setTimeout(() => setMensaje(null), 3000);
  };

  // Badge para tipo de actividad (General o Grupal)
  let tipoActividadBadge = null;
  if (actividad.global) {
    tipoActividadBadge = <span className="badge bg-primary ms-2">General</span>;
  } else if (actividad.grupo?.nombre) {
    tipoActividadBadge = <span className="badge bg-info ms-2">Grupal: {actividad.grupo.nombre}</span>;
  } else if (actividad.grupoId) {
    tipoActividadBadge = <span className="badge bg-info ms-2">Grupal</span>;
  }

  return (
  <div className="grabacion-card actividad-card-custom">
      <div className="grabacion-header d-flex justify-content-between align-items-start mb-2">
        <div>
          <h3 style={{margin:0, fontSize:'1.2rem', fontWeight:600, color:'#fff'}}>
           <strong>Título:</strong> {actividad.titulo} {tipoActividadBadge}
          </h3>
          <div className="text-muted small mt-1">
            <i className="fas fa-user-edit me-1"></i>
            Creado por: <span className="fw-bold">{actividad.creador?.nombre || actividad.creador?.username || 'Desconocido'}</span>
            {actividad.creador?.rol && (
              <span className="badge bg-secondary ms-2 text-capitalize">{actividad.creador.rol}</span>
            )}
          </div>
        </div>
        {actividad.calificacion !== undefined && user?.rol === 'estudiante' && (
          <span className={`badge ${actividad.calificacion >= 3 ? 'bg-success' : 'bg-danger'}`}>
            Nota: {actividad.calificacion}
          </span>
        )}
      </div>
  <div className="grabacion-body">
        <p>{actividad.descripcion}</p>
        <div className="grabacion-info mb-2 ">
          <div><strong>Fecha límite:</strong> {fechaLimite.toLocaleDateString()}</div>
          <div><strong>Tipo:</strong> {actividad.tipo === 'archivo' ? 'Entrega de archivo' : 'Formulario'}</div>
          {actividad.tipo === 'archivo' && (
            <div className="mt-1">
              <i className="fas fa-info-circle text-primary me-1"></i>
              <small className="text-primary">Formatos permitidos: PDF, Word (.pdf, .doc, .docx)</small>
            </div>
          )}
        </div>
        <div className="grabacion-info">
          {esVencida ? (
            <span className="badge bg-danger px-3 py-2 fs-6" style={{fontWeight:'bold', letterSpacing:'1px'}}>
              <i className="fas fa-times-circle me-1"></i>Vencida
            </span>
          ) : (
            (user?.rol === 'estudiante' || user?.rol === 'independiente') ? (
              estadoLocal.deshecha ? (
                esVencida ? (
                  <span className="badge bg-danger px-3 py-2 fs-6" style={{fontWeight:'bold', letterSpacing:'1px'}}>
                    <i className="fas fa-times-circle me-1"></i>Vencida
                  </span>
                ) : (
                  <span className="badge bg-success px-3 py-2 fs-6" style={{fontWeight:'bold', letterSpacing:'1px'}}>
                    <i className="fas fa-check-circle me-1"></i>Disponible
                  </span>
                )
              ) : estadoLocal.respondida ? (
                <span className="badge bg-info px-3 py-2 fs-6" style={{fontWeight:'bold', letterSpacing:'1px'}}>
                  <i className="fas fa-check-circle me-1"></i>Entregada
                </span>
              ) : (
                <span className="badge bg-success px-3 py-2 fs-6" style={{fontWeight:'bold', letterSpacing:'1px'}}>
                  <i className="fas fa-check-circle me-1"></i>Disponible
                </span>
              )
            ) : (
              <span className="badge bg-success px-3 py-2 fs-6" style={{fontWeight:'bold', letterSpacing:'1px'}}>
                <i className="fas fa-check-circle me-1"></i>Disponible
              </span>
            )
          )}
        </div>
        {/* Preguntas ocultas para que no se vean en la tarjeta */}
        <div className="mt-4 d-flex justify-content-center">
          <div className="btn-group d-flex flex-wrap gap-2 justify-content-center align-items-center">
            {(user?.rol === 'estudiante' || user?.rol === 'independiente') ? (
              <>
                {/* Botón Responder solo si no está entregada y no está vencida */}
                {(!estadoLocal.respondida || estadoLocal.deshecha) && !esVencida && (
                  <button
                    className={`btn btn-primary btn-sm mx-1`}
                    style={{minWidth:'120px'}}
                    onClick={() => {
                      if (esVencida) {
                        if (typeof onIntentoResponderVencida === 'function') {
                          onIntentoResponderVencida('Esta actividad está vencida y no puedes responder.');
                        }
                      } else {
                        // Verificar que somos estudiante o independiente y que no somos el creador
                        if ((user?.rol === 'estudiante' || user?.rol === 'independiente') && 
                            actividad.creador?.id !== user.id) {
                          onVer && onVer(actividad);
                        }
                      }
                    }}
                    title={esVencida ? 'Actividad vencida' : 'Responder actividad'}
                  >
                    <i className="fas fa-pencil-alt me-1"></i>Responder
                  </button>
                )}
                {/* Botón Entregada solo si está entregada y no deshecha */}
                {estadoLocal.respondida && !estadoLocal.deshecha && (
                  <>
                  <button
                    className="btn btn-success btn-sm mx-1"
                    style={{minWidth:'120px'}}
                    onClick={handleEntregadaClick}
                    title="Actividad entregada"
                  >
                    <i className="fas fa-check-circle me-1"></i>Entregada
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm mx-1"
                    style={{minWidth:'120px'}}
                    onClick={async () => {
                      if (!respuestaUsuario) return;
                      try {
                        const resultado = await respuestasActividadService.deshacerEntrega(respuestaUsuario.id);
                        if (!resultado || !resultado.message) {
                          throw new Error('Respuesta inválida del servidor');
                        }

                        // Notificar al padre para recargar todo
                        if (onDeshacerEntregaExito) {
                          await onDeshacerEntregaExito('✅ Entrega deshecha correctamente');
                        }

                        // Actualizar estado local después de la recarga
                        const nuevoEstado = {
                          deshecha: true,
                          respondida: false,
                          mostrarEntregada: false,
                          estado: esVencida ? 'vencida' : 'disponible'
                        };
                        setEstadoLocal(nuevoEstado);
                        
                        // Solo actualizar localmente si no hay handler global
                        if (!onDeshacerEntregaExito) {
                          setShowToast(true);
                          setToastMsg('✅ Entrega deshecha correctamente');
                        }
                        
                        // Manejar la actualización del estado y notificaciones
                        if (onDeshacerEntregaExito) {
                          // Si hay un handler global, dejamos que él maneje todo
                          await onDeshacerEntregaExito('✅ Entrega deshecha correctamente');
                        } else {
                          // Si no hay handler global, manejamos el estado localmente
                          const nuevoEstado = {
                            deshecha: true,
                            respondida: false,
                            mostrarEntregada: false,
                            estado: esVencida ? 'vencida' : 'disponible'
                          };
                          setEstadoLocal(nuevoEstado);
                          setShowToast(true);
                          setToastMsg('✅ Entrega deshecha correctamente');
                        }
                      } catch (e) {
                        setShowToast(true);
                        setToastMsg('Error al deshacer entrega');
                      }
                    }}
                    title="Deshacer entrega"
                  >
                    <i className="fas fa-undo me-1"></i>Deshacer entrega
                  </button>
                  </>
                )}
                {estadoLocal.estado === 'deshecha' && (
                  <span className="badge bg-secondary mx-1" style={{minWidth:'120px'}}>
                    <i className="fas fa-ban me-1"></i>Entrega deshecha
                  </span>
                )}
                {estadoLocal.estado === 'disponible' && !esVencida && (
                  <span className="badge bg-success px-3 py-2 fs-6 mx-1" style={{fontWeight:'bold', letterSpacing:'1px'}}>
                    <i className="fas fa-check-circle me-1"></i>Disponible
                  </span>
                )}
                {estadoLocal.estado === 'vencida' || (estadoLocal.estado === 'deshecha' && esVencida) ? (
                  <span className="badge bg-danger px-3 py-2 fs-6 mx-1" style={{fontWeight:'bold', letterSpacing:'1px'}}>
                    <i className="fas fa-times-circle me-1"></i>Vencida
                  </span>
                ) : null}
      {/* Toast de éxito/error */}
      {showToast && (
        <Toast
          show={showToast}
          message={toastMsg}
          type={toastMsg.includes('Error') ? 'danger' : 'success'}
          onClose={() => setShowToast(false)}
        />
      )}
                {showRetroMsg && (
                  <div className="alert alert-info mt-2">La actividad está en proceso de calificación</div>
                )}
              </>
            ) : (
              <button className="btn btn-primary btn-sm mx-1" style={{minWidth:'120px'}} onClick={() => onVer(actividad)}>
                <i className="fas fa-eye me-1"></i>Ver
              </button>
            )}
            {/* Botón editar/eliminar solo para admin/docente */}
            {user?.rol === 'administrador' || (user?.rol === 'docente' && actividad.creador?.id === user.id) ? (
              <>
                <button className="btn btn-primary btn-sm mx-1" style={{minWidth:'120px'}} onClick={() => onEditar(actividad)}>
                  <i className="fas fa-edit me-1"></i>Editar
                </button>
                <button className="btn btn-primary btn-sm mx-1" style={{minWidth:'120px'}} onClick={() => onEliminar(actividad.id)}>
                  <i className="fas fa-trash me-1"></i>Eliminar
                </button>
                {/* Botón Ver Respuestas para admin/docente */}
                <button className="btn btn-warning btn-sm mx-1" style={{minWidth:'120px'}} onClick={() => onVerRespuestas(actividad)}>
                  <i className="fas fa-list me-1"></i>Ver Respuestas
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActividadCard;