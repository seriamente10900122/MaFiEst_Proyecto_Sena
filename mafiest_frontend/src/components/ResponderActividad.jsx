import React, { useState, useEffect, useRef } from 'react';
import actividadesService from '../services/actividades';
import respuestasActividadService from '../services/respuestasActividad';
import ToastNotification from './Notification';
import '../styles/responderActividad.css';


const ResponderActividad = ({ actividad, user, onSubmit, onCancel }) => {
  const toastRef = useRef();
  const [respuestaArchivo, setRespuestaArchivo] = useState(null);
  const [respuestaArchivoUrl, setRespuestaArchivoUrl] = useState('');
  const [editando, setEditando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [toastType, setToastType] = useState('default');
  const [respuestasFormulario, setRespuestasFormulario] = useState(
    actividad.preguntas ? actividad.preguntas.map(() => ({ respuesta: '' })) : []
  );
  const [error, setError] = useState(null);
  const [entregada, setEntregada] = useState(false);
  const [respuestaExistente, setRespuestaExistente] = useState(null);
  const [loading, setLoading] = useState(false);
  // Estados para filtros y badges
  const [estadoActividad, setEstadoActividad] = useState('disponible');
  const [filtroActual, setFiltroActual] = useState('disponibles');
  // Estado para paginación de preguntas
  const [paginaPregunta, setPaginaPregunta] = useState(0);

  // Función para filtrar actividades
  const filtrarActividades = (actividad) => {
    const fechaActual = new Date();
  fechaActual.setHours(12,0,0,0); // Mediodía para evitar desfases
  const fechaLimite = new Date(actividad.fechaLimite);
  fechaLimite.setHours(12,0,0,0); // Mediodía para evitar desfases
    const respuestaEstudiante = respuestaExistente;

    switch (filtroActual) {
      case 'disponibles':
        // Solo disponible si no hay respuesta y no está vencida
        return !respuestaEstudiante && fechaLimite >= fechaActual;
      case 'entregadas':
        return respuestaEstudiante !== null;
      case 'vencidas':
        // Solo vencida si no hay respuesta y la fecha ya pasó
        return !respuestaEstudiante && fechaLimite < fechaActual;
      default:
        return true;
    }
  };

  useEffect(() => {
    const fetchRespuesta = async () => {
      setLoading(true);
      try {
        const respuestas = await respuestasActividadService.obtenerRespuestasActividad(actividad.id);
        const miRespuesta = respuestas.find(r => r.usuarioId === user.id);
        
        // Verificar fecha límite
        const ahora = new Date();
        const fechaLimite = new Date(actividad.fechaLimite);
        
        // Ajustar fechas a mediodía para evitar desfases
        ahora.setHours(12,0,0,0);
        fechaLimite.setHours(12,0,0,0);

        // Debug
        // Determinar estado basado en respuesta y fecha
        if (miRespuesta) {
          setRespuestaExistente(miRespuesta);
          setEntregada(true);
          setEstadoActividad('entregado');
          if (editando) {
            if (actividad.tipo === 'archivo') {
              setRespuestaArchivo(null);
              setRespuestaArchivoUrl(miRespuesta.archivoUrl || '');
            } else {
              if (miRespuesta.respuestas) {
                setRespuestasFormulario(miRespuesta.respuestas);
              }
            }
          }
        } else {
          setRespuestaExistente(null);
          setEntregada(false);
          // Comparar fechas directamente para determinar si está vencida
          if (ahora > fechaLimite) {
            setEstadoActividad('vencida');
          } else {
            setEstadoActividad('disponible');
          }
        }
        setError(null);
      } catch (err) {
        if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('Error al obtener tu respuesta');
        }
        setRespuestaExistente(null);
        setEntregada(false);
      }
      setLoading(false);
    };
    fetchRespuesta();
  }, [actividad, user, editando, entregada]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Limpiar estados anteriores
    setError(null);
    setMensaje(null);
    setLoading(true);

    try {
      let respuesta;
      // Validaciones iniciales
      if (actividad.tipo === 'archivo') {
        if (!respuestaArchivo && !respuestaArchivoUrl) {
          throw new Error('Selecciona un archivo o ingresa una URL');
        }
        // Validar longitud de la URL
        if (respuestaArchivoUrl && respuestaArchivoUrl.length > 200) {
          setMensaje('La URL es demasiado larga (máx. 200 caracteres)');
          setToastType('danger');
          setLoading(false);
          return;
        }
        // Validar tipo de archivo permitido
        if (respuestaArchivo) {
          const tiposPermitidos = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ];
          if (!tiposPermitidos.includes(respuestaArchivo.type)) {
            setMensaje('Tipo de archivo no permitido. Solo se permite PDF o Word.');
            setToastType('danger');
            setLoading(false);
            return;
          }
        }
      } else {
        const respuestasValidas = respuestasFormulario.every(r => r.respuesta !== undefined && r.respuesta !== '');
        if (!respuestasValidas) {
          throw new Error('Por favor responde todas las preguntas.');
        }
      }

      // Si estamos editando, eliminar la respuesta anterior
      if (editando && respuestaExistente) {
        await respuestasActividadService.eliminarRespuesta(respuestaExistente.id);
      }

      // Enviar la nueva respuesta
      if (actividad.tipo === 'archivo') {
        respuesta = await respuestasActividadService.subirRespuestaArchivo(
          actividad.id, 
          respuestaArchivo, 
          respuestaArchivoUrl
        );
      } else {
        respuesta = await respuestasActividadService.crearRespuestaFormulario(
          actividad.id, 
          { respuestaTexto: JSON.stringify(respuestasFormulario) }
        );
      }

      // Verificar que la respuesta se guardó
      const respuestas = await respuestasActividadService.obtenerRespuestasActividad(actividad.id);
      const miRespuesta = respuestas.find(r => 
        r.userId === user.id || 
        r.user_id === user.id || 
        (r.usuario && r.usuario.id === user.id)
      );

      if (!miRespuesta || miRespuesta.deshecha) {
        console.error('Respuesta no encontrada o deshecha:', { respuestas, userId: user.id });
        throw new Error('Error al guardar la respuesta. Por favor intenta de nuevo.');
      }

      // Actualizar estados en caso de éxito
      setRespuestaExistente(miRespuesta);
      setEntregada(true);
      setEstadoActividad('entregado');
      setEditando(false);
      setRespuestaArchivo(null);
      setRespuestaArchivoUrl('');
      setMensaje('✅ ¡Respuesta enviada con éxito!');
      setToastType('success');
      setError(null);
      
      // Mostrar el toast de éxito por 2 segundos antes de actualizar
      setTimeout(() => {
        // Llamar a onSubmit para actualizar el estado en el componente padre
        if (onSubmit) {
          onSubmit({
            ...actividad,
            respuestas: [{
              ...miRespuesta,
              deshecha: false
            }],
            estado: 'entregada',
            entregada: true,
            respondida: true
          });
        }
      }, 2000);

    } catch (error) {
      console.error('Error al enviar respuesta:', error);
      let mensajeError = error.response?.data?.error || error.message || 'Error al enviar la respuesta';
      
      // Mejorar mensajes de error para el usuario
      if (mensajeError.includes('No se pudo verificar')) {
        mensajeError = 'La respuesta se envió pero hubo un problema al verificarla. Por favor refresca la página.';
      } else if (mensajeError.includes('Token')) {
        mensajeError = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
      }

      setError(mensajeError);
      setToastType('danger');
      // No cambiar estado de entrega si fue error de verificación
      if (!mensajeError.includes('No se pudo verificar')) {
        setEntregada(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!respuestaExistente) return;
    setLoading(true);
    try {
      await respuestasActividadService.eliminarRespuesta(respuestaExistente.id);
      setRespuestaExistente(null);
      setEntregada(false);
      setMensaje('Respuesta eliminada');
    } catch (err) {
      setError('Error al eliminar la respuesta');
      setMensaje('Error al eliminar respuesta');
    }
    setLoading(false);
    setTimeout(() => setMensaje(null), 3000);
  };

  const handleRespuestaChange = (index, value) => {
    const nuevasRespuestas = [...respuestasFormulario];
    nuevasRespuestas[index] = { respuesta: value };
    setRespuestasFormulario(nuevasRespuestas);
  };

  if (loading) return <div className="text-center">Cargando...</div>;
  // Solo mostrar error si es crítico (actividad/usuario no encontrado o acceso denegado)
  const errorCritico = error && (
    error.includes('Actividad no encontrada') ||
    error.includes('Usuario no encontrado') ||
    error.includes('No puedes ver respuestas')
  );
  if (errorCritico) {
    return (
      <div className="alert alert-danger mt-4 text-center" style={{maxWidth: '600px', margin: '2rem auto'}}>
        {error}
      </div>
    );
  }
  // BADGE de estado
  // Toast notification arriba a la izquierda
  const toastPosition = {
    position: 'fixed',
    top: '30px',
    left: '30px',
    zIndex: 9999
  };
  const badgeColor = estadoActividad === 'entregado' ? 'success' : estadoActividad === 'vencida' ? 'danger' : 'primary';
  const badgeText = estadoActividad === 'entregado' ? 'Entregada' : estadoActividad === 'vencida' ? 'Vencida' : 'Disponible';

  // Renderizado condicional basado en el estado de entrega y edición
  if (entregada && respuestaExistente && !editando) {
    return (
      <div className="responder-actividad-full">
        <div style={toastPosition}>
          <ToastNotification show={!!mensaje} message={mensaje} type={toastType} onClose={() => setMensaje(null)} />
        </div>
        <div className="responder-actividad-bar" style={{padding: '1rem'}}>
          <div className="container">
            <div className="row align-items-center">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className={`badge bg-${badgeColor}`}>{badgeText}</span>
                  <h4 className="mb-0">Responder Actividad</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card responder-actividad-form" style={{maxWidth: '1200px', margin: '2rem auto'}}>
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3 className="h5 mb-0">Tu respuesta entregada</h3>
            <span className={`badge bg-${badgeColor}`} style={{fontSize: '1rem'}}>{badgeText}</span>
          </div>
          <div className="card-body">
            {actividad.tipo === 'archivo' ? (
              <>
                {respuestaExistente.archivoUrl && (
                  <div>
                    <strong>Archivo:</strong> <a href={respuestaExistente.archivoUrl} target="_blank" rel="noopener noreferrer">Ver archivo</a>
                  </div>
                )}
              </>
            ) : (
              <>
                {respuestaExistente.respuestas && respuestaExistente.respuestas.map((r, idx) => (
                  <div key={idx} style={{marginBottom: '8px'}}>
                    <strong>Respuesta {idx + 1}:</strong> {typeof r.respuesta === 'string' ? r.respuesta : JSON.stringify(r.respuesta)}
                  </div>
                ))}
              </>
            )}
            {respuestaExistente.retroalimentacion && (
              <div className="alert alert-info mt-2">
                <strong>Retroalimentación:</strong> {respuestaExistente.retroalimentacion}
                {respuestaExistente.nota && <span className="ms-3"><strong>Nota:</strong> {respuestaExistente.nota}</span>}
              </div>
            )}
            {mensaje && <div className={`alert alert-${mensaje.includes('Error') ? 'danger' : 'success'} mt-2`}>{mensaje}</div>}
            <div className="d-flex gap-2 justify-content-end mt-4">
              {/* Solo estudiantes e independientes pueden editar/borrar su respuesta */}
              {(user?.rol === 'estudiante' || user?.rol === 'independiente') && (
                <>
                  <button type="button" className="btn btn-warning" onClick={() => setEditando(true)} disabled={loading}>
                    Editar respuesta
                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
                    Eliminar respuesta
                  </button>
                </>
              )}
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #101426 0%, #181e36 100%)',
      fontFamily: 'Inter, Arial, sans-serif',
      padding: 0,
    }}>
      <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999 }}>
        <ToastNotification
          ref={toastRef}
          show={!!mensaje}
          message={mensaje}
          type={toastType}
          onClose={() => setMensaje(null)}
          duration={4000}
        />
      </div>
      {/* Botón Volver */}
      <div style={{ padding: '3rem 0 2rem 0', display: 'flex', justifyContent: 'flex-start', width: '100%', maxWidth: 1200, margin: '0 auto' }}>
        <button
          className="btn"
          onClick={onCancel}
          style={{
            background: '#181e36',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            fontWeight: 600,
            fontSize: '1.1rem',
            padding: '0.9rem 2.2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          &#8592; Volver
        </button>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '2.5rem',
        width: '100%',
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 2rem 4rem 2rem',
        boxSizing: 'border-box',
      }}>
        {/* Panel Detalles */}
        <div style={{
          background: '#17213a',
          borderRadius: '18px',
          padding: '2.5rem 2rem',
          minWidth: 320,
          maxWidth: 420,
          color: '#fff',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          marginTop: '100px',
          marginLeft: 0,
          marginRight: 'auto',
          marginBottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignSelf: 'flex-start',
        }}>
          <h2 style={{ fontWeight: 700, color: '#fff', fontSize: '1.6rem', marginBottom: '1.7rem', letterSpacing: '-0.5px' }}>
            Detalles de la Actividad
          </h2>
          <div style={{ fontSize: '1.08rem', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <div><span style={{ fontWeight: 600 }}>Título:</span> {actividad.titulo}</div>
            <div><span style={{ fontWeight: 600 }}>Descripción:</span> {actividad.descripcion}</div>
            <div><span style={{ fontWeight: 600 }}>Fecha límite:</span> {new Date(actividad.fechaLimite).toLocaleDateString()}</div>
            <div><span style={{ fontWeight: 600 }}>Tipo de actividad:</span> {actividad.tipo === 'archivo' ? 'Archivo' : 'Formulario'}</div>
          </div>
        </div>
        {/* Panel Formulario */}
        <div style={{
          width: '100%',
          maxWidth: 650,
          minWidth: 320,
          background: '#232b47',
          borderRadius: '18px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          padding: '2.5rem 2.2rem 2rem 2.2rem',
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}>
          <form onSubmit={handleSubmit} className="responder-actividad-form" style={{ width: '100%' }}>
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert" style={{ color: '#fff', background: 'transparent', border: 'none', fontWeight: 600, fontSize: '1.1rem', marginBottom: 12, textAlign: 'left', boxShadow: 'none' }}>
                {error}
              </div>
            )}
            {actividad.tipo === 'archivo' ? (
              <div style={{
                background: 'transparent',
                borderRadius: '12px',
                padding: '0',
                marginBottom: '1.5rem',
                width: '100%',
                maxWidth: '1000px',
                margin: 0
              }}>
                <label className="form-label" style={{color: '#3fa6ff', fontSize: '1.2rem', fontWeight: 'bold'}}>
                  Sube tu respuesta
                </label>
                <input
                  type="file"
                  className="form-control mb-3"
                  onChange={(e) => setRespuestaArchivo(e.target.files[0])}
                  style={{
                    background: '#17213a',
                    border: '1.5px solid #3fa6ff',
                    color: '#fff',
                    padding: '0.8rem',
                    borderRadius: '8px'
                  }}
                />
                <span style={{color: '#3fa6ff', display: 'block', margin: '1rem 0'}}>o ingresa una URL:</span>
                <input
                  type="text"
                  className="form-control mb-3"
                  value={respuestaArchivoUrl}
                  onChange={e => setRespuestaArchivoUrl(e.target.value)}
                  placeholder="https://..."
                  style={{
                    background: '#17213a',
                    border: '1.5px solid #3fa6ff',
                    color: '#fff',
                    padding: '0.8rem',
                    borderRadius: '8px'
                  }}
                />
                <div style={{color: '#fff', opacity: '0.8', fontSize: '0.9rem', marginTop: '1rem'}}>
                  Sube tu archivo o ingresa una URL con la solución de la actividad
                </div>
              </div>
            ) : (
              <div style={{
                background: 'transparent',
                borderRadius: '12px',
                padding: '0',
                marginBottom: '1.5rem',
                width: '100%',
                maxWidth: '1000px',
                margin: 0
              }}>
                <h5 style={{color: '#3fa6ff', fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1.5rem'}}>
                  Formulario
                </h5>
                {actividad.preguntas && actividad.preguntas.length > 0 && (
                  <>
                    <div style={{
                      background: '#17213a',
                      borderRadius: '12px',
                      padding: '1.7rem 1.3rem',
                      marginBottom: '2rem',
                      border: '1.5px solid #2a3956',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.07)'
                    }}>
                      <p style={{
                        color: '#fff',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        marginBottom: '1.5rem'
                      }}>{`Pregunta ${paginaPregunta + 1}. `}
                        <span style={{color:'#ffffffff', fontWeight:600}}>
                          {actividad.preguntas[paginaPregunta]?.texto || actividad.preguntas[paginaPregunta]?.enunciado || actividad.preguntas[paginaPregunta]?.pregunta || JSON.stringify(actividad.preguntas[paginaPregunta]) || ''}
                        </span>
                      </p>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '1.2rem'}}>
                        {actividad.preguntas[paginaPregunta].opciones.map((opcion, opcionIndex) => (
                          <div
                            key={opcionIndex}
                            className="form-check"
                            style={{
                              background: '#232b47',
                              padding: '1.1rem',
                              borderRadius: '9px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              border: '1px solid #2a3956',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            onClick={() => handleRespuestaChange(paginaPregunta, opcionIndex)}
                          >
                            <input
                              type="radio"
                              className="form-check-input"
                              name={`pregunta-${paginaPregunta}`}
                              checked={respuestasFormulario[paginaPregunta]?.respuesta === opcionIndex}
                              onChange={() => handleRespuestaChange(paginaPregunta, opcionIndex)}
                              style={{marginRight: '1rem', pointerEvents: 'none'}}
                            />
                            <label className="form-check-label" style={{
                              color: '#3fa6ff',
                              cursor: 'pointer',
                              marginBottom: 0
                            }}>{opcion}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Controles de paginación */}
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24}}>
                      <button type="button" onClick={() => setPaginaPregunta(p => Math.max(0, p - 1))} disabled={paginaPregunta === 0} style={{maxWidth: '120px', padding: '0.7rem 2rem', borderRadius: 8, border: 'none', background: '#232b47', color: '#3fa6ff', fontWeight: 'bold', fontSize: '1.35rem', cursor: paginaPregunta === 0 ? 'not-allowed' : 'pointer', opacity: paginaPregunta === 0 ? 0.5 : 1}}>Anterior</button>
                      <span style={{color: '#fff', fontWeight: 'bold'}}>{paginaPregunta + 1} / {actividad.preguntas.length}</span>
                      <button type="button" onClick={() => setPaginaPregunta(p => Math.min(actividad.preguntas.length - 1, p + 1))} disabled={paginaPregunta === actividad.preguntas.length - 1} style={{padding: '0.7rem 2rem', borderRadius: 8, border: 'none', background: '#232b47', color: '#3fa6ff', fontWeight: 'bold', fontSize: '1.35rem', cursor: paginaPregunta === actividad.preguntas.length - 1 ? 'not-allowed' : 'pointer', opacity: paginaPregunta === actividad.preguntas.length - 1 ? 0.5 : 1}}>Siguiente</button>
                    </div>
                  </>
                )}
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1.5rem',
              marginTop: '2.5rem',
              padding: '1.2rem',
              borderRadius: '12px',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)'
            }}>
              <button 
                type="button" 
                onClick={onCancel}
                style={{
                  background: '#232b47',
                  color: '#3fa6ff',
                  border: '1.5px solid #3fa6ff',
                  padding: '0.8rem 2rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  minWidth: '120px'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || (estadoActividad === 'vencida' && !respuestaExistente) || entregada}
                style={{
                  background: loading ? '#232b47' : '#3fa6ff',
                  color: '#fff',
                  border: 'none',
                  padding: '0.8rem 2rem',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  minWidth: '120px',
                  cursor: 'pointer',
                  opacity: (loading || (estadoActividad === 'vencida' && !respuestaExistente) || entregada) ? '0.7' : '1'
                }}
              >
                {loading ? 'Enviando...' : editando ? 'Guardar cambios' : 'Responder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResponderActividad;