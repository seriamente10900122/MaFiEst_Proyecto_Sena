import React, { useState, useEffect } from 'react';
import grupoService from '../services/grupos';
import Toast from './Notification';
import '../styles/crear-actividad.css';

const CrearActividad = ({ onCrear, onEditar, actividadInicial, modo, onCancelar }) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [tipo, setTipo] = useState('archivo');
  const [archivo, setArchivo] = useState(null);
  // Detectar rol del usuario desde localStorage
  const user = JSON.parse(window.localStorage.getItem('loggedMafiestUser') || '{}');
  const isAdmin = user.rol === 'administrador';
  const disableGlobalOrGrupo = isAdmin && modo === 'editar';
  // Si es admin, inicialmente es global. Si es docente, siempre es grupal
  const [global, setGlobal] = useState(isAdmin ? true : false);
  const [grupoId, setGrupoId] = useState('');
  const [preguntas, setPreguntas] = useState([{ 
    pregunta: '', 
    opciones: ['', '', '', ''], 
    esCorrecta: 0 
  }]);
  const [grupos, setGrupos] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'danger' });
  useEffect(() => {
    grupoService.getAll().then(data => {
      setGrupos(data.filter(g => g.id && g.nombre));
    });
  }, []);

  useEffect(() => {
    if (actividadInicial && modo === 'editar') {
      setTitulo(actividadInicial.titulo || '');
      setDescripcion(actividadInicial.descripcion || '');
      setFechaLimite(actividadInicial.fechaLimite ? new Date(actividadInicial.fechaLimite).toISOString().split('T')[0] : '');
      setTipo(actividadInicial.tipo || 'archivo');
      setGlobal(actividadInicial.global !== undefined ? actividadInicial.global : true);
      setGrupoId(actividadInicial.grupoId || '');
      if (actividadInicial.preguntas && actividadInicial.preguntas.length > 0) {
        setPreguntas(actividadInicial.preguntas);
      }
    }
  }, [actividadInicial, modo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    let fechaValida = fechaLimite;
    if (fechaValida) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const [year, month, day] = fechaValida.split('-');
      const fechaSeleccionada = new Date(year, month - 1, day);
      fechaSeleccionada.setHours(0, 0, 0, 0);
      // Validar que no sea en el pasado
      if (fechaSeleccionada.getTime() < hoy.getTime()) {
        setToast({ show: true, message: 'No puedes elegir una fecha de vencimiento en el pasado', type: 'danger' });
        return;
      }
    }
    // Si el usuario es docente, grupoId es obligatorio
    if (user.rol === 'docente' && (!grupoId || grupoId === '')) {
      setToast({ show: true, message: 'Como docente debes seleccionar un grupo para la actividad.', type: 'danger' });
      return;
    }
    if (!global && (!grupoId || grupoId === '')) {
      setToast({ show: true, message: 'Debes seleccionar un grupo para la actividad.', type: 'danger' });
      return;
    }
    // Validar tipo de archivo permitido
    if (tipo === 'archivo' && archivo) {
      const tiposPermitidos = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!tiposPermitidos.includes(archivo.type)) {
        setToast({ show: true, message: 'Tipo de archivo no permitido. Solo se permite PDF o Word.', type: 'danger' });
        return;
      }
    }
    const actividadData = {
      titulo,
      descripcion,
      fechaLimite: fechaValida,
      tipo,
      archivo: tipo === 'archivo' ? archivo : undefined,
      preguntas: tipo === 'formulario' ? preguntas : undefined,
      global,
      grupoId: global ? null : (grupoId ? Number(grupoId) : null),
      ...(tipo === 'formulario' && {
        preguntas: preguntas.map(p => ({
          pregunta: p.pregunta,
          opciones: p.opciones,
          esCorrecta: p.esCorrecta
        }))
      })
    };

    if (modo === 'editar') {
      onEditar(actividadData);
    } else {
      onCrear(actividadData);
    }
    // Limpiar el formulario
    setTitulo('');
    setDescripcion('');
    setFechaLimite('');
    setArchivo(null);
    setPreguntas([{ pregunta: '', opciones: ['', '', '', ''], esCorrecta: 0 }]);
  };

  const agregarPregunta = () => {
    setPreguntas([...preguntas, { 
      pregunta: '', 
      opciones: ['', '', '', ''], 
      esCorrecta: 0 
    }]);
  };

  const eliminarPregunta = (index) => {
    if (preguntas.length > 1) {
      setPreguntas(preguntas.filter((_, i) => i !== index));
    }
  };

  const actualizarPregunta = (index, campo, valor) => {
    const nuevasPreguntas = [...preguntas];
    if (campo === 'pregunta') {
      nuevasPreguntas[index].pregunta = valor;
    } else if (campo.startsWith('opcion')) {
      const opcionIndex = parseInt(campo.replace('opcion', ''));
      nuevasPreguntas[index].opciones[opcionIndex] = valor;
    } else if (campo === 'esCorrecta') {
      nuevasPreguntas[index].esCorrecta = parseInt(valor);
    }
    setPreguntas(nuevasPreguntas);
  };

  return (
    <>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
      <form onSubmit={handleSubmit}>
        <div>
          <div className="card-header d-flex justify-content-between align-items-center" style={{background:'transparent', border:'none'}}>
            <h2 className="form-title h5 mb-0" style={{color:'#3fa6ff', fontWeight:'bold', fontSize:'1.5rem', textShadow:'0 2px 8px #0004'}}>
              {modo === 'editar' ? 'Editar Actividad' : 'Crear Nueva Actividad'}
            </h2>
          </div>
          <div className="card-body" style={{background:'transparent', color:'#fff', fontWeight:'bold', fontSize:'1.1rem', letterSpacing:'0.5px'}}>
            <div className="form-group mb-3">
              <label htmlFor="titulo" className="form-label" style={{color:"#fff"}}>Título:</label>
              <input
                id="titulo"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                required
                className="form-control"
                placeholder="Ingrese el título de la actividad"
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="descripcion" className="form-label" style={{color:"#fff"}}>Descripción:</label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                required
                className="form-control"
                rows="4"
                placeholder="Describa la actividad"
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="fechaLimite" className="form-label" style={{color:"#fff"}}>Fecha Límite:</label>
              <input
                id="fechaLimite"
                type="date"
                value={fechaLimite}
                onChange={e => setFechaLimite(e.target.value)}
                required
                className="form-control"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="tipo" className="form-label" style={{color:"#fff"}}>Tipo de Actividad:</label>
              <select
                id="tipo"
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                className="form-control"
                disabled={modo === 'editar'}
              >
                <option value="archivo">Entrega de Archivo</option>
                <option value="formulario">Formulario de Preguntas</option>
              </select>
            </div>
            {Array.isArray(grupos) && grupos.length > 0 && !global && (
              <div className="form-group mb-3">
                <label htmlFor="grupoId" className="form-label" style={{color:"#fff"}}>Grupo</label>
                <select
                  id="grupoId"
                  value={grupoId}
                  onChange={e => setGrupoId(e.target.value)}
                  className="form-control"
                  required
                  disabled={modo === 'editar'}
                >
                  <option value="">Selecciona un grupo</option>
                  {grupos.map(grupo => (
                    <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
                  ))}
                </select>
                {grupoId && grupos.find(g => String(g.id) === String(grupoId)) && (
                  <div className="alert alert-info mt-2 p-2">
                    <strong>Grupo seleccionado:</strong> {grupos.find(g => String(g.id) === String(grupoId)).nombre}
                  </div>
                )}
              </div>
            )}
            {isAdmin && (
              <div className="form-group mb-3">
                <label className="form-label" style={{color:"#fff"}}>¿Actividad global?</label>
                <div>
                  <input
                    type="checkbox"
                    id="global"
                    checked={global}
                    onChange={e => setGlobal(e.target.checked)}
                    disabled={disableGlobalOrGrupo}
                  />
                  <label htmlFor="global" className="ms-2" style={{color:"#fff"}}>Sí (visible para todos los grupos)</label>
                </div>
              </div>
            )}
            {tipo === 'archivo' && (
              <div className="form-group mb-3">
                <label htmlFor="archivo" className="form-label" style={{color:"#fff"}}>Archivo de la Actividad:</label>
                <input
                  id="archivo"
                  type="file"
                  onChange={e => setArchivo(e.target.files[0])}
                  className="form-control"
                  style={{
                    background: '#232b47',
                    color: '#3fa6ff',
                    border: '1.5px solid #3fa6ff',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    padding: '0.5rem',
                    borderRadius: '8px',
                  }}
                />
                {archivo && (
                  <div style={{color:'#3fa6ff', marginTop:'0.5rem', fontWeight:'bold'}}>
                    Archivo seleccionado: {archivo.name}
                  </div>
                )}
                <small className="form-text text-muted">
                  Sube un archivo con las instrucciones o material necesario
                </small>
              </div>
            )}
            {tipo === 'formulario' && (
              <div className="preguntas-section">
                <h5 className="mb-3">Preguntas del Formulario</h5>
                {preguntas.map((pregunta, preguntaIndex) => (
                  <div key={preguntaIndex} className="card mb-3">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">Pregunta {preguntaIndex + 1}</h6>
                        {preguntas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => eliminarPregunta(preguntaIndex)}
                            className="btn btn-outline-danger btn-sm"
                          >
                            <i className="fas fa-trash me-1"></i>
                            Eliminar
                          </button>
                        )}
                      </div>
                      <div className="form-group mb-3">
                        <input
                          value={pregunta.pregunta}
                          onChange={e => actualizarPregunta(preguntaIndex, 'pregunta', e.target.value)}
                          placeholder="Escriba la pregunta"
                          className="form-control"
                          required
                        />
                      </div>
                      {pregunta.opciones.map((opcion, opcionIndex) => (
                        <div key={opcionIndex} className="d-flex align-items-center mb-2">
                          <div className="form-check me-2">
                            <input
                              type="radio"
                              className="form-check-input"
                              name={`correcta-${preguntaIndex}`}
                              value={opcionIndex}
                              checked={pregunta.esCorrecta === opcionIndex}
                              onChange={e => actualizarPregunta(preguntaIndex, 'esCorrecta', e.target.value)}
                              required
                            />
                          </div>
                          <input
                            value={opcion}
                            onChange={e => actualizarPregunta(preguntaIndex, `opcion${opcionIndex}`, e.target.value)}
                            placeholder={`Opción ${opcionIndex + 1}`}
                            className="form-control"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={agregarPregunta}
                  className="btn btn-outline-primary mb-3"
                  style={{ marginBottom: "8px" }}
                >
                  <i className="fas fa-plus me-1"></i>
                  Agregar Pregunta
                </button>
              </div>
            )}
          </div>
          <div className="card-footer">
            <div className="d-flex justify-content-end gap-2">
              <button 
                type="button" 
                className="btn btn-secondary"
                style={{ marginBottom: "8px" }} 
                onClick={onCancelar}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {modo === 'editar' ? 'Guardar Cambios' : 'Crear Actividad'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default CrearActividad;
