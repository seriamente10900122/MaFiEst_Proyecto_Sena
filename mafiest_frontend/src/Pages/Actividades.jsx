import React, { useState, useEffect } from 'react'
import Toast from '../components/Notification'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import actividadesService from '../services/actividades'
import CrearActividad from '../components/CrearActividad'
import ActividadCard from '../components/ActividadCard'
import FiltroGrupos from '../components/FiltroGrupos'
import '../styles/gestion.css'
import '../styles/grabaciones.css'
import '../styles/grabaciones-filtros.css'


const Actividades = ({ user, setUser }) => {
  // Estados para los filtros visuales
  const [busqueda, setBusqueda] = useState('');
  const [showDocente, setShowDocente] = useState(false);
  const [busquedaDocente, setBusquedaDocente] = useState('');
  const [showGrupo, setShowGrupo] = useState(false);
  const [busquedaGrupo, setBusquedaGrupo] = useState('');
  const [showTipo, setShowTipo] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [showFecha, setShowFecha] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const navigate = useNavigate()
  const [mensaje, setMensaje] = useState(null)
  const [actividades, setActividades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Función auxiliar para obtener la respuesta más reciente de una actividad
  const obtenerRespuestaMasReciente = (actividad) => {
    if (!Array.isArray(actividad.respuestas) || !user) return null;
    
    const respuestasUsuario = actividad.respuestas
      .filter(r => String(r.userId || r.user_id) === String(user.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return respuestasUsuario[0] || null;
  }
  const [modo, setModo] = useState('ver')
  const [actividadEditar, setActividadEditar] = useState(null)
  const [tabActiva, setTabActiva] = useState('disponibles')
  const [actividadVer, setActividadVer] = useState(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('')
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Estado para paginación
  const [pagina, setPagina] = useState(1);

  // Resetear la página a 1 cuando cambia el tab activo
  useEffect(() => {
    setPagina(1);
  }, [tabActiva]);
  const actividadesPorPagina = 2;

  // Función auxiliar para determinar el estado de una actividad
  const determinarEstadoActividad = (actividad, respuesta, fechaLimite, fechaActual) => {
    const tieneRespuesta = respuesta && (
      respuesta.respuesta_texto || 
      respuesta.archivo_url || 
      respuesta.respuestas
    );
    const estaVencida = fechaLimite < fechaActual;
    const estaDeshecha = respuesta?.deshecha === true;
    const estaEntregada = tieneRespuesta && !estaDeshecha;

    if (estaVencida) return 'vencida';
    if (estaEntregada) return 'entregada';
    return 'disponible';
  };

  const filtrarActividades = () => {
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);
    
    const resultado = {
      disponibles: new Map(),
      entregadas: new Map(),
      vencidas: new Map()
    };

    if (!Array.isArray(actividades)) {
      return resultado;
    }

    // Función auxiliar para obtener la respuesta más reciente
    const obtenerRespuestaMasReciente = (respuestas) => {
      if (!Array.isArray(respuestas)) return null;
      return respuestas
        .filter(r => String(r.userId || r.user_id) === String(user.id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    };

    // Filtrar primero por rol y luego por estado
    let actividadesAccesibles = [];

    switch (user.rol) {
      case 'administrador':
        actividadesAccesibles = actividades;
        break;
      case 'docente':
        actividadesAccesibles = actividades.filter(act => {
          const actGrupoId = act.grupoId ? Number(act.grupoId) : null;
          const grupoIds = user.grupos ? user.grupos.map(g => Number(g.id)) : [];
          return act.global || 
                 (actGrupoId && grupoIds.includes(actGrupoId)) ||
                 act.creadorId === user.id;
        });
        break;
      case 'estudiante':
        actividadesAccesibles = actividades.filter(act => {
          const actGrupoId = act.grupoId ? Number(act.grupoId) : (act.grupo && act.grupo.id ? Number(act.grupo.id) : null);
          const grupoIds = user.grupos ? user.grupos.map(g => Number(g.id)) : [];
          return act.global === true || (actGrupoId && grupoIds.includes(actGrupoId));
        });
        break;
      case 'independiente':
        actividadesAccesibles = actividades.filter(act => act.global === true);
        break;
    }

    // Filtrar por grupo si hay grupo seleccionado
    if (grupoSeleccionado) {
      actividadesAccesibles = actividadesAccesibles.filter(act => String(act.grupoId) === String(grupoSeleccionado));
    }

    // Procesar cada actividad
    actividadesAccesibles.forEach(act => {
    const fechaLimite = new Date(act.fechaLimite);
    fechaLimite.setHours(0, 0, 0, 0); // Fuerza mediodía para evitar desfase

      // Obtener la respuesta más reciente
      let respuestaUsuario = null;
      if (Array.isArray(act.respuestas) && act.respuestas.length > 0) {
        const respuestasUsuario = act.respuestas
          .filter(r => String(r.userId || r.user_id) === String(user.id) || 
                      (r.usuario && String(r.usuario.id) === String(user.id)))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        respuestaUsuario = respuestasUsuario[0];
      } else if (act.respuestaTexto) {
        // Si no hay respuestas pero sí respuestaTexto, crear un objeto simulado
        respuestaUsuario = {
          respuesta_texto: act.respuestaTexto,
          deshecha: false,
          archivo_url: act.archivoUrl || '',
          createdAt: act.createdAt || '',
        };
      }

      // Recalcular el estado igual que en ActividadCard.jsx
      const deshecha = respuestaUsuario?.deshecha === true;
      const entregada = respuestaUsuario && !deshecha;
      // Comparación solo por año, mes y día
      const vencidaPorFecha = (
        fechaLimite.getFullYear() < fechaActual.getFullYear() ||
        (fechaLimite.getFullYear() === fechaActual.getFullYear() && fechaLimite.getMonth() < fechaActual.getMonth()) ||
        (fechaLimite.getFullYear() === fechaActual.getFullYear() && fechaLimite.getMonth() === fechaActual.getMonth() && fechaLimite.getDate() < fechaActual.getDate())
      );
      const actividadVencida = vencidaPorFecha;
      const estado = entregada ? 'entregada' : (deshecha ? (actividadVencida ? 'vencida' : 'disponible') : (actividadVencida ? 'vencida' : 'disponible'));

      const actividadProcesada = {
        ...act,
        estado,
        entregada,
        deshecha,
        esVencida: actividadVencida
      };

      // Filtrar por el campo 'estado' recién calculado
      switch (actividadProcesada.estado) {
        case 'entregada':
          resultado.entregadas.set(act.id, actividadProcesada);
          break;
        case 'vencida':
          resultado.vencidas.set(act.id, actividadProcesada);
          break;
        default:
          resultado.disponibles.set(act.id, actividadProcesada);
      }
    });

    // Convertir Maps a arrays para el resultado final
    const resultadoFinal = {
      disponibles: Array.from(resultado.disponibles.values()),
      entregadas: Array.from(resultado.entregadas.values()),
      vencidas: Array.from(resultado.vencidas.values())
    };

    return resultadoFinal;
  }


  const actualizarActividad = async (actividadActualizada) => {
    try {
      // Forzar recarga desde el servidor
      const nuevasActividades = await actividadesService.obtenerMisActividades();
      
      // Identificar la actividad actualizada
      const actividadEncontrada = nuevasActividades.find(a => a.id === actividadActualizada.id);
      
      if (actividadEncontrada) {
        // Obtener la respuesta más reciente
        const respuestas = actividadEncontrada.respuestas || [];
        const respuestasUsuario = respuestas
          .filter(r => String(r.userId || r.user_id) === String(user.id))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const respuestaReciente = respuestasUsuario[0];
        // Si hay una respuesta reciente y no está deshecha, mover a entregadas
        if (respuestaReciente && !respuestaReciente.deshecha) {
          setTabActiva('entregadas');
        }
      }

      // Actualizar el estado de actividades
      setActividades(nuevasActividades);
      
    } catch (error) {
      console.error('Error al actualizar actividad:', error);
    }
  };

  useEffect(() => {
    const inicializarActividades = async () => {
      if (!user) {
        navigate('/login')
        return
      }
      if (!user.token) {
        setError('No hay token de autenticación')
        return
      }
      actividadesService.setToken(user.token)
      await cargarActividades()
    }
    inicializarActividades()
  }, [user, navigate, grupoSeleccionado])

  const cargarActividades = async () => {
    try {
      setLoading(true);
      setError(null);
      actividadesService.setToken(user.token);
      let data = [];
      if (user.rol === 'administrador') {
        // Si el admin selecciona un grupo, filtra por ese grupo
        if (grupoSeleccionado !== '' && grupoSeleccionado !== null && !isNaN(Number(grupoSeleccionado))) {
          data = await actividadesService.obtenerMisActividadesPorGrupo(Number(grupoSeleccionado));
        } else {
          // Si no, ve todas las generales y grupales
          const generales = await actividadesService.obtenerActividadesGenerales();
          const grupales = await actividadesService.obtenerActividadesGrupales();
          // Evitamos duplicados comparando por ID
          const ids = new Set();
          data = [...generales, ...grupales].filter(act => {
            if (ids.has(act.id)) return false;
            ids.add(act.id);
            return true;
          });
        }
      } else {
        // Docente, estudiante e independiente usan un endpoint controlado por backend
        data = await actividadesService.obtenerMisActividades();
      }
      setActividades(data);
      if (data.length === 0) {
        setMensaje('No hay actividades disponibles en este momento');
      }
    } catch (err) {
      console.error('Error al cargar actividades:', err);
      setActividades([]);
      setError('No se pudieron cargar las actividades. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Handler para el filtro de grupos (solo admin)
  const handleGrupoChange = (grupoId) => {
    setGrupoSeleccionado(grupoId);
  }


  const handleCrearActividad = async (actividadData) => {
    try {
      await actividadesService.crearActividad(actividadData)
      setMensaje('✅ ¡Actividad creada exitosamente!')
      setModo('ver')
      await cargarActividades()
    } catch (error) {
      setError(error.response?.data?.error || '❌ Error al crear la actividad')
    }
  }

  const handleEditarActividad = async (actividadData) => {
    try {
      await actividadesService.actualizarActividad(actividadEditar.id, actividadData)
      setMensaje('✏️ ¡Actividad actualizada exitosamente!')
      setModo('ver')
      setActividadEditar(null)
      await cargarActividades()
    } catch (error) {
      setError(error.response?.data?.error || '❌ Error al actualizar la actividad')
    }
  }

  const handleEliminarActividad = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta actividad?')) {
      try {
        await actividadesService.eliminarActividad(id)
        setMensaje('🗑️ ¡Actividad eliminada exitosamente!')
        await cargarActividades()
      } catch (error) {
        setError(error.response?.data?.error || '❌ Error al eliminar la actividad')
      }
    }
  }

  const iniciarEdicion = (actividad) => {
    setActividadEditar(actividad)
    setModo('editar')
  }

  // Filtros funcionales del panel izquierdo
  const actividadesFiltradasBase = filtrarActividades();
  const filtrarPorBusqueda = (arr) => {
    if (!busqueda.trim()) return arr;
    const texto = busqueda.trim().toLowerCase();
    return arr.filter(act =>
      (act.titulo && act.titulo.toLowerCase().includes(texto)) ||
      (act.descripcion && act.descripcion.toLowerCase().includes(texto))
    );
  };
  const filtrarPorDocente = (arr) => {
    if (!busquedaDocente.trim()) return arr;
    const texto = busquedaDocente.trim().toLowerCase();
    return arr.filter(act => {
      // Si existe creadorNombre y es string
      if (typeof act.creadorNombre === 'string' && act.creadorNombre.toLowerCase().includes(texto)) {
        return true;
      }
      // Si existe creador y es string
      if (typeof act.creador === 'string' && act.creador.toLowerCase().includes(texto)) {
        return true;
      }
      // Si existe creador y es objeto con nombre
      if (act.creador && typeof act.creador === 'object' && typeof act.creador.nombre === 'string' && act.creador.nombre.toLowerCase().includes(texto)) {
        return true;
      }
      return false;
    });
  };
  const filtrarPorGrupo = (arr) => {
    if (!busquedaGrupo.trim()) return arr;
    const texto = busquedaGrupo.trim().toLowerCase();
    return arr.filter(act => {
      if (act.grupo && act.grupo.nombre) {
        return act.grupo.nombre.toLowerCase().includes(texto);
      }
      if (act.grupoNombre) {
        return act.grupoNombre.toLowerCase().includes(texto);
      }
      return false;
    });
  };
  const filtrarPorTipo = (arr) => {
    if (!tipoSeleccionado) return arr;
    const tipoNorm = tipoSeleccionado.trim().toLowerCase();
    return arr.filter(act => {
      if (!act.tipo) return false;
      return String(act.tipo).trim().toLowerCase() === tipoNorm;
    });
  };
  const filtrarPorFecha = (arr) => {
    if (!fechaSeleccionada) return arr;
    // El input type="date" siempre da YYYY-MM-DD, así que solo compara ese formato
    return arr.filter(act => {
      if (!act.fechaLimite) return false;
      // Convierte fechaLimite a YYYY-MM-DD
      const fechaAct = new Date(act.fechaLimite);
      if (isNaN(fechaAct.getTime())) return false;
      const fechaActStr = fechaAct.getFullYear().toString().padStart(4, '0') + '-' +
        (fechaAct.getMonth() + 1).toString().padStart(2, '0') + '-' +
        fechaAct.getDate().toString().padStart(2, '0');
      return fechaActStr === fechaSeleccionada;
    });
  };
  // Aplica todos los filtros en orden
  const aplicarTodosLosFiltros = (arr) => {
    let resultado = filtrarPorBusqueda(arr);
    resultado = filtrarPorDocente(resultado);
    resultado = filtrarPorGrupo(resultado);
    resultado = filtrarPorTipo(resultado);
    resultado = filtrarPorFecha(resultado);
    return resultado;
  };
  const actividadesFiltradas = {
    disponibles: aplicarTodosLosFiltros(actividadesFiltradasBase.disponibles),
    entregadas: aplicarTodosLosFiltros(actividadesFiltradasBase.entregadas),
    vencidas: aplicarTodosLosFiltros(actividadesFiltradasBase.vencidas)
  };
  // Handler para ver detalles de la actividad
  // const navigate = useNavigate(); (eliminada duplicada)
  // Manejar la visualización y respuesta de actividades
  const handleVerActividad = (actividad) => {
    // Si el usuario es estudiante/independiente y la actividad está disponible, ir a responder
    if ((user.rol === 'estudiante' || user.rol === 'independiente') && 
        !actividad.respondida && 
        new Date(actividad.fechaLimite) >= new Date()) {
      navigate('/ver-actividad', { 
        state: { 
          actividad, 
          user
        }
      });
    } else {
      // Para otros casos, solo mostrar la actividad
      navigate('/ver-actividad', { 
        state: { 
          actividad, 
          user
        } 
      });
    }
  }

  const handleVerRespuestas = (actividad) => {
    navigate('/ver-respuestas-actividad', { state: { actividad, user } });
  }


  // Handler para mostrar toast desde ActividadCard (vencida)
  const handleIntentoResponderVencida = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Handler para deshacer entrega exitosamente
  const handleDeshacerEntregaExito = async (msg) => {
    try {
      // Configura el mensaje del toast con tipo success
      setToastMsg({ message: msg, type: 'success' });
      setShowToast(true);
      
      // Forzar recarga completa de actividades
      await cargarActividades();
      
      // Cambiar a la pestaña correcta según el estado
      setTabActiva('disponibles');
      
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (error) {
      console.error('Error al recargar actividades:', error);
      setError('Error al actualizar la lista de actividades');
    }
  };

  const hayActividades = actividades.length > 0
  
  return (
    <div style={{background:'#10182b', minHeight:'100vh', padding:'0'}}>
      <Navbar user={user} setUser={setUser} />
      <div className="container gestion-container" style={{display:'flex',flexDirection:'row',alignItems:'flex-start',gap:'2.5rem', marginLeft:'0', paddingLeft:'2.5rem', paddingRight:'2.5rem', boxSizing:'border-box'}}>
        {/* Filtro lateral */}
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
                <button
                  type="button"
                  className="btn btn-outline-light w-100 boton-filtro"
                  style={{margin:'1rem 0 0.5rem 0'}}
                  onClick={() => setShowDocente(prev => !prev)}
                >
                  Filtrar por Docente
                </button>
                {showDocente && (
                  <input
                    type="text"
                    className="form-control mt-2"
                    placeholder="Buscar docente o creador..."
                    value={busquedaDocente}
                    onChange={e => setBusquedaDocente(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                )}
                <button
                  type="button"
                  className="btn btn-outline-light w-100 boton-filtro"
                  style={{margin:'0.5rem 0'}}
                  onClick={() => setShowGrupo(prev => !prev)}
                >
                  Filtrar por Grupo
                </button>
                {showGrupo && (
                  <input
                    type="text"
                    className="form-control mt-2"
                    placeholder="Buscar grupo..."
                    value={busquedaGrupo}
                    onChange={e => setBusquedaGrupo(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                )}
                <button
                  type="button"
                  className="btn btn-outline-light w-100 boton-filtro"
                  style={{margin:'0.5rem 0'}}
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setShowTipo(prev => !prev); }}
                >
                  <i className="fas fa-tag"></i> Tipo
                </button>
                {showTipo && (
                  <div className="grabaciones-filtros-dropdown">
                    <button
                      type="button"
                      className={`boton-filt ${tipoSeleccionado === 'formulario' ? 'activo' : ''}`}
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTipoSeleccionado(prev => prev === 'formulario' ? '' : 'formulario');
                        setShowTipo(false);
                      }}
                    >
                      Formulario
                    </button>
                    <button
                      type="button"
                      className={`boton-filt ${tipoSeleccionado === 'archivo' ? 'activo' : ''}`}
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTipoSeleccionado(prev => prev === 'archivo' ? '' : 'archivo');
                        setShowTipo(false);
                      }}
                    >
                      Archivo
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-outline-light w-100 boton-filtro"
                  style={{margin:'0.5rem 0'}}
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setShowFecha(prev => !prev); }}
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
          {/* Columna de actividades */}
          <div className="card" style={{flex:1,minWidth:0, marginLeft:'0', padding:'1.5rem 1.5rem 1.5rem 0'}}>
              {user.rol === 'estudiante' || user.rol === 'independiente' ? (
                <h1 style={{ width: '100%', textAlign: 'center', fontWeight: 'bold', margin: '2rem 0', color:'#fff' }}>
                  Mis Actividades
                </h1>
              ) : ( 
                <h1 id="gestion-actividades-header" style={{ width: '100%', textAlign: 'center', fontWeight: 'bold', margin: '2rem 0', color:'#fff' }}>
                  Gestión de Actividades
                </h1> 
              )}
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', margin: '1.5rem 0' }}>
                {(user.rol === 'docente' || user.rol === 'administrador') && (
                  <button
                    className="btn btn-primary"
                    style={{ minWidth: '220px', fontSize: '1.1rem' }}
                    onClick={() => setModo(modo === 'ver' ? 'crear' : 'ver')}
                  >
                    {modo === 'ver' ? '+ Nueva Actividad' : 'Ver Actividades'}
                  </button>
                )}
                <button
                  className={`btn btn-primary${tabActiva === 'disponibles' ? '' : ' btn-secondary'}`}
                  style={{ minWidth: '130px' }}
                  onClick={() => setTabActiva('disponibles')}
                >
                  Disponibles
                </button>
                {(user.rol === 'estudiante' || user.rol === 'independiente') && (
                  <button
                    className={`btn btn-secondary${tabActiva === 'entregadas' ? ' btn-primary' : ''}`}
                    style={{ minWidth: '130px' }}
                    onClick={() => setTabActiva('entregadas')}
                  >
                    Entregadas
                  </button>
                )}
                <button
                  className={`btn btn-danger${tabActiva === 'vencidas' ? '' : ' btn-secondary'}`}
                  style={{ minWidth: '130px' }}
                  onClick={() => setTabActiva('vencidas')}
                >
                  Vencidas
                </button>
              </div>
              <Toast
                show={!!mensaje}
                message={mensaje}
                type="success"
                onClose={() => setMensaje(null)}
              />
              <Toast
                show={!!error}
                message={error}
                type="danger"
                onClose={() => setError(null)}
              />
              <Toast
                show={showToast}
                message={typeof toastMsg === 'object' ? toastMsg.message : toastMsg}
                type={typeof toastMsg === 'object' ? toastMsg.type : 'success'}
                onClose={() => setShowToast(false)}
              />
              {modo === 'ver' ? (
                <div>
                  <br />
                  {loading ? (
                    <div className="text-center">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                    </div>
                  ) : (
                    (() => {
                      // Filtra según el tab activo
                      let actividadesTab = [];
                      if (tabActiva === 'disponibles') actividadesTab = actividadesFiltradas.disponibles;
                      if (tabActiva === 'entregadas') actividadesTab = actividadesFiltradas.entregadas;
                      if (tabActiva === 'vencidas') actividadesTab = actividadesFiltradas.vencidas;
                      if (!actividadesTab || actividadesTab.length === 0) {
                        return (
                          <div className="alert alert-info" style={{color:'#fff', textAlign:'center'}}>
                            <br />No hay actividades que coincidan con los filtros seleccionados
                          </div>
                        );
                      }
                      const totalPaginas = Math.ceil(actividadesTab.length / actividadesPorPagina) || 1;
                      const inicio = (pagina - 1) * actividadesPorPagina;
                      const actividadesPagina = actividadesTab.slice(inicio, inicio + actividadesPorPagina);
                      // PAGINACION VISUAL ESTILO GRABACIONES
                      const paginas = [];
                      for (let i = 1; i <= totalPaginas; i++) {
                        paginas.push(
                          <button
                            key={i}
                            className={`btn ${pagina === i ? 'btn-primary' : 'btn-dark'}`}
                            style={{margin:'0 0.2rem', minWidth:36, fontWeight:600, background: pagina === i ? '#3fa6ff' : '#10182b', color: pagina === i ? '#fff' : '#3fa6ff', border: pagina === i ? 'none' : '1px solid #3fa6ff', borderRadius:8, boxShadow: pagina === i ? '0 2px 8px #3fa6ff44' : 'none'}}
                            onClick={() => setPagina(i)}
                            disabled={pagina === i}
                          >
                            {i}
                          </button>
                        );
                      }
                      return (
                        <>
                          <div className="row">
                            {actividadesPagina.map(actividad => (
                              <div key={actividad.id} className="col-md-6 col-lg-4 mb-4">
                                <ActividadCard
                                  actividad={actividad}
                                  user={user}
                                  onVer={handleVerActividad}
                                  onEditar={iniciarEdicion}
                                  onEliminar={handleEliminarActividad}
                                  onVerRespuestas={handleVerRespuestas}
                                  onIntentoResponderVencida={handleIntentoResponderVencida}
                                  onActualizarActividad={actualizarActividad}
                                  onDeshacerEntregaExito={handleDeshacerEntregaExito}
                                />
                              </div>
                            ))}
                          </div>
                          {/* Controles de paginación visual estilo grabaciones */}
                          <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:'0.5rem',marginTop:'1.5rem'}}>
                            <button
                              className="btn btn-dark"
                              style={{minWidth:36, fontWeight:600, background:'#10182b', color:'#3fa6ff', border:'1px solid #3fa6ff', borderRadius:8}}
                              onClick={()=>setPagina(pagina-1)}
                              disabled={pagina === 1}
                            >
                              {'<'}
                            </button>
                            {paginas}
                            <button
                              className="btn btn-dark"
                              style={{minWidth:36, fontWeight:600, background:'#10182b', color:'#3fa6ff', border:'1px solid #3fa6ff', borderRadius:8}}
                              onClick={()=>setPagina(pagina+1)}
                              disabled={pagina === totalPaginas}
                            >
                              {'>'}
                            </button>
                          </div>
                        </>
                      );
                    })()
                  )}
                </div>
              ) : (
                <div className="card" style={{ margin:"32px 64px", color:'#fff' }}>
                  <div className="card-body">
                    <CrearActividad
                      onCrear={modo === 'crear' ? handleCrearActividad : undefined}
                      onEditar={modo === 'editar' ? handleEditarActividad : undefined}
                      actividadInicial={actividadEditar}
                      modo={modo}
                      user={user}
                      onCancelar={() => {
                        setModo('ver');
                        setActividadEditar(null);
                        setTimeout(() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }, 100);
                      }}
                    />
                  </div>
                </div>
              )}
              {showToast && (
                <Toast
                  show={showToast}
                  message={toastMsg}
                  type="danger"
                  onClose={() => setShowToast(false)}
                />
              )}
          </div>
        </div>
      </div>
  );
}

export default Actividades;
