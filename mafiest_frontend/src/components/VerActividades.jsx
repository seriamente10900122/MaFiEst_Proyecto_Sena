import { useState, useEffect } from "react"
import actividadesService from "../services/actividades"
import ResponderActividad from './ResponderActividad'
import FiltroGrupos from './FiltroGrupos';
import '../styles/respuestaactividad.css';

const VerActividades = ({ user, actividades, setActividades }) => {
  const [mensaje, setMensaje] = useState(null)
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('')

  // Si no existe, solo filtra globales y grupales correctamente
  useEffect(() => {
    const cargarActividades = async () => {
      if (user?.token) {
        try {
          const visibles = await actividadesService.obtenerPorGrupo(
            grupoSeleccionado || null
          );
          if (Array.isArray(visibles)) {
            setActividades(visibles)
            if (visibles.length === 0) {
              setMensaje("No hay actividades disponibles")
            }
          } else {
            console.error('La respuesta no es un array:', visibles)
            setMensaje("Error al cargar las actividades")
          }
        } catch (error) {
          console.error('Error al cargar actividades:', error)
          setMensaje("Error al cargar las actividades")
        }
      }
    }
    cargarActividades()
  }, [user?.token, setActividades, grupoSeleccionado])

  const handleResponderPregunta = async (actividadId, preguntaIndex, respuestaIndex) => {
    try {
      const actividadActualizada = await actividadesService.responderActividad(actividadId, preguntaIndex, respuestaIndex)
      if (actividadActualizada) {
        setActividades(actividades.map(act =>
          act.id === actividadId ? actividadActualizada : act
        ))
        const pregunta = actividadActualizada.preguntas[preguntaIndex]
        const respuestaUsuario = pregunta.respuestas?.find(r => r.usuarioId === user.id)
        const esCorrecta = pregunta.opciones[respuestaUsuario?.seleccion]?.esCorrecta
        setMensaje(esCorrecta ? "¡Correcto!" : "Incorrecto.")
      }
    } catch (error) {
      console.error('Error al responder:', error)
      setMensaje(error?.response?.data?.error || "Error al enviar la respuesta")
    }
    setTimeout(() => setMensaje(null), 3000)
  }

  // Usar función centralizada para filtrar actividades según el rol
  const actividadesFiltradas = filtrarActividadesPorRolYEstado(actividades, user);
  const actividadesPendientes = actividadesFiltradas.disponibles;

  return (
    <div className="actividades-container">
      <h2>Actividades Disponibles</h2>
      {mensaje && (
        <p className={`mensaje ${mensaje.includes("Error") ? "error" : "success"}`}>
          {mensaje}
        </p>
      )}

      {/* Selector de grupo para docentes y estudiantes */}
      {(user.rol === 'docente' || user.rol === 'estudiante') && (
        <FiltroGrupos user={user} onGrupoChange={id => setGrupoSeleccionado(id)} />
      )}

      {actividadesPendientes.length === 0 ? (
        <p className="sin-actividades">¡No tienes actividades pendientes!</p>
      ) : (
        <ul className="actividades-lista">
          {actividadesPendientes.map(actividad => (
            <li key={actividad.id} className="actividad-item">
              <div className="actividad-header">
                <h3>{actividad.titulo}</h3>
                <span className="estado pendiente">Pendiente</span>
                <span style={{ marginLeft: 12, fontSize: 13, color: actividad.global ? '#e94560' : '#1a2238', fontWeight: 600 }}>
                  {actividad.global ? 'Global (Administrador)' : (actividad.autor?.rol === 'docente' ? 'Docente' : '')}
                </span>
                <span style={{ marginLeft: 12, fontSize: 13, color: '#888' }}>
                  {actividad.tipo === 'archivo' ? 'Archivo' : 'Formulario'}
                </span>
              </div>
              <p className="descripcion">{actividad.descripcion}</p>
              <p className="fecha">Fecha límite: {new Date(actividad.fechaLimite).toLocaleDateString()}</p>
              <p className="profesor">Asignado por: {actividad.autor?.name || actividad.autor?.username || 'Desconocido'}</p>

              {actividad.tipo === 'archivo' && actividad.archivoUrl && (
                <div style={{ margin: '8px 0' }}>
                  <a href={actividad.archivoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#e94560', fontWeight: 600 }}>
                    Descargar/Ver archivo
                  </a>
                </div>
              )}
              {actividad.tipo === 'archivo' && (
                <ResponderActividad actividad={actividad} user={user} />
              )}

              {actividad.tipo === 'formulario' && (
                <div className="preguntas-container">
                  {actividad.preguntas?.map((pregunta, preguntaIndex) => {
                    const respuestaUsuario = pregunta.respuestas?.find(r => r.usuarioId === user.id)
                    return (
                      <div key={preguntaIndex} className="pregunta-item">
                        <h4>Pregunta {preguntaIndex + 1}: {pregunta.pregunta}</h4>
                        <div className="opciones-lista">
                          {pregunta.opciones.map((opcion, opcionIndex) => (
                            <button
                              key={opcionIndex}
                              onClick={() => handleResponderPregunta(actividad.id, preguntaIndex, opcionIndex)}
                              disabled={!!respuestaUsuario}
                              className={`opcion-btn ${
                                respuestaUsuario?.seleccion === opcionIndex ? 'respondida' : ''
                              }`}
                            >
                              {opcion.texto}
                            </button>
                          ))}
                        </div>
                        {respuestaUsuario && (
                          <p className="respuesta-info">
                            Tu respuesta: {pregunta.opciones[respuestaUsuario.seleccion]?.texto}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default VerActividades