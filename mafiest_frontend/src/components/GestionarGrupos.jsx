
import React, { useState, useEffect } from 'react'
import ToastNotification from './Notification'
import grupoService from '../services/grupos'
import userService from '../services/user'
import '../styles/gestionar-grupos.css'

const GestionarGrupos = ({ user }) => {
  const [grupos, setGrupos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [nuevoGrupo, setNuevoGrupo] = useState({ nombre: '', descripcion: '' })
  const [mensaje, setMensaje] = useState(null)
  const [grupoEditando, setGrupoEditando] = useState(null)
  const [errorEditarGrupo, setErrorEditarGrupo] = useState(null)

  useEffect(() => {
    const setupAndLoad = async () => {
      if (user && user.token) {
        grupoService.setToken(user.token)
        userService.setToken(user.token)
        await cargarDatos()
      }
    }
    setupAndLoad()
  }, [user])

  const cargarDatos = async () => {
    try {
      const [gruposData, usuariosData] = await Promise.all([
        grupoService.getAll(),
        userService.getAll()
      ])
      setGrupos(gruposData)
      setUsuarios(usuariosData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setMensaje({ tipo: 'error', texto: 'Error al cargar los datos: ' + error.message })
    }
  }
  
  const ModalEditarGrupo = ({ grupo, onSave, onClose, error }) => {
    const [nombre, setNombre] = useState(grupo.nombre)
    const [descripcion, setDescripcion] = useState(grupo.descripcion)
    return (
      <>
        <div className="modal-backdrop" onClick={onClose}></div>
        <div className="modal-editar-grupo">
          <div className="modal-content">
            <h4>Editar Grupo</h4>
            {error && <div className="mensaje error">{error}</div>}
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre del grupo"
            />
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Descripción del grupo"
            />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn-save" onClick={() => onSave(nombre, descripcion)}>Guardar</button>
              <button className="btn-cancel" onClick={onClose}>Cancelar</button>
            </div>
          </div>
        </div>
      </>
    )
  }
  const handleCrearGrupo = async (e) => {
    e.preventDefault()
    try {
      await grupoService.createGrupo(nuevoGrupo)
      setNuevoGrupo({ nombre: '', descripcion: '' })
      cargarDatos()
      setMensaje({ tipo: 'success', texto: 'Grupo creado exitosamente' })
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al crear el grupo' })
    }
  }

  const handleAsignarUsuario = async (grupoId, userId) => {
    try {
      await grupoService.asignarUsuario(grupoId, userId)
      cargarDatos()
      setMensaje({ tipo: 'success', texto: 'Usuario asignado exitosamente' })
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al asignar usuario' })
    }
  }

  const handleRemoverUsuario = async (grupoId, userId) => {
    try {
      await grupoService.removerUsuario(grupoId, userId)
      cargarDatos()
      setMensaje({ tipo: 'success', texto: 'Usuario removido exitosamente' })
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al remover usuario' })
    }
  }

  if (!user || user.rol !== 'administrador') {
    return <div>Acceso no autorizado</div>
  }

  return (
    <div className="gestionar-grupos">
      <div className="row mb-4">
        <div className="col-12 d-flex justify-content-center">
          <div className="text-center position-relative">
            <h1 style={{
              width: '100%',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '2.5rem',
              margin: '2rem 0',
              color: "#ffffff",
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>Gestión de Grupos</h1>
            <div className="heading-underline" style={{
              width: '80px',
              height: '4px',
              background: 'linear-gradient(90deg, #3fa6ff, #6366f1)',
              margin: '-1rem auto 2rem',
              borderRadius: '2px'
            }}></div>
          </div>
        </div>
      </div>

      <ToastNotification
        show={!!mensaje}
        message={mensaje?.texto}
        type={mensaje?.tipo === 'error' ? 'danger' : (mensaje?.tipo || 'default')}
        onClose={() => setMensaje(null)}
        duration={3500}
      />

      {/* El formulario de creación solo se muestra si NO se está editando */}
      {!grupoEditando && (
        <div className="crear-grupo grupo-card">
          <h3 className="gestion-usuarios-list-title text-center" style={{width:'100%',textAlign:'center',fontWeight:'bold',fontSize:'1.5rem'}}>Crear Nuevo Grupo</h3><br />
          <form onSubmit={handleCrearGrupo} autoComplete="off">
            <input
              type="text"
              value={nuevoGrupo.nombre}
              onChange={(e) => setNuevoGrupo({...nuevoGrupo, nombre: e.target.value})}
              placeholder="Nombre del grupo"
              required
              autoComplete="off"
            />
            <textarea
              value={nuevoGrupo.descripcion}
              onChange={(e) => setNuevoGrupo({...nuevoGrupo, descripcion: e.target.value})}
              placeholder="Descripción del grupo"
              autoComplete="off"
            />
            <button type="submit">Crear Grupo</button>
          </form>
        </div>
      )}

      <div className="lista-grupos">
        <h3 className="gestion-usuarios-list-title text-center" style={{width:'100%',textAlign:'center',fontWeight:'bold',fontSize:'1.5rem',color:'#fff'}}>Grupos Existentes</h3><br />
        {grupos.map(grupo => (
          <div key={grupo.id} className="grupo-card">
            <div className="grupo-header" style={{ 
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px'
            }}>
              <div className="grupo-icon" style={{
                width: '50px',
                height: '50px',
                backgroundColor: '#3b82f6',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1rem',
                fontSize: '1.5rem',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
              }}>
                {grupo.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '1.3rem',
                  marginBottom: '0.3rem',
                  color: '#fff'
                }}>
                  {grupo.nombre}
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#94a3b8',
                  margin: 0
                }}>
                  {grupo.usuarios?.length || 0} miembros
                </p>
              </div>
            </div>
            <div className="grupo-descripcion" style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '12px',
              borderLeft: '4px solid #3b82f6'
            }}>
              <h4 style={{ 
                color: '#93c5fd',
                marginBottom: '0.5rem',
                fontSize: '1rem'
              }}>Descripción</h4>
              <p style={{
                color: '#e2e8f0',
                margin: 0,
                lineHeight: '1.6'
              }}>{grupo.descripcion || 'Sin descripción'}</p>
            </div>
            <button
              className="btn btn-primary btn-sm" style={{ fontWeight: 600, borderRadius: '6px', minWidth: '60px', padding: '4px 12px', fontSize: '0.95rem', display: 'inline-block', marginRight: '8px' }}
              onClick={() => setGrupoEditando(grupo)}
            >Editar</button>
            <button
              className="btn btn-primary btn-sm" style={{ fontWeight: 600, borderRadius: '6px', minWidth: '60px', padding: '4px 12px', fontSize: '0.95rem', display: 'inline-block' }}
              onClick={async () => {
                if (window.confirm('¿Seguro que quieres borrar este grupo?')) {
                  try {
                    await grupoService.borrarGrupo(grupo.id)
                    setGrupos(prev => prev.filter(g => g.id !== grupo.id))
                    setMensaje({ tipo: 'success', texto: 'Grupo borrado exitosamente' })
                  } catch (error) {
                    if (error.response && error.response.status === 404) {
                      setGrupos(prev => prev.filter(g => g.id !== grupo.id))
                      setMensaje({ tipo: 'info', texto: 'El grupo ya no existe o ya fue eliminado.' })
                    } else {
                      setMensaje({ tipo: 'error', texto: 'Error al borrar el grupo' })
                    }
                  }
                }
              }}
            >Borrar</button>

            <div className="miembros" style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h5 style={{
                color: '#93c5fd',
                fontSize: '1.1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fas fa-users" style={{ color: '#3b82f6' }}></i>
                Miembros del Grupo
              </h5>
              <div className="miembros-lista" style={{
                display: 'grid',
                gap: '0.75rem'
              }}>
                {grupo.usuarios && grupo.usuarios.map(usuario => (
                  <div key={usuario.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '35px',
                        height: '35px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        color: '#fff'
                      }}>
                        {usuario.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontWeight: '500' }}>{usuario.nombre}</div>
                        <div style={{ 
                          color: '#94a3b8',
                          fontSize: '0.85rem',
                          marginTop: '0.2rem'
                        }}>
                          {usuario.rol}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoverUsuario(grupo.id, usuario.id)}
                      className="btn btn-outline-danger btn-sm"
                      style={{ 
                        borderRadius: '6px',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <i className="fas fa-user-minus"></i>
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="agregar-usuario" style={{
              marginTop: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h5 style={{
                color: '#93c5fd',
                fontSize: '1.1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fas fa-user-plus" style={{ color: '#3b82f6' }}></i>
                Agregar Usuario
              </h5>
              <div style={{
                position: 'relative',
                width: '100%'
              }}>
                <select 
                  onChange={(e) => handleAsignarUsuario(grupo.id, e.target.value)}
                  defaultValue=""
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" disabled>Seleccionar usuario para agregar</option>
                  {usuarios
                    .filter(u => !grupo.usuarios.some(m => m.id === u.id))
                    .map(usuario => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nombre} - ({usuario.rol})
                      </option>
                    ))
                  }
                </select>
                <div style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#3b82f6'
                }}>
                  <i className="fas fa-chevron-down"></i>
                </div>
              </div>
            </div>
          </div>
        ))}
        {grupoEditando && (
          <ModalEditarGrupo
            grupo={grupoEditando}
            error={errorEditarGrupo}
            onSave={async (nombre, descripcion) => {
              try {
                setErrorEditarGrupo(null)
                await grupoService.editarGrupo(grupoEditando.id, { nombre, descripcion })
                setGrupoEditando(null)
                await cargarDatos()
                setMensaje({ tipo: 'success', texto: 'Grupo editado exitosamente' })
              } catch (error) {
                setErrorEditarGrupo(error.response?.data?.error || 'Error al editar el grupo')
              }
            }}
            onClose={() => {
              setGrupoEditando(null)
              setErrorEditarGrupo(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default GestionarGrupos