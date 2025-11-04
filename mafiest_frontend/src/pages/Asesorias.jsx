import React, { useEffect, useState } from 'react';
import asesoriasService from '../services/asesorias';
import Navbar from '../components/Navbar';
import ToastNotification from '../components/Notification';
import AsesoriaCard from '../components/AsesoriaCard';

const Asesorias = ({ user, setUser }) => {
  const [asesorias, setAsesorias] = useState([]);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('list');
  const [successMsg, setSuccessMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [form, setForm] = useState({ titulo: '', descripcion: '' });
  const [showTitulo, setShowTitulo] = useState(false);
  const [showDocente, setShowDocente] = useState(false);
  const [showEstado, setShowEstado] = useState(false);
  const [showFecha, setShowFecha] = useState(false);
  const [filtroTitulo, setFiltroTitulo] = useState("");
  const [filtroDocente, setFiltroDocente] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  // Filtrado visual frontend (no toca lógica de obtención)
  const asesoriasFiltradas = React.useMemo(() => {
    let filtradas = asesorias;
    if (filtroTitulo.trim()) {
      filtradas = filtradas.filter(a => (a.titulo || "").toLowerCase().includes(filtroTitulo.trim().toLowerCase()));
    }
    if (filtroDocente.trim()) {
      filtradas = filtradas.filter(a => (a.docente?.nombre || "").toLowerCase().includes(filtroDocente.trim().toLowerCase()));
    }
    if (filtroEstado.trim()) {
      filtradas = filtradas.filter(a => (a.estado || "").toLowerCase().includes(filtroEstado.trim().toLowerCase()));
    }
    if (filtroFecha.trim()) {
      filtradas = filtradas.filter(a => {
        if (!a.fecha) return false;
        let fecha;
        if (typeof a.fecha === 'string') {
          fecha = new Date(a.fecha);
        } else if (a.fecha instanceof Date) {
          fecha = a.fecha;
        } else {
          return false;
        }
        if (isNaN(fecha.getTime())) return false;
        const fechaStr = fecha.toISOString().slice(0,10);
        const filtroStr = filtroFecha.slice(0,10);
        return fechaStr === filtroStr;
      });
    }
    return filtradas;
  }, [asesorias, filtroTitulo, filtroDocente, filtroEstado, filtroFecha]);

  // Paginación visual
  const [currentPage, setCurrentPage] = useState(1);
  const asesoriasPorPagina = 4;
  const totalPages = Math.ceil(asesoriasFiltradas.length / asesoriasPorPagina);
  const paginatedAsesorias = asesoriasFiltradas.slice((currentPage - 1) * asesoriasPorPagina, currentPage * asesoriasPorPagina);

  // Abrir modal de edición

  useEffect(() => {
    if (user?.token) {
      asesoriasService.setToken(user.token);
    }
    const fetchAsesorias = async () => {
      try {
        let data = [];
        if (user?.rol === 'administrador') {
          data = await asesoriasService.getAll();
          setAsesorias(data);
        } else {
          // Para otros roles, obtener solicitudes y luego las asesorías completas
          const solicitudes = await asesoriasService.getMisAsesorias();
          // Para cada solicitud con asesoriaId, buscar la asesoría completa
          const asesoriasCompletas = await Promise.all(solicitudes.map(async solicitud => {
            if (solicitud.asesoriaId) {
              try {
                const res = await fetch(`/api/asesorias/${solicitud.asesoriaId}`, {
                  headers: { Authorization: user?.token ? `Bearer ${user.token}` : undefined }
                });
                if (!res.ok) {
                  // Si no se puede obtener la asesoría, mostrar la solicitud como pendiente
                  return {
                    id: solicitud.id,
                    titulo: solicitud.titulo,
                    descripcion: solicitud.descripcion,
                    estado: 'pendiente',
                    fecha: null,
                    horaInicio: null,
                    horaFin: null,
                    lugar: null,
                    precio: null,
                    docente: null
                  };
                }
                const asesoria = await res.json();
                // Devuelve la asesoría programada pero mantiene el id de la solicitud para que no se pierda en la lista
                return { ...asesoria, id: solicitud.id, estado: asesoria.estado || 'programada' };
              } catch {
                // Si hay error, mostrar la solicitud como pendiente
                return {
                  id: solicitud.id,
                  titulo: solicitud.titulo,
                  descripcion: solicitud.descripcion,
                  estado: 'pendiente',
                  fecha: null,
                  horaInicio: null,
                  horaFin: null,
                  lugar: null,
                  precio: null,
                  docente: null
                };
              }
            } else {
              // Retornar la solicitud pendiente con un estado especial
              return {
                id: solicitud.id,
                titulo: solicitud.titulo,
                descripcion: solicitud.descripcion,
                estado: 'pendiente',
                fecha: null,
                horaInicio: null,
                horaFin: null,
                lugar: null,
                precio: null,
                docente: null
              };
            }
          }));
          setAsesorias(asesoriasCompletas);
        }
      } catch (err) {
        setError('No se pudieron cargar las asesorías');
      }
    };
    fetchAsesorias();
  }, [user]);

  // Eliminar asesoría

  return (
    <>
      <Navbar user={user} setUser={setUser} />
      <div className="container gestion-container" style={{display:'flex',flexDirection:'row',alignItems:'flex-start',gap:'2.5rem', marginLeft:'0', paddingLeft:'2.5rem', paddingRight:'2.5rem', boxSizing:'border-box'}}>
        {/* Sidebar de filtros, solo visible en vista de lista */}
        {activeView === 'list' && (
          <div className="grabaciones-filtros-container card" style={{ minWidth: 320, maxWidth: 340, marginLeft: '1.5rem', marginTop: '2.5rem', padding: '1.5rem', boxSizing:'border-box', display:'flex', flexDirection:'column', gap:'1.2rem' }}>
            <div className="grabaciones-filtros-titulo">Filtros <span style={{color:'#3fa6ff',fontWeight:700}}>de búsqueda</span></div>
            {/* Input de título arriba, sin botón */}
            <input type="text" className="form-control grabaciones-filtros-busqueda" placeholder="Buscar título..." value={filtroTitulo} onChange={e => setFiltroTitulo(e.target.value)} style={{marginBottom:'1.2rem'}} />
            <div className="grabaciones-filtros-lista">
              {/* Docente */}
              <div className="filtro-item" onClick={() => setShowDocente(prev => !prev)}>
                <button type="button" className="btn btn-outline-light w-100 boton-filtro">Docente</button>
                {showDocente && (
                  <input type="text" className="form-control mt-2" placeholder="Buscar docente..." value={filtroDocente} onChange={e => setFiltroDocente(e.target.value)} onClick={e => e.stopPropagation()} />
                )}
              </div>
              {/* Estado */}
              <div className="filtro-item" onClick={() => setShowEstado(prev => !prev)}>
                <button type="button" className="btn btn-outline-light w-100 boton-filtro">Estado</button>
                {showEstado && (
                  <input type="text" className="form-control mt-2" placeholder="Buscar estado..." value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} onClick={e => e.stopPropagation()} />
                )}
              </div>
              {/* Fecha */}
              <button type="button" className="btn btn-outline-light w-100 boton-filtro" onClick={e => { e.preventDefault(); e.stopPropagation(); setShowFecha(prev => !prev); }}>
                <i className="fas fa-calendar-alt"></i> Fecha
              </button>
              {showFecha && (
                <div className="grabaciones-filtros-dropdown" style={{marginTop:'0.5rem'}}>
                  <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className="grabaciones-filtros-busqueda-fecha" />
                </div>
              )}
            </div>
          </div>
        )}
        {/* Card principal */}
        <div className="card" style={{flex:1,minWidth:0, marginLeft:'0', padding:'1.5rem 1.5rem 1.5rem 0', borderRadius:'18px', background:'rgba(24, 32, 54, 0.98)', color:'#b6c2e2', boxShadow:'0 2px 16px #00000022', boxSizing:'border-box'}}>
          {/* H1 y botones dentro del card, igual que Actividades, con separación */}
          <div style={{width:'100%',textAlign:'center',margin:'2rem 0'}}>
            {user?.rol === 'administrador' ? (
              <h1 style={{fontWeight:'bold',fontSize:'2rem',color:'#fff',marginBottom:'1.5rem'}}>Gestión de Asesorías</h1>
            ) : (user?.rol === 'estudiante' || user?.rol === 'independiente') ? (
              <h1 style={{fontWeight:'bold',fontSize:'2rem',color:'#fff',marginBottom:'1.5rem'}}>Mis Asesorías</h1>
            ) : null}
            <div className="btn-group w-100 mb-4" style={{justifyContent:'center',display:'flex',gap:'2rem',marginBottom:'2rem'}}>
              <button 
                className={`btn ${activeView === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setActiveView('list')}
              >
                Ver Asesorías
              </button>
              {user && (user.rol === 'docente' || user.rol === 'administrador') ? (
                <button 
                  className={`btn ${activeView === 'respond' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveView('respond')}
                >
                  Responder Solicitudes
                </button>
              ) : (
                <button 
                  className={`btn ${activeView === 'request' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveView('request')}
                >
                  Solicitar Asesoría
                </button>
              )}
            </div>
          </div>
          {/* Formulario de solicitar asesoría SOLO dentro del card principal */}
          {activeView === 'request' && (user.rol === 'estudiante' || user.rol === 'independiente') ? (
            <div style={{width:'100%',marginBottom:'2rem',background:'rgba(24, 32, 54, 0.98)',borderRadius:'18px',padding:'2.2rem 1.2rem 2rem 1.2rem',boxShadow:'0 2px 16px #00000022',color:'#b6c2e2'}}>
              <h3 className="text-center" style={{width:'100%',textAlign:'center',fontWeight:'bold',fontSize:'1.5rem'}}>Solicitar Asesoría</h3>
              <ToastNotification
                show={showToast}
                message={successMsg}
                type="success"
                onClose={() => setShowToast(false)}
              />
              <form onSubmit={async e => {
                e.preventDefault();
                try {
                  await asesoriasService.solicitar({
                    titulo: form.titulo,
                    descripcion: form.descripcion,
                  });
                  setSuccessMsg('¡Solicitud de asesoría enviada exitosamente!');
                  setShowToast(true);
                  setForm({ titulo: '', descripcion: '' });
                } catch (err) {
                  setError('No se pudo enviar la solicitud.');
                }
              }}>
                <div className="mb-3">
                  <label htmlFor="titulo" className="form-label">Título</label>
                  <input type="text" className="form-control" id="titulo" placeholder="Título de la asesoría" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="descripcion" className="form-label">Descripción</label>
                  <textarea className="form-control" id="descripcion" rows="3" placeholder="Describe tu consulta" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} required></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Enviar Solicitud</button>
              </form>
            </div>
          ) : (
            <>
              <h3 className="text-center" style={{width:'100%',textAlign:'center',fontWeight:'bold',fontSize:'1.5rem',marginBottom:'2.5rem',color:'#fff'}}>Lista de Asesorías</h3>
                {error && <div className="alert alert-danger">{error}</div>}
                {asesoriasFiltradas.length === 0 ? (
                  <p className="text-muted" style={{textAlign:'center', color:'#fff'}}>No hay asesorías disponibles.</p>
                ) : (
                  <>
                    <div className="row">
                      {paginatedAsesorias.map(asesoria => (
                        <div key={asesoria.id} className="col-md-6 mb-4">
                          <AsesoriaCard 
                            asesoria={asesoria} 
                            user={user}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              {/* Paginación visual igual a MisNotas */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-dark" style={{minWidth:40, fontWeight:600, background:'#10182b', color:'#3fa6ff', border:'1px solid #3fa6ff', borderRadius:8}} onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>{'<'}</button>
                  {Array.from({ length: totalPages }, (_, idx) => (
                    <button key={idx + 1} className={`btn ${currentPage === idx + 1 ? 'btn-primary' : 'btn-dark'}`} style={{margin:'0 0.2rem', minWidth:40, fontWeight:600, background: currentPage === idx + 1 ? '#3fa6ff' : '#10182b', color: currentPage === idx + 1 ? '#fff' : '#3fa6ff', border: currentPage === idx + 1 ? 'none' : '1px solid #3fa6ff', borderRadius:8, boxShadow: currentPage === idx + 1 ? '0 2px 8px #3fa6ff44' : 'none'}} onClick={() => setCurrentPage(idx + 1)}>{idx + 1}</button>
                  ))}
                  <button type="button" className="btn btn-dark" style={{minWidth:40, fontWeight:600, background:'#10182b', color:'#3fa6ff', border:'1px solid #3fa6ff', borderRadius:8}} onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>{'>'}</button>
                </div>
              </div>
              {/* Modal de edición de asesoría */}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Asesorias;
