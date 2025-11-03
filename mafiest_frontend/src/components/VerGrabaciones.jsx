import { useEffect, useState } from 'react'
import grabacionesService from '../services/grabaciones'
import GrabacionCard from './GrabacionCard'
import FiltroGrupos from './FiltroGrupos'
import ToastNotification from './Notification'

const VerGrabaciones = ({ user, grabaciones, setGrabaciones, onEdit, onDelete }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [grupoFiltrado, setGrupoFiltrado] = useState('')
  const [showNotif, setShowNotif] = useState(false)
  const [accionMsg, setAccionMsg] = useState('')
  const [fade, setFade] = useState(false)
  // Mostrar botón de "mis grupos" para docentes y estudiantes
  const puedeFiltrarPorGrupo = user?.rol === 'docente' || user?.rol === 'estudiante';
  const [soloMisGrupos, setSoloMisGrupos] = useState(false)
  // Mensaje de notificación según filtro
  const notifMsg = grupoFiltrado
    ? `Mostrando grabaciones del grupo seleccionado`
    : soloMisGrupos
      ? `Mostrando grabaciones de tus grupos`
      : `Mostrando todas las grabaciones`

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true)
        let data = [];
        if (grupoFiltrado) {
          // Si hay grupo seleccionado, filtrar por ese grupo
          data = await grabacionesService.obtenerGrabacionesDeMiGrupo();
          data = data.filter(g => String(g.grupoId) === String(grupoFiltrado));
        } else if (soloMisGrupos) {
          // Si está activado "mis grupos", traer solo grabaciones de mis grupos
          data = await grabacionesService.obtenerGrabacionesDeMiGrupo();
        } else {
          // Si no, traer todas las grabaciones generales
          data = await grabacionesService.obtenerGrabacionesGenerales();
        }
        setGrabaciones(data)
        setError(null)
      } catch (err) {
        setError('No se pudieron cargar las grabaciones')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [setGrabaciones, soloMisGrupos, grupoFiltrado])

  // Fade effect y notificación en filtro/carga
  useEffect(() => {
    setFade(true)
    setShowNotif(true)
    const timer = setTimeout(() => setFade(false), 350)
    const notifTimer = setTimeout(() => setShowNotif(false), 3500)
    return () => {
      clearTimeout(timer)
      clearTimeout(notifTimer)
    }
  }, [grupoFiltrado])

  // Mostrar notificación al cargar la vista
  useEffect(() => {
    setShowNotif(true)
    const notifTimer = setTimeout(() => setShowNotif(false), 3500)
    return () => clearTimeout(notifTimer)
  }, [])

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 180 }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
    </div>
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>
  }

  // Las grabaciones ya vienen filtradas según el grupo o "mis grupos" desde el useEffect
  let grabacionesFiltradas = grabaciones;

  return (
    <div style={{ padding: 24 }}>
      <h2>Ver Grabaciones</h2>
      {puedeFiltrarPorGrupo && (
        <div style={{ marginBottom: 16 }}>
          <button
            className={`btn btn-outline-primary${!soloMisGrupos ? ' active' : ''}`}
            onClick={() => { setSoloMisGrupos(false); setGrupoFiltrado(''); }}
            style={{ marginRight: 8 }}
          >
            Todas
          </button>
          <button
            className={`btn btn-outline-primary${soloMisGrupos ? ' active' : ''}`}
            onClick={() => { setSoloMisGrupos(true); setGrupoFiltrado(''); }}
          >
            Grabaciones de mis grupos
          </button>
        </div>
      )}
      {/* Selector de grupo para docentes y estudiantes */}
      {(user.rol === 'docente' || user.rol === 'estudiante') && (
        <FiltroGrupos user={user} onGrupoChange={id => setGrupoFiltrado(id)} />
      )}
      <h2 style={{margin: '32px 0 24px 0', textAlign: 'center', color: grupoFiltrado ? '#0d6efd' : soloMisGrupos ? '#0d6efd' : '#198754'}}>
        {grupoFiltrado
          ? '🔵 Grabaciones del grupo seleccionado'
          : soloMisGrupos
            ? '🔵 Grabaciones de mis grupos'
            : '🟢 Todas las grabaciones disponibles'}
      </h2>
      <div className={`row transition-fade${fade ? ' fade' : ''}`} style={{ minHeight: 120 }}>
        <h4 className="mb-3 text-primary">
          {grupoFiltrado
            ? `Grabaciones del grupo seleccionado`
            : soloMisGrupos
              ? `Grabaciones de tus grupos`
              : `Todas las grabaciones disponibles`}
        </h4>
        {grabacionesFiltradas.length === 0 ? (
          <div className="text-muted">No hay grabaciones para mostrar.</div>
        ) : (
          grabacionesFiltradas.map(g => (
            <div key={g.id} className="col-12 col-md-6 mb-3">
              <GrabacionCard
                grabacion={g}
                onEdit={onEdit}
                onDelete={onDelete}
                user={user}
              />
            </div>
          ))
        )}
      </div>
      <style>{`
        .transition-fade.fade {
          opacity: 0.3;
          transition: opacity 0.35s;
        }
        .transition-fade {
          opacity: 1;
          transition: opacity 0.35s;
        }
      `}</style>
    </div>
  )
}

export default VerGrabaciones