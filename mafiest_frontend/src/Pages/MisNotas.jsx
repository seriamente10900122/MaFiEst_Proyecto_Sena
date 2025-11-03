import React, { useEffect, useState } from 'react';
import respuestasActividadService from '../services/respuestasActividad';
import Toast from '../components/Notification';
import Navbar from '../components/Navbar';


const MisNotas = ({ user, setUser }) => {
  // Estados para mostrar/ocultar inputs de filtro
  const [showActividad, setShowActividad] = useState(false);
  const [showRetro, setShowRetro] = useState(false);
  const [showNota, setShowNota] = useState(false);
  const [showFecha, setShowFecha] = useState(false);
  const [respuestas, setRespuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'danger' });

  useEffect(() => {
    const fetchRespuestas = async () => {
      try {
        let todas = [];
        if (user && (user.rol === 'administrador' || user.rol === 'docente')) {
          todas = await respuestasActividadService.obtenerTodasRespuestas();
        } else {
          todas = await respuestasActividadService.obtenerMisRespuestas();
        }
        setRespuestas(todas);
      } catch (err) {
        setToast({ show: true, message: 'Error al obtener tus respuestas', type: 'danger' });
      }
      setLoading(false);
    };
    if (user) fetchRespuestas();
  }, [user]);

  // Filtros de notas
  const [filtroActividad, setFiltroActividad] = useState("");
  const [filtroRetro, setFiltroRetro] = useState("");
  const [filtroNota, setFiltroNota] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  // Filtrar solo la última respuesta por actividad
  const respuestasFiltradas = React.useMemo(() => {
    if (!Array.isArray(respuestas)) return [];
    const map = new Map();
    respuestas.forEach(r => {
      const actividadId = r.actividadId || (r.actividad && r.actividad.id);
      if (!actividadId) return;
      if (!map.has(actividadId) || new Date(r.createdAt) > new Date(map.get(actividadId).createdAt)) {
        map.set(actividadId, r);
      }
    });
    let filtradas = Array.from(map.values());
    // Filtro por actividad
    if (filtroActividad.trim()) {
      filtradas = filtradas.filter(r => (r.actividad?.titulo || "").toLowerCase().includes(filtroActividad.trim().toLowerCase()));
    }
    // Filtro por retroalimentación
    if (filtroRetro.trim()) {
      filtradas = filtradas.filter(r =>
        Array.isArray(r.retroalimentaciones) && r.retroalimentaciones.some(retro =>
          (retro.retroalimentacion || "").toLowerCase().includes(filtroRetro.trim().toLowerCase())
        )
      );
    }
    // Filtro por nota (busca en retroalimentaciones.nota)
    if (filtroNota.trim()) {
      const val = filtroNota.trim();
      filtradas = filtradas.filter(r => {
        if (!Array.isArray(r.retroalimentaciones) || r.retroalimentaciones.length === 0) return false;
        return r.retroalimentaciones.some(retro => {
          let nota = retro.nota;
          if (typeof nota !== 'number') nota = Number(nota);
          if (isNaN(nota)) return false;
          if (/^>=\s*\d+(\.\d+)?$/.test(val)) {
            return nota >= parseFloat(val.replace('>=','').trim());
          }
          if (/^<=\s*\d+(\.\d+)?$/.test(val)) {
            return nota <= parseFloat(val.replace('<=','').trim());
          }
          if (/^>\s*\d+(\.\d+)?$/.test(val)) {
            return nota > parseFloat(val.replace('>','').trim());
          }
          if (/^<\s*\d+(\.\d+)?$/.test(val)) {
            return nota < parseFloat(val.replace('<','').trim());
          }
          if (/^\d+(\.\d+)?-\d+(\.\d+)?$/.test(val)) {
            const [min, max] = val.split('-').map(Number);
            return nota >= min && nota <= max;
          }
          if (/^\d+(\.\d+)?$/.test(val)) {
            return nota === parseFloat(val);
          }
          return false;
        });
      });
    }
    // Filtro por fecha (usa r.createdAt como fecha de entrega)
    if (filtroFecha.trim()) {
      filtradas = filtradas.filter(r => {
        if (!r.createdAt) return false;
        let fechaEntrega;
        if (typeof r.createdAt === 'string') {
          fechaEntrega = new Date(r.createdAt);
        } else if (r.createdAt instanceof Date) {
          fechaEntrega = r.createdAt;
        } else {
          return false;
        }
        if (isNaN(fechaEntrega.getTime())) return false;
        const fechaEntregaStr = fechaEntrega.toISOString().slice(0,10);
        const filtroStr = filtroFecha.slice(0,10);
        return fechaEntregaStr === filtroStr;
      });
    }
    return filtradas;
  }, [respuestas, filtroActividad, filtroRetro, filtroNota, filtroFecha]);

  // Lógica de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 4;
  const totalPages = Math.ceil(respuestasFiltradas.length / notesPerPage);
  const paginatedRespuestas = respuestasFiltradas.slice((currentPage - 1) * notesPerPage, currentPage * notesPerPage);

  return (
    <>
      <Navbar user={user} setUser={setUser} />
      <div className="container gestion-container" style={{display:'flex',flexDirection:'row',alignItems:'flex-start',gap:'2.5rem', marginLeft:'0', paddingLeft:'2.5rem', paddingRight:'2.5rem', boxSizing:'border-box'}}>
        {/* Filtros laterales */}
        <div className="grabaciones-filtros-container card" style={{ minWidth: 320, maxWidth: 340, marginLeft: '1.5rem', marginTop: '2.5rem', padding: '1.5rem' }}>
          <div className="grabaciones-filtros-titulo">Filtros <span style={{color:'#3fa6ff',fontWeight:700}}>de búsqueda</span></div>
          {/* Input de actividad arriba, siempre visible y sin botón */}
          <input type="text" className="form-control grabaciones-filtros-busqueda" placeholder="Buscar actividad..." value={filtroActividad} onChange={e => setFiltroActividad(e.target.value)} style={{marginBottom:'1.2rem'}} />
          <div className="grabaciones-filtros-lista">
            {/* Retroalimentación */}
            <div className="filtro-item" onClick={() => setShowRetro(!showRetro)}>
              <button type="button" className="btn btn-outline-light w-100 boton-filtro">
                Retroalimentación
              </button>
              {showRetro && (
                <input
                  type="text"
                  className="form-control mt-2"
                  placeholder="Buscar retroalimentación..."
                  value={filtroRetro}
                  onChange={e => setFiltroRetro(e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
              )}
            </div>
            {/* Nota */}
            <div className="filtro-item" onClick={() => setShowNota(!showNota)}>
              <button type="button" className="btn btn-outline-light w-100 boton-filtro">
                Nota
              </button>
              {showNota && (
                <input
                  type="text"
                  className="form-control mt-2"
                  placeholder="Buscar nota..."
                  value={filtroNota}
                  onChange={e => setFiltroNota(e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
              )}
            </div>
            {/* Fecha */}
            <button
              type="button"
              className="btn btn-outline-light w-100 boton-filtro"
              onClick={e => { e.preventDefault(); e.stopPropagation(); setShowFecha(prev => !prev); }}
            >
              <i className="fas fa-calendar-alt"></i> Fecha
            </button>
            {showFecha && (
              <div className="grabaciones-filtros-dropdown" style={{marginTop:'0.5rem'}}>
                <input
                  type="date"
                  value={filtroFecha}
                  onChange={e => setFiltroFecha(e.target.value)}
                  className="grabaciones-filtros-busqueda-fecha"
                />
              </div>
            )}
          </div>
        </div>
        {/* Contenido principal */}
        <div className="card" style={{flex:1,minWidth:0, marginLeft:'0', padding:'1.5rem 1.5rem 1.5rem 0'}}>
          <Toast
            show={toast.show}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
          <div>
            <h1 className="text-center" style={{width:'100%',textAlign:'center',fontWeight:'bold',fontSize:'2rem',margin:'2rem 0',color: '#fff'}}>Mis Notas y Retroalimentaciones</h1>
            {loading ? (
              <div className="text-center">Cargando...</div>
            ) : respuestasFiltradas.length === 0 ? (
              <div className="alert alert-info" style={{color:"#fff", textAlign:"center"}}>No tienes respuestas registradas aún.</div>
            ) : (
              <>
                <div className="row mt-3">
                  {paginatedRespuestas.map((r, i) => (
                    <div key={r.id || i} className="col-md-6 col-lg-4 mb-4">
                      <div className="grabacion-card h-100">
                        <div className="grabacion-header" style={{background:'#10182b', borderRadius:'12px', padding:'0.75rem 1rem', marginBottom:'1rem'}}>
                          <h3 style={{fontWeight:700, fontSize:'1.1rem', marginBottom:0, color:'#3fa6ff'}}>
                            Actividad: {r.actividad?.titulo || 'Sin título'}
                          </h3>
                        </div>
                        <div className="grabacion-body">
                          {/* ...existing code... */}
                          {Array.isArray(r.respuestas) && r.respuestas.length > 0 ? (
                            <div className="mb-2">
                              <strong style={{color: '#c7bebeff'}}>Mis respuestas:</strong>
                              {r.respuestas.map((resp, idx) => {
                                let respuestaMostrada = resp.respuesta;
                                if (typeof resp.respuesta === 'number') {
                                  respuestaMostrada = String.fromCharCode(97 + resp.respuesta); // 0=a, 1=b, etc.
                                }
                                if (Array.isArray(resp.respuesta)) {
                                  respuestaMostrada = resp.respuesta.map(num =>
                                    typeof num === 'number' ? String.fromCharCode(97 + num) : num
                                  ).join(', ');
                                }
                                return (
                                  <div key={idx} >
                                    <span className="text-muted" style={{color: '#c7bebeff'}}>Pregunta {idx + 1}:</span> <span style={{fontWeight:500, color: '#c7bebeff'}}>{respuestaMostrada}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p><strong style={{color: '#c7bebeff'}}>Respuesta:</strong> {r.respuestaTexto || (r.archivoUrl && <a href={r.archivoUrl} target="_blank" rel="noopener noreferrer">Descargar archivo</a>) || 'Sin respuesta'}</p>
                          )}
                          {/* Mostrar respuestas correctas solo a administradores y docentes para formularios */}
                          {(['docente', 'administrador'].includes(user?.rol)) && r.actividad?.tipo === 'formulario' && Array.isArray(r.actividad?.preguntas) && r.actividad.preguntas.length > 0 && (
                            <div className="mb-2 bg-success bg-opacity-10 p-2 rounded">
                              <strong>Respuestas correctas del formulario:</strong>
                              {r.actividad.preguntas.map((pregunta, idx) => (
                                <div key={idx}>
                                  <span className="text-muted">Pregunta {idx + 1}:</span> <span style={{fontWeight:500}}>{pregunta.opciones && typeof pregunta.correcta === 'number' && pregunta.opciones[pregunta.correcta] ? pregunta.opciones[pregunta.correcta] : 'No definida'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Mostrar retroalimentaciones si existen */}
                          {Array.isArray(r.retroalimentaciones) && r.retroalimentaciones.length > 0 && r.retroalimentaciones.map((retro, idx) => (
                            <div key={retro.id || idx} className="card mt-2 border-info">
                              <div className="card-body p-2">
                                <strong className="text-info">Retroalimentación:</strong> {retro.retroalimentacion}<br />
                                <strong className="text-warning">Nota:</strong> {retro.nota}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination Controls - styled to match activities */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-dark"
                      style={{minWidth:40, fontWeight:600, background:'#10182b', color:'#3fa6ff', border:'1px solid #3fa6ff', borderRadius:8}}
                      onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >{'<'}</button>
                    {Array.from({ length: totalPages }, (_, idx) => (
                      <button
                        key={idx + 1}
                        className={`btn ${currentPage === idx + 1 ? 'btn-primary' : 'btn-dark'}`}
                        style={{margin:'0 0.2rem', minWidth:40, fontWeight:600, background: currentPage === idx + 1 ? '#3fa6ff' : '#10182b', color: currentPage === idx + 1 ? '#fff' : '#3fa6ff', border: currentPage === idx + 1 ? 'none' : '1px solid #3fa6ff', borderRadius:8, boxShadow: currentPage === idx + 1 ? '0 2px 8px #3fa6ff44' : 'none'}}
                        onClick={() => setCurrentPage(idx + 1)}
                      >{idx + 1}</button>
                    ))}
                    <button
                      type="button"
                      className="btn btn-dark"
                      style={{minWidth:40, fontWeight:600, background:'#10182b', color:'#3fa6ff', border:'1px solid #3fa6ff', borderRadius:8}}
                      onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >{'>'}</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MisNotas;
