import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import respuestasActividadService from '../services/respuestasActividad';
import Toast from '../components/Notification';

const VerRespuestasActividad = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { actividad, user } = location.state || {};
  const [respuestas, setRespuestas] = useState([]);
  // Solo mostrar la última respuesta de cada usuario
  const respuestasFiltradas = React.useMemo(() => {
    if (!Array.isArray(respuestas)) return [];
    // Map: userId -> respuesta más reciente
    const map = new Map();
    respuestas.forEach(r => {
      const userId = r.usuarioId || (r.usuario && r.usuario.id);
      if (!userId) return;
      if (!map.has(userId) || new Date(r.createdAt) > new Date(map.get(userId).createdAt)) {
        map.set(userId, r);
      }
    });
    return Array.from(map.values());
  }, [respuestas]);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'danger' });
  const [retro, setRetro] = useState({});
  const [nota, setNota] = useState({});
  const [loading, setLoading] = useState(false);
  const [editRetroId, setEditRetroId] = useState(null);
  const [editRetroText, setEditRetroText] = useState('');
  const [editNota, setEditNota] = useState('');

  useEffect(() => {
    if (!actividad || !user) return;
    const fetchRespuestas = async () => {
      try {
        const res = await respuestasActividadService.obtenerRespuestasActividadPorRol(actividad.id, user);
        if (!res || res.length === 0) {
          setToast({ show: true, message: 'No hay respuestas disponibles aún.', type: 'info' });
          setRespuestas([]);
          return;
        }
        setRespuestas(res);
      } catch (err) {
        setError('Error al obtener las respuestas de la actividad');
        setToast({ show: true, message: 'Error al obtener las respuestas de la actividad', type: 'danger' });
      }
    };
    fetchRespuestas();
  }, [actividad, user]);

  // Manejar retroalimentación
  const handleRetroalimentar = async (respuestaId) => {
    setLoading(true);
    try {
      await respuestasActividadService.setRetroalimentacion(respuestaId, retro[respuestaId] || '', nota[respuestaId] || '');
      setToast({ show: true, message: 'Retroalimentación enviada', type: 'success' });
      // Refrescar respuestas para mostrar la retroalimentación actualizada
      const res = await respuestasActividadService.obtenerRespuestasActividadPorRol(actividad.id, user);
      setRespuestas(res);
      // Limpiar campos de retroalimentación y nota para ese usuario
      setRetro(prev => ({ ...prev, [respuestaId]: '' }));
      setNota(prev => ({ ...prev, [respuestaId]: '' }));
    } catch (err) {
      setToast({ show: true, message: 'Error al enviar retroalimentación', type: 'danger' });
    }
    setLoading(false);
  };

  if (!actividad || !user) {
    return <div className="alert alert-danger">No se encontró la actividad o el usuario.</div>;
  }

  return (
    <div className="container mt-4">
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
      <div className="card mx-auto" style={{ maxWidth: 800 }}>
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Respuestas de: {actividad.titulo}</h4>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left me-2"></i>
            Volver
          </button>
        </div>
        <div className="card-body">
          {respuestasFiltradas.length === 0 ? (
            <div className="alert alert-info">No hay respuestas para mostrar.</div>
          ) : (
            <ul className="list-group">
              {respuestasFiltradas.map((r, i) => (
                <li key={r.id || i} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{r.usuario?.nombre || r.usuario?.username || 'Usuario desconocido'}:</strong>{' '}
                      {/* Mostrar respuestas tipo formulario con índice */}
                      {Array.isArray(r.respuestas) && r.respuestas.length > 0 ? (
                        <ul style={{ marginBottom: 0 }}>
                          {r.respuestas.map((resp, idx) => {
                            let respuestaMostrada = resp.respuesta;
                            if (typeof resp.respuesta === 'number') {
                              respuestaMostrada = String.fromCharCode(97 + resp.respuesta);
                            }
                            if (Array.isArray(resp.respuesta)) {
                              respuestaMostrada = resp.respuesta.map(num =>
                                typeof num === 'number' ? String.fromCharCode(97 + num) : num
                              ).join(', ');
                            }
                            // Mostrar opción correcta si es docente o admin y la actividad tiene preguntas
                            let correcta = null;
                            if ((user.rol === 'docente' || user.rol === 'administrador') && Array.isArray(actividad.preguntas) && actividad.preguntas[idx]) {
                              const preg = actividad.preguntas[idx];
                              const idxCorrecta = preg.esCorrecta;
                              if (typeof idxCorrecta === 'number' && Array.isArray(preg.opciones) && preg.opciones[idxCorrecta]) {
                                correcta = `(${String.fromCharCode(97 + idxCorrecta)}) ${preg.opciones[idxCorrecta]}`;
                              }
                            }
                            return (
                              <li key={idx}>
                                <strong>Respuesta pregunta {idx + 1}:</strong> {respuestaMostrada}
                                {correcta && (
                                  <span className="ms-2 text-success"> (<strong>Correcta:</strong> {correcta})</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : r.respuestaTexto || (r.archivoUrl && (
                        <a href={r.archivoUrl} target="_blank" rel="noopener noreferrer">Descargar archivo</a>
                      )) || 'Sin respuesta'}
                    </div>
                  </div>
                    {(user.rol === 'docente' || user.rol === 'administrador') && (() => {
                      // Solo mostrar el formulario si NO existe una retroalimentación de este usuario para esta respuesta
                      const yaRetro = Array.isArray(r.retroalimentaciones) && r.retroalimentaciones.some(retro => retro.usuarioId === user.id);
                      if (yaRetro) return null;
                      return (
                        <div className="mt-2">
                          <form
                            onSubmit={e => {
                              e.preventDefault();
                              // Validación frontend
                              if (!retro[r.id] || retro[r.id].trim() === '') {
                                setToast({ show: true, message: 'La retroalimentación es obligatoria.', type: 'danger' });
                                return;
                              }
                              if (!nota[r.id] || isNaN(Number(nota[r.id]))) {
                                setToast({ show: true, message: 'La nota es obligatoria.', type: 'danger' });
                                return;
                              }
                              const notaVal = Number(nota[r.id]);
                              if (notaVal < 1 || notaVal > 5) {
                                setToast({ show: true, message: 'La nota debe ser un número entre 1 y 5.', type: 'danger' });
                                return;
                              }
                              handleRetroalimentar(r.id);
                            }}
                          >
                            <textarea
                              className="form-control mb-2"
                              placeholder="Escribe retroalimentación..."
                              value={retro[r.id] || ''}
                              onChange={e => setRetro({ ...retro, [r.id]: e.target.value })}
                              rows={2}
                              required
                            />
                            <input
                              className="form-control mb-2"
                              type="number"
                              min="1"
                              max="5"
                              step="0.01"
                              placeholder="Nota (1 a 5, decimales permitidos)"
                              value={nota[r.id] || ''}
                              onChange={e => {
                                let val = e.target.value;
                                // Limitar a máximo 5
                                if (val !== '' && Number(val) > 5) val = '5';
                                setNota({ ...nota, [r.id]: val });
                              }}
                              required
                            />
                            <button type="submit" className="btn btn-success btn-sm" disabled={loading}>
                              {loading ? 'Enviando...' : 'Enviar Retroalimentación'}
                            </button>
                          </form>
                        </div>
                      );
                    })()}
                  {Array.isArray(r.retroalimentaciones) && r.retroalimentaciones.length > 0 && (
                    <div className="mt-2 alert alert-info p-2">
                      <br /><strong>Retroalimentaciones:</strong>
                      <ul className="mb-0">
                        {r.retroalimentaciones.map((retro, idx) => {
                          const puedeEditar = user.rol === 'administrador' || retro.usuarioId === user.id;
                          return (
                            <li key={retro.id || idx}>
                              {editRetroId === retro.id ? (
                                <form
                                  className="d-inline"
                                  onSubmit={async e => {
                                    e.preventDefault();
                                    if (!editRetroText || editNota === '') {
                                      setToast({ show: true, message: 'Todos los campos son obligatorios', type: 'danger' });
                                      return;
                                    }
                                    if (Number(editNota) < 1 || Number(editNota) > 5) {
                                      setToast({ show: true, message: 'La nota debe ser entre 1 y 5', type: 'danger' });
                                      return;
                                    }
                                    setLoading(true);
                                    try {
                                      await respuestasActividadService.editarRetroalimentacion(retro.id, editRetroText, editNota);
                                      setToast({ show: true, message: 'Retroalimentación editada', type: 'success' });
                                      const res = await respuestasActividadService.obtenerRespuestasActividadPorRol(actividad.id, user);
                                      setRespuestas(res);
                                      setEditRetroId(null);
                                    } catch (err) {
                                      setToast({ show: true, message: 'Error al editar retroalimentación', type: 'danger' });
                                    }
                                    setLoading(false);
                                  }}
                                >
                                  <input
                                    className="form-control d-inline w-auto me-2"
                                    value={editRetroText}
                                    onChange={e => setEditRetroText(e.target.value)}
                                    required
                                  />
                                  <input
                                    className="form-control d-inline w-auto me-2"
                                    type="number"
                                    min="1"
                                    max="5"
                                    step="0.01"
                                    value={editNota}
                                    onChange={e => setEditNota(e.target.value)}
                                    required
                                  />
                                  <button type="submit" className="btn btn-success btn-sm me-1">Guardar</button>
                                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditRetroId(null)}>Cancelar</button>
                                </form>
                              ) : (
                                <>
                                  <span>{retro.retroalimentacion}</span>
                                  {retro.nota !== undefined && retro.nota !== null && (
                                    <span className="ms-2"><br /><strong>Nota:</strong> {retro.nota}</span>
                                  )}
                                  {puedeEditar && (
                                    <>
                                      <br /><button
                                        className="btn btn-outline-primary btn-sm ms-2"
                                        onClick={() => {
                                          setEditRetroId(retro.id);
                                          setEditRetroText(retro.retroalimentacion);
                                          setEditNota(retro.nota);
                                        }}
                                        disabled={loading}
                                      >Editar</button>
                                      <button
                                        className="btn btn-outline-danger btn-sm ms-1"
                                        onClick={async () => {
                                          if (!window.confirm('¿Seguro que deseas borrar esta retroalimentación?')) return;
                                          setLoading(true);
                                          try {
                                            await respuestasActividadService.borrarRetroalimentacion(retro.id);
                                            setToast({ show: true, message: 'Retroalimentación eliminada', type: 'success' });
                                            const res = await respuestasActividadService.obtenerRespuestasActividadPorRol(actividad.id, user);
                                            setRespuestas(res);
                                          } catch (err) {
                                            setToast({ show: true, message: 'Error al borrar retroalimentación', type: 'danger' });
                                          }
                                          setLoading(false);
                                        }}
                                        disabled={loading}
                                      >Borrar</button>
                                    </>
                                  )}
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerRespuestasActividad;
