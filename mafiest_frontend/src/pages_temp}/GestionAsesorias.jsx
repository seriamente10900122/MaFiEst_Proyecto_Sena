import { useState, useEffect } from 'react';
import ToastNotification from '../components/Notification';
import { useNavigate } from 'react-router-dom';
import asesoriaService from '../services/asesorias';
import userService from '../services/user';
import Navbar from '../components/Navbar';
import '../styles/gestion-asesorias.css';


const GestionAsesorias = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [asesorias, setAsesorias] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [filtro, setFiltro] = useState('todas');
  const [nombreDocente, setNombreDocente] = useState('');
  const [docentes, setDocentes] = useState([]);
  const [nuevaAsesoria, setNuevaAsesoria] = useState({ titulo: '', descripcion: '', fecha: '', horaInicio: '', horaFin: '', lugar: '', precio: '' });
  const [asignarForm, setAsignarForm] = useState({ fecha: '', horaInicio: '', horaFin: '', lugar: '', precio: '', docenteNombre: '' });
  const [showAsignarId, setShowAsignarId] = useState(null);

  // Permitir edición inline de asesorías
  const handleEditClick = (asesoriaId) => {
    setAsesorias(asesorias.map(a => a.id === asesoriaId ? { ...a, editando: true } : a));
  };

  const handleEditChange = (asesoriaId, field, value) => {
    setAsesorias(asesorias.map(a => a.id === asesoriaId ? { ...a, [field]: value } : a));
  };

  const handleEditCancel = (asesoriaId) => {
    setAsesorias(asesorias.map(a => a.id === asesoriaId ? { ...a, editando: false } : a));
  };

  const handleEditSave = async (asesoriaId) => {
    const asesoria = asesorias.find(a => a.id === asesoriaId);
    // Validación: no permitir cruce de horario con el mismo docente, fecha y hora (excepto la misma asesoria)
    const conflicto = asesorias.some(a =>
      a.id !== asesoriaId &&
      ((a.docente && a.docente.nombre === (asesoria.docente?.nombre || asesoria.docenteNombre)) || (a.docenteNombre === asesoria.docenteNombre)) &&
      a.fecha === asesoria.fecha &&
      a.horaInicio === asesoria.horaInicio &&
      a.horaFin === asesoria.horaFin
    );
    if (conflicto) {
      setToast({ show: true, message: 'Ya existe una asesoría programada con este docente en esa fecha y hora.', type: 'danger' });
      return;
    }
    try {
      await asesoriaService.update(asesoriaId, asesoria);
      setToast({ show: true, message: 'Asesoría actualizada', type: 'success' });
      const asesoriasList = await asesoriaService.getAll();
      setAsesorias(asesoriasList);
    } catch (err) {
      let backendMsg = 'Error al actualizar la asesoría';
      if (err.response && err.response.data && err.response.data.error) {
        backendMsg = err.response.data.error;
      }
      setToast({ show: true, message: backendMsg, type: 'danger' });
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchAsesorias = async () => {
      try {
        setLoading(true);
        let asesoriasList = [];
        if (user.rol === 'independiente') {
          asesoriasList = await asesoriaService.getMisAsesorias();
          setAsesorias(asesoriasList);
          setPendientes([]);
        } else {
          asesoriasList = await asesoriaService.getAll();
          setAsesorias(asesoriasList);
          const pendientesList = await asesoriaService.getPendientes();
          setPendientes(pendientesList);
        }
        setError(null);
      } catch (err) {
        setError('No se pudieron cargar las asesorías. Por favor, intente más tarde.');
      } finally {
        setLoading(false);
      }
    };

    const fetchDocentes = async () => {
      try {
        const usuarios = await userService.getAll();
        setDocentes(usuarios.filter(u => u.rol === 'docente'));
      } catch (err) {
        setDocentes([]);
      }
    };

    fetchAsesorias();
    fetchDocentes();
  }, [user, navigate]);

  // Mostrar formulario de solicitud para estudiante e independiente
  const mostrarFormularioSolicitud = user && (user.rol === 'estudiante' || user.rol === 'independiente');

  if (loading) {
    return (
      <div>
        <Navbar user={user} setUser={setUser} />
        <div className="container mt-4">
          <div className="text-center">Cargando...</div>
        </div>
      </div>
    );
  }


  // Ya no retornamos la pantalla de error, solo mostramos el toast

  const handleResponder = async (id, respuesta) => {
    try {
      await asesoriaService.responder(id, respuesta);
      const asesoriasList = await asesoriaService.getAll();
      setAsesorias(asesoriasList);
      setError(null);
    } catch (err) {
      console.error('Error al responder asesoria:', err);
      setError('Error al responder la asesoria.');
    }
  };


  let asesoriasFiltradas = asesorias;
  if (filtro === 'pendiente') {
    asesoriasFiltradas = asesorias.filter(a => a.estado === 'pendiente');
  } else if (filtro === 'programada') {
    asesoriasFiltradas = asesorias.filter(a => a.estado === 'programada');
  }

  // Mostrar solicitudes pendientes solo si el filtro es 'pendiente'
  const mostrarSolicitudesPendientes = filtro === 'pendiente';
  // Asignar asesoría a solicitud pendiente
  const handleAsignar = async (solicitudId) => {
    // Validación: no permitir cruce de horario con el mismo docente
    const { fecha, horaInicio, horaFin, docenteNombre } = asignarForm;
    const docente = docentes.find(d => d.nombre === docenteNombre);
    if (!docente) {
      setToast({ show: true, message: 'Debes seleccionar un docente válido.', type: 'danger' });
      return;
    }
    // Buscar si ya existe una asesoria programada con ese docente, fecha y hora
    const conflicto = asesorias.some(a =>
      a.docente && (a.docente.nombre === docenteNombre || a.docenteNombre === docenteNombre)
      && a.fecha === fecha
      && a.horaInicio === horaInicio
      && a.horaFin === horaFin
    );
    if (conflicto) {
      setToast({ show: true, message: 'Ya existe una asesoría programada con este docente en esa fecha y hora.', type: 'danger' });
      return;
    }
    try {
      const { grupoId, ...formData } = asignarForm;
      await asesoriaService.asignar(solicitudId, formData);
      setAsignarForm({ fecha: '', horaInicio: '', horaFin: '', lugar: '', precio: '', docenteNombre: '' });
      setShowAsignarId(null);
      const pendientesList = await asesoriaService.getPendientes();
      setPendientes(pendientesList);
      const asesoriasList = await asesoriaService.getAll();
      setAsesorias(asesoriasList);
      setError(null);
      setToast({ show: true, message: '¡Asesoría programada exitosamente!', type: 'success' });
    } catch (err) {
      let backendMsg = 'Error al programar la asesoría';
      if (err.response && err.response.data && err.response.data.error) {
        backendMsg = err.response.data.error;
      }
      setError(backendMsg);
      setToast({ show: true, message: backendMsg, type: 'danger' });
    }
  };
  return (
    <div>
      <Navbar user={user} setUser={setUser} />
      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      <ToastNotification position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
      <div className="container mt-4">
        <h1 className="text-center" style={{width:'100%',textAlign:'center',fontWeight:'bold',fontSize:'2rem',margin:'2rem 0',color:'#fff'}}>Gestión de Asesorías</h1>

        {/* Formulario para solicitar asesoría solo para estudiante e independiente */}
        {mostrarFormularioSolicitud && (
          <div className="mb-4">
            <h3>Solicitar Asesoría</h3>
            <form onSubmit={async e => {
              e.preventDefault();
              try {
                await asesoriaService.solicitar({ titulo: nuevaAsesoria.titulo, descripcion: nuevaAsesoria.descripcion });
                setToast({ show: true, message: 'Solicitud enviada', type: 'success' });
                setNuevaAsesoria({ titulo: '', descripcion: '', fecha: '', horaInicio: '', horaFin: '', lugar: '', precio: '' });
              } catch (err) {
                setToast({ show: true, message: 'Error al solicitar la asesoría', type: 'error' });
              }
            }}>
              <input type="text" className="form-control mb-2" placeholder="Título" value={nuevaAsesoria.titulo} onChange={e => setNuevaAsesoria({ ...nuevaAsesoria, titulo: e.target.value })} required />
              <textarea className="form-control mb-2" placeholder="Descripción" value={nuevaAsesoria.descripcion} onChange={e => setNuevaAsesoria({ ...nuevaAsesoria, descripcion: e.target.value })} required />
              <input type="date" className="form-control mb-2" placeholder="Fecha" value={nuevaAsesoria.fecha} onChange={e => setNuevaAsesoria({ ...nuevaAsesoria, fecha: e.target.value })} required />
              <input type="time" className="form-control mb-2" placeholder="Hora inicio" value={nuevaAsesoria.horaInicio} onChange={e => setNuevaAsesoria({ ...nuevaAsesoria, horaInicio: e.target.value })} required />
              <input type="time" className="form-control mb-2" placeholder="Hora fin" value={nuevaAsesoria.horaFin} onChange={e => setNuevaAsesoria({ ...nuevaAsesoria, horaFin: e.target.value })} required />
              <input type="text" className="form-control mb-2" placeholder="Lugar" value={nuevaAsesoria.lugar} onChange={e => setNuevaAsesoria({ ...nuevaAsesoria, lugar: e.target.value })} required />
              <input type="number" className="form-control mb-2" placeholder="Precio" value={nuevaAsesoria.precio} onChange={e => setNuevaAsesoria({ ...nuevaAsesoria, precio: e.target.value })} required />
              <button type="submit" className="btn btn-primary">Solicitar Asesoría</button>
            </form>
          </div>
        )}

        <div className="mb-4">
          <div className="btn-group">
            <button
              className={`btn ${filtro === 'pendiente' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFiltro('pendiente')}
            >
              Solicitadas
            </button>
            <button
              className={`btn ${filtro === 'programada' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFiltro('programada')}
            >
              Programadas
            </button>
          </div>
        </div>
        {mostrarSolicitudesPendientes && (
          <div className="container min-vh-100 general card" style={{ 
            minHeight: "80vh",
            maxWidth: '1400px', margin: '64px 64px', padding: '32px 32px',
          }}>
            <h3 className="text-center" style={{width:'100%',textAlign:'center',fontWeight:'bold',fontSize:'1.5rem',color:'#fff',marginBottom:'2rem'}}>Solicitudes pendientes de asesoría</h3>
            {pendientes.length === 0 ? (
              <p className="text-center" style={{color:"#fff", textAlign:"center"}}>No hay solicitudes pendientes para mostrar</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "2rem",
                  width: "100%",
                  margin: "0 auto 2rem auto",
                  justifyItems: "center",
                  padding: "1rem"
                }}
              >
                {pendientes.map(solicitud => (
                  <div key={solicitud.id} style={{ width: "100%" }}>
                    <div className="card shadow-sm w-100 asesoria-card-animada" style={{
                          borderRadius: "16px",
                          border: "1.5px solid #232b47",
                          transition:
                            "transform 0.3s cubic-bezier(.25,.8,.25,1), box-shadow 0.3s",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                        }}
                      >
                        <div className="card-body">
                          <h5 className="card-title"><strong>Título:</strong>{solicitud.titulo}</h5>
                          <p className="card-text"><strong>Descripción:</strong> {solicitud.descripcion}</p>
                          <p className="card-text"><strong>Solicitante ID:</strong> {solicitud.userId}</p>
                          <p className="card-text"><strong>Fecha solicitud:</strong> {
                          (() => {
                            const fechaStr = solicitud.createdAt.substring(0,10);
                            const [y, m, d] = fechaStr.split('-');
                            return `${d}/${m}/${y}`;
                          })()
                        }</p>
                        <button className="btn btn-success" onClick={() => setShowAsignarId(solicitud.id)} style={{marginTop:"8px"}}>Programar asesoría</button>
                        {showAsignarId === solicitud.id && (
                          <form className="mt-3" onSubmit={e => { e.preventDefault(); handleAsignar(solicitud.id); }}>
                            <input type="date" className="form-control mb-2" placeholder="Fecha" value={asignarForm.fecha} onChange={e => setAsignarForm({ ...asignarForm, fecha: e.target.value })} required />
                            <input type="time" className="form-control mb-2" placeholder="Hora inicio" value={asignarForm.horaInicio} onChange={e => setAsignarForm({ ...asignarForm, horaInicio: e.target.value })} required />
                            <input type="time" className="form-control mb-2" placeholder="Hora fin" value={asignarForm.horaFin} onChange={e => setAsignarForm({ ...asignarForm, horaFin: e.target.value })} required />
                            <input type="text" className="form-control mb-2" placeholder="Lugar" value={asignarForm.lugar || ''} onChange={e => setAsignarForm({ ...asignarForm, lugar: e.target.value })} required />
                            <input type="number" className="form-control mb-2" placeholder="Precio" value={asignarForm.precio} onChange={e => setAsignarForm({ ...asignarForm, precio: e.target.value })} required />
                            <select className="form-control mb-2" value={asignarForm.docenteNombre} onChange={e => setAsignarForm({ ...asignarForm, docenteNombre: e.target.value })} required>
                              <option value="">Selecciona un docente</option>
                              {docentes.map(docente => (
                                <option key={docente.id} value={docente.nombre}>{docente.nombre}</option>
                              ))}
                            </select>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                              <button type="submit" className="btn btn-primary" style={{ flex: 1, minWidth: 0 }}>Asignar y programar</button>
                              <button type="button" className="btn btn-secondary" style={{ flex: 1, minWidth: 0 }} onClick={() => setShowAsignarId(null)}>Cancelar</button>
                            </div>
                          </form>
                        )}
                    <style>{`
                      .asesoria-card-animada:hover {
                        transform: translateY(-1px) scale(1.04);
                        box-shadow: 0 12px 32px rgba(63,166,255,0.25), 0 2px 8px rgba(0,0,0,0.10);
                        border-color: #3fa6ff;
                      }
                    `}</style>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {filtro !== 'pendiente' && (
          <>
            <div className="container min-vh-100 general card" style={{ 
                minHeight: "80vh",
                maxWidth: '1400px', margin: '64px 64px', padding: '32px 32px',
              }}>
              <h3 className="text-center" style={{width:'100%',textAlign:'center',fontWeight:'bold',fontSize:'1.5rem',color:'#fff',marginBottom:'2rem'}}>Lista de Asesorías programadas</h3>
              {asesoriasFiltradas.length === 0 ? (
                <p className="text-center" style={{width:'100%',textAlign:'center',fontWeight:'bold',fontSize:'1.5rem',color:'#fff'}}>No hay asesorías {filtro !== 'todas' ? `${filtro}s` : ''} para mostrar</p>
              ) : (
                <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "2rem",
                  width: "95%",
                  margin: "0 auto 2rem auto",
                  justifyItems: "center",
                  padding: "1rem"
                }}
              >
                {asesoriasFiltradas.map((asesoria) => (
                  <div key={asesoria.id} style={{ width: "100%" }}>
                    <div
                      className="card shadow-sm w-100 asesoria-card-animada"
                      style={{
                        borderRadius: "16px",
                        border: "1.5px solid #232b47",
                        transition:
                          "transform 0.3s cubic-bezier(.25,.8,.25,1), box-shadow 0.3s",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                      }}
                    >
                      <div className="card-body">
                        {asesoria.editando ? (
                          <form onSubmit={e => { e.preventDefault(); handleEditSave(asesoria.id); }}>
                            <div className="mb-2">
                              <label style={{color:"#fff"}}>Título</label>
                              <input type="text" className="form-control" value={asesoria.titulo || ''} onChange={e => handleEditChange(asesoria.id, 'titulo', e.target.value)} />
                            </div>
                            <div className="mb-2">
                              <label style={{color:"#fff"}}>Descripción</label>
                              <textarea className="form-control" value={asesoria.descripcion || ''} onChange={e => handleEditChange(asesoria.id, 'descripcion', e.target.value)} />
                            </div>
                            <div className="mb-2">
                              <label style={{color:"#fff"}}>Fecha</label>
                              <input type="date" className="form-control" value={asesoria.fecha || ''} onChange={e => handleEditChange(asesoria.id, 'fecha', e.target.value)} />
                            </div>
                            <div className="mb-2">
                              <label style={{color:"#fff"}}>Hora Inicio</label>
                              <input type="time" className="form-control" value={asesoria.horaInicio || ''} onChange={e => handleEditChange(asesoria.id, 'horaInicio', e.target.value)} />
                            </div>
                            <div className="mb-2">
                              <label style={{color:"#fff"}}>Hora Fin</label>
                              <input type="time" className="form-control" value={asesoria.horaFin || ''} onChange={e => handleEditChange(asesoria.id, 'horaFin', e.target.value)} />
                            </div>
                            <div className="mb-2">
                              <label style={{color:"#fff"}}>Lugar</label>
                              <input type="text" className="form-control" value={asesoria.lugar || ''} onChange={e => handleEditChange(asesoria.id, 'lugar', e.target.value)} />
                            </div>
                            <div className="mb-2">
                              <label style={{color:"#fff"}}>Precio</label>
                              <input type="number" className="form-control" value={asesoria.precio || ''} onChange={e => handleEditChange(asesoria.id, 'precio', e.target.value)} />
                            </div>
                            <div className="d-flex justify-content-end gap-2 mt-3">
                              <button type="button" className="btn btn-secondary" onClick={() => handleEditCancel(asesoria.id)}>Cancelar</button>
                              <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <p className="card-text">
                              <strong>Titulo: </strong>
                                {asesoria.tema || asesoria.titulo}
                            </p>
                            <p className="card-text">
                              <strong>Usuario:</strong> {
                                asesoria.estudiante && typeof asesoria.estudiante === 'object'
                                  ? [asesoria.estudiante?.nombre].filter(Boolean).join(' - ') || 'Sin nombre'
                                  : (asesoria.estudiante || 'Sin nombre')
                              } {'(' + (asesoria.estudiante?.rol || asesoria.rol || 'Sin rol') + ')'}
                            </p>
                            <p className="card-text">
                              <strong>Email:</strong> {
                                asesoria.estudiante && typeof asesoria.estudiante === 'object'
                                  ? asesoria.estudiante?.email || 'Sin email'
                                  : (asesoria.email || 'Sin email')
                              }
                            </p>
                            <p className="card-text">
                              <strong>Precio:</strong> {asesoria.precio ? `$${asesoria.precio}` : 'No asignado'}
                            </p>
                            <p className="card-text">
                              <strong>Fecha:</strong> {
                                asesoria.fecha && /^\d{4}-\d{2}-\d{2}/.test(asesoria.fecha)
                                  ? (() => {
                                      // Convertimos la fecha directamente desde el string YYYY-MM-DD
                                      const [y, m, d] = asesoria.fecha.substring(0,10).split('-');
                                      return `${d}/${m}/${y}`;
                                    })()
                                  : (asesoria.fecha || '')
                              }
                            </p>
                            <p className="card-text">
                              <strong>Hora:</strong> {asesoria.horaInicio ? asesoria.horaInicio : 'Sin hora'}
                              {asesoria.horaFin ? ` - ${asesoria.horaFin}` : ''}
                            </p>
                            <p className="card-text">
                              <strong>Lugar:</strong> {asesoria.lugar ? asesoria.lugar : 'Sin lugar'}
                            </p>
                            <p className="card-text">
                              <strong>Docente:</strong> {typeof asesoria.docente === 'object' ? asesoria.docente?.nombre || 'No asignado' : (asesoria.docenteNombre || asesoria.docente || 'No asignado')}
                            </p>
                            <p className="card-text">
                              <strong>Estado:</strong>{' '}
                              <span className={`badge ${asesoria.estado === 'pendiente' ? 'bg-warning' : asesoria.estado === 'cancelada' ? 'bg-danger' : 'bg-success'}`}>
                                {asesoria.estado}
                              </span>
                            </p><br />
                          </>
                        )}
                        {(user.rol === 'administrador' || user.rol === 'docente') && (
                          <div className="d-flex flex-row align-items-center gap-3 mt-2" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                            {!asesoria.editando && (
                              <button className="btn btn-primary btn-sm" style={{ fontWeight: 600, borderRadius: '6px', minWidth: '60px', padding: '4px 12px', fontSize: '0.95rem', display: 'inline-block', marginRight: '8px' }} onClick={() => handleEditClick(asesoria.id)}>
                                Editar
                              </button>
                            )}
                            <button className="btn btn-primary btn-sm" style={{ fontWeight: 600, borderRadius: '6px', minWidth: '60px', padding: '4px 12px', fontSize: '0.95rem', display: 'inline-block' }} onClick={async () => {
                              if (window.confirm('¿Estás seguro de que deseas eliminar esta asesoría?')) {
                                try {
                                  await asesoriaService.remove(asesoria.id);
                                  setToast({ show: true, message: 'Asesoría eliminada', type: 'success' });
                                  const asesoriasList = await asesoriaService.getAll();
                                  setAsesorias(asesoriasList);
                                } catch (err) {
                                  setToast({ show: true, message: 'Error al eliminar la asesoría', type: 'error' });
                                }
                              }
                            }}>
                              Eliminar
                            </button>
                          </div>
                        )}
                        {asesoria.estado === 'pendiente' && (
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              const respuesta = window.prompt('Ingrese la respuesta para la asesoría:');
                              if (respuesta) {
                                handleResponder(asesoria.id, respuesta);
                              }
                            }}
                          >
                            Responder
                          </button>
                        )}
                        {asesoria.estado === 'programada' && asesoria.respuesta && (
                          <div className="mt-3">
                            <strong>Respuesta:</strong>
                            <p>{asesoria.respuesta}</p>
                          </div>
                        )}
                    <style>{`
                      .asesoria-card-animada:hover {
                        transform: translateY(-1px) scale(1.04);
                        box-shadow: 0 12px 32px rgba(63,166,255,0.25), 0 2px 8px rgba(0,0,0,0.10);
                        border-color: #3fa6ff;
                      }
                    `}</style>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GestionAsesorias;
