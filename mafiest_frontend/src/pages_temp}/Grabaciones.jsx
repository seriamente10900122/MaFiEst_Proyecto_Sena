import React, { useEffect, useState } from 'react'
import grabacionesService from '../services/grabaciones'
import AgregarGrabacion from '../components/AgregarGrabacion'
import ToastNotification from '../components/Notification'
import GrabacionCard from '../components/GrabacionCard'
import Navbar from '../components/Navbar'
import FiltroGrupos from '../components/FiltroGrupos'
import '../styles/gestion.css'
import '../styles/grabaciones.css'
import '../styles/grabaciones-filtros.css';

const Grabaciones = ({ user, setUser }) => {
  const [grabaciones, setGrabaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [grabacionEditar, setGrabacionEditar] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [filtro, setFiltro] = useState('todas')
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Filtros desplegables
  const [showDocente, setShowDocente] = useState(false);
  const [showGrupo, setShowGrupo] = useState(false);
  const [showTipo, setShowTipo] = useState(false);
  const [showFecha, setShowFecha] = useState(false);
  // Valores de búsqueda para cada filtro
  const [busquedaDocente, setBusquedaDocente] = useState('');
  const [busquedaGrupo, setBusquedaGrupo] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');

  // Elimina duplicados por id
  const filtrarDuplicados = (arr) => {
    const seen = new Set();
    return arr.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  // Determinar título y texto de botón según rol
  const esEstudianteOIndependiente = user.rol === 'estudiante' || user.rol === 'independiente';
  const tituloGrabaciones = esEstudianteOIndependiente ? 'Mis Grabaciones' : 'Gestión de Grabaciones';

  // Recarga grabaciones al montar o cuando cambia el usuario
  useEffect(() => {
    cargarGrabaciones();
    return () => {
      setGrabaciones([]);
      setLoading(true);
      setError(null);
    };
  }, [user]);

  const cargarGrabaciones = async () => {
    try {
      setLoading(true);
      if (!user?.token) throw new Error('No hay token disponible');
      grabacionesService.setToken(user.token);
      let data = [];

      if (user.rol === 'administrador') {
        const generales = await grabacionesService.obtenerGrabacionesGenerales();
        const grupales = await grabacionesService.obtenerGrabacionesGrupales();
        const mias = await grabacionesService.obtenerMisGrabaciones();
        data = [...generales, ...grupales, ...mias];
      } else if (user.rol === 'docente') {
        const generales = await grabacionesService.obtenerGrabacionesGenerales();
        const grupo = await grabacionesService.obtenerGrabacionesDeMiGrupo();
        const mias = await grabacionesService.obtenerMisGrabaciones();
        data = [...generales, ...grupo, ...mias];
      } else if (user.rol === 'estudiante') {
        const generales = await grabacionesService.obtenerGrabacionesGenerales();
        const grupo = await grabacionesService.obtenerGrabacionesDeMiGrupo();
        const mias = await grabacionesService.obtenerMisGrabaciones();
        data = [...generales, ...grupo, ...mias];
      } else if (user.rol === 'independiente') {
        data = await grabacionesService.obtenerGrabacionesGenerales();
      }

      const grabacionesUnicas = filtrarDuplicados(data);
      setGrabaciones(grabacionesUnicas);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'No se pudieron cargar las grabaciones'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (grabacion) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta grabación?')) {
      try {
        await grabacionesService.eliminarGrabacion(grabacion.id)
        setGrabaciones(grabaciones.filter(g => g.id !== grabacion.id))
        setMensaje('Grabación eliminada correctamente')
        setTimeout(() => setMensaje(null), 3000)
      } catch (err) {
        setError(err.response?.data?.error || 'Error al eliminar la grabación')
      }
    }
  }

  const handleEdit = (grabacion) => {
    setGrabacionEditar(grabacion)
    setShowForm(true)
  }

  const filtrarGrabaciones = () => {
    if (!Array.isArray(grabaciones)) return [];
    let grabacionesUnicas = filtrarDuplicados(grabaciones);
    if (grupoSeleccionado) {
      grabacionesUnicas = grabacionesUnicas.filter(g => String(g.grupoId) === String(grupoSeleccionado));
    }
    if (busquedaDocente.trim() !== '') {
      const texto = busquedaDocente.trim().toLowerCase();
      grabacionesUnicas = grabacionesUnicas.filter(g =>
        (g.usuario?.nombre && g.usuario.nombre.toLowerCase().includes(texto)) ||
        (g.user?.nombre && g.user.nombre.toLowerCase().includes(texto)) ||
        (g.docente?.nombre && g.docente.nombre.toLowerCase().includes(texto))
      );
    }
    if (busquedaGrupo.trim() !== '') {
      const texto = busquedaGrupo.trim().toLowerCase();
      grabacionesUnicas = grabacionesUnicas.filter(g =>
        (g.grupo?.nombre && g.grupo.nombre.toLowerCase().includes(texto))
      );
    }
    if (tipoSeleccionado) {
      grabacionesUnicas = grabacionesUnicas.filter(g => g.tipo === tipoSeleccionado);
    }
    if (fechaSeleccionada) {
      grabacionesUnicas = grabacionesUnicas.filter(g => {
        if (!g.createdAt) return false;
        const fechaGrabacion = new Date(g.createdAt).toISOString().slice(0,10);
        return fechaGrabacion === fechaSeleccionada;
      });
    }
    if (busqueda.trim() !== '') {
      const texto = busqueda.trim().toLowerCase();
      grabacionesUnicas = grabacionesUnicas.filter(g =>
        (g.title && g.title.toLowerCase().includes(texto)) ||
        (g.description && g.description.toLowerCase().includes(texto))
      );
    }
    if (user.rol === 'estudiante') {
      switch (filtro) {
        case 'misgrabaciones':
          return grabacionesUnicas.filter(g => g.userId === user.id);
        case 'porgrupo':
          const grupoIds = user.grupos ? user.grupos.map(grupo => Number(grupo.id)) : [];
          return grabacionesUnicas.filter(g => g.grupoId && grupoIds.includes(Number(g.grupoId)));
        default:
          return grabacionesUnicas;
      }
    }
    switch (filtro) {
      case 'porgrupo':
        return grabacionesUnicas.filter(g => g.grupoId !== null).sort((a, b) => {
          if (a.grupoId === b.grupoId) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return a.grupoId - b.grupoId;
        });
      default:
        return grabacionesUnicas.sort((a, b) => {
          const aIsMine = a.userId === user.id || a.docenteId === user.id;
          const bIsMine = b.userId === user.id || b.docenteId === user.id;
          if (aIsMine && !bIsMine) return -1;
          if (!aIsMine && bIsMine) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }
  }


  // --- PAGINACIÓN ---
  const [paginaActual, setPaginaActual] = useState(1);
  const grabacionesFiltradas = filtrarGrabaciones();
  const grabacionesPorPagina = 2;
  const totalPaginas = Math.ceil(grabacionesFiltradas.length / grabacionesPorPagina);
  const indiceInicio = (paginaActual - 1) * grabacionesPorPagina;
  const indiceFin = indiceInicio + grabacionesPorPagina;
  const grabacionesPagina = grabacionesFiltradas.slice(indiceInicio, indiceFin);

  // Cuando cambian los filtros, vuelve a la página 1
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, busquedaDocente, busquedaGrupo, tipoSeleccionado, fechaSeleccionada, grupoSeleccionado, filtro]);

  // Componente de paginación
  const Paginacion = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1.5rem', gap: '0.5rem' }}>
      <button
        className="btn btn-dark"
        style={{
          margin: '0 0.2rem',
          minWidth: 36,
          fontWeight: 600,
          background: '#10182b',
          color: '#3fa6ff',
          border: '1px solid #3fa6ff',
          borderRadius: 8,
          boxShadow: 'none'
        }}
        onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
        disabled={paginaActual === 1}
      >
        &#60;
      </button>
      {Array.from({ length: totalPaginas }, (_, i) => (
        <button
          key={i + 1}
          className={`btn ${paginaActual === i + 1 ? 'btn-primary' : 'btn-dark'}`}
          style={{
            margin: '0 0.2rem',
            minWidth: 36,
            fontWeight: 600,
            background: paginaActual === i + 1 ? '#3fa6ff' : '#10182b',
            color: paginaActual === i + 1 ? '#fff' : '#3fa6ff',
            border: paginaActual === i + 1 ? 'none' : '1px solid #3fa6ff',
            borderRadius: 8,
            boxShadow: paginaActual === i + 1 ? '0 2px 8px #3fa6ff44' : 'none'
          }}
          onClick={() => setPaginaActual(i + 1)}
        >
          {i + 1}
        </button>
      ))}
      <button
        className="btn btn-dark"
        style={{
          margin: '0 0.2rem',
          minWidth: 36,
          fontWeight: 600,
          background: '#10182b',
          color: '#3fa6ff',
          border: '1px solid #3fa6ff',
          borderRadius: 8,
          boxShadow: 'none'
        }}
        onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
        disabled={paginaActual === totalPaginas || totalPaginas === 0}
      >
        &#62;
      </button>
    </div>
  );

  return (
    <div style={{background:'#10182b', minHeight:'100vh', padding:'0'}}>
      <Navbar user={user} setUser={setUser} />
      <div className="container gestion-container" style={{display:'flex',flexDirection:'row',alignItems:'flex-start',gap:'2.5rem', marginLeft:'0', paddingLeft:'2.5rem', paddingRight:'2.5rem', boxSizing:'border-box'}}>
        
        {/* Filtros laterales */}
        <div className="grabaciones-filtros-container card" style={{ minWidth: 320, maxWidth: 340, marginLeft: '1.5rem', marginTop: '2.5rem', padding: '1.5rem' }}>
          <div className="grabaciones-filtros-titulo">Filtros <span style={{color:'#3fa6ff',fontWeight:700}}>de búsqueda</span></div>
          <input 
            className="grabaciones-filtros-busqueda" 
            type="text" 
            placeholder="Buscar por título o descripción" 
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <div className="grabaciones-filtros-lista">

          {/* FILTRO DOCENTE */}
          <div
            className="filtro-item"
            onClick={() => setShowDocente(!showDocente)}
          >
            <button
              type="button"
              className="btn btn-outline-light w-100 boton-filtro"
            >
              Filtrar por Docente
            </button>
            {showDocente && (
              <input
                type="text"
                className="form-control mt-2"
                placeholder="Buscar docente..."
                value={busquedaDocente}
                onChange={(e) => setBusquedaDocente(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>

          {/* FILTRO GRUPO */}
          <div
            className="filtro-item"
            onClick={() => setShowGrupo(!showGrupo)}
          >
            <button
              type="button"
              className="btn btn-outline-light w-100 boton-filtro"
            >
              Filtrar por Grupo
            </button>
            {showGrupo && (
              <input
                type="text"
                className="form-control mt-2"
                placeholder="Buscar grupo..."
                value={busquedaGrupo}
                onChange={(e) => setBusquedaGrupo(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>

            {/* TIPO */}
            <button
              type="button"
              className="btn btn-outline-light w-100 boton-filtro"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTipo(prev => !prev); }}
            >
              <i className="fas fa-tag"></i> Tipo
            </button>
            {showTipo && (
              <div className="grabaciones-filtros-dropdown">
                <button
                  type="button"
                  className={`boton-filt ${tipoSeleccionado === 'general' ? 'activo' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (tipoSeleccionado === 'general') {
                      setTipoSeleccionado(''); // Deselecciona si ya está seleccionado
                    } else {
                      setTipoSeleccionado('general');
                    }
                    setShowTipo(false);
                  }}
                >
                  General
                </button>

                <button
                  type="button"
                  className={`boton-filt ${tipoSeleccionado === 'grupal' ? 'activo' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (tipoSeleccionado === 'grupal') {
                      setTipoSeleccionado(''); // Deselecciona si ya está seleccionado
                    } else {
                      setTipoSeleccionado('grupal');
                    }
                    setShowTipo(false);
                  }}
                >
                  Grupales
                </button>
              </div>

            )}

            {/* FECHA */}
            <button
              type="button"
              className="btn btn-outline-light w-100 boton-filtro"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowFecha(prev => !prev); }}
            >
              <i className="fas fa-calendar-alt"></i> Fecha
            </button>
            {showFecha && (
              <div className="grabaciones-filtros-dropdown" style={{marginTop:'0.5rem'}}>
                <input 
                  type="date" 
                  value={fechaSeleccionada}
                  onChange={e => setFechaSeleccionada(e.target.value)}
                  className="grabaciones-filtros-busqueda-fecha"
                />
              </div>
            )}

          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="card" style={{flex:1,minWidth:0, marginLeft:'0', padding:'1.5rem 1.5rem 1.5rem 0'}}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', gap: '1.5rem' }}>
            <h1 className="titulo-gestion text-center" style={{fontWeight:'bold',fontSize:'2rem',color:'#fff',margin:'2rem 0'}}>{tituloGrabaciones}</h1>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              {(user.rol === 'docente' || user.rol === 'administrador') && (
                <button
                  className="btn btn-primary"
                  style={{ minWidth: '220px', fontSize: '1.1rem' }}
                  onClick={() => {
                    setGrabacionEditar(null)
                    setShowForm(!showForm)
                  }}
                >
                  {showForm ? 'Ver Grabaciones' : 'Nueva Grabación'}
                </button>
              )}
              <button
                className={`btn ${filtro === 'todas' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ minWidth: '180px', fontWeight: '600', fontSize: '1.05rem' }}
                onClick={() => {
                  setFiltro('todas');
                  setGrupoSeleccionado('');
                  setBusqueda('');
                  setBusquedaDocente('');
                  setBusquedaGrupo('');
                  setTipoSeleccionado('');
                  setFechaSeleccionada('');
                }}
              >
                Todas las Grabaciones
              </button>
            </div>
          </div>

          <ToastNotification
            show={!!mensaje}
            message={mensaje}
            type="success"
            onClose={() => setMensaje(null)}
            duration={3500}
          />
          <ToastNotification
            show={!!error}
            message={error}
            type="danger"
            onClose={() => setError(null)}
            duration={3500}
          />

          <div className="content-section" style={{margin:"32px 64px"}}>
            {showForm ? (
              <div className="card">
                <div className="card-body">
                  <h3>{grabacionEditar ? 'Editar Grabación' : 'Nueva Grabación'}</h3>
                  <AgregarGrabacion
                    user={user}
                    grabacion={grabacionEditar}
                    onGrabacionAgregada={async () => {
                      await cargarGrabaciones();
                      setShowForm(false);
                      setGrabacionEditar(null);
                      setMensaje(grabacionEditar ? 'Grabación actualizada' : 'Grabación agregada');
                    }}
                  />
                </div>
              </div>
            ) : loading ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : grabacionesFiltradas.length === 0 ? (
              <div className="alert alert-info" style={{color: '#fff', textAlign: 'center'}}>
                No hay grabaciones {filtro === 'misgrabaciones' ? 'propias' : ''} disponibles.
              </div>
            ) : (
              <>
                <div className="row">
                  {grabacionesPagina.map(grabacion => (
                    <div key={grabacion.id} className="col-md-6 col-lg-4 mb-4">
                      <GrabacionCard
                        grabacion={grabacion}
                        user={user}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                      />
                    </div>
                  ))}
                </div>
                <Paginacion />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Grabaciones
