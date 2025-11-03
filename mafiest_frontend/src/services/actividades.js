import axios from 'axios'
import { BASE_URL } from './config'

const baseUrl = `${BASE_URL}/actividades`
let token = null

// --- Token ---
const setToken = newToken => {
  token = `Bearer ${newToken}`
}

// Obtener todas las actividades (generales y grupales)
const obtenerTodas = async () => {
  const config = { headers: { Authorization: token } }
  try {
    const response = await axios.get(`${baseUrl}/mis-actividades`, config)
    return response.data
  } catch (error) {
    console.error('Error al obtener todas las actividades:', error.response || error)
    throw error
  }
}

// --- Obtener actividades ---
// El export default debe ir solo al final del archivo y contener todas las funciones públicas
// Obtener actividades filtradas por grupo
const obtenerPorGrupo = async (grupoId) => {
  const config = { headers: { Authorization: token } }
  const url = grupoId ? `${baseUrl}/mis-actividades?grupoId=${grupoId}` : `${baseUrl}/mis-actividades`;
  try {
    const response = await axios.get(url, config)
    return response.data
  } catch (error) {
    console.error('Error al obtener actividades por grupo:', error.response || error)
    throw error
  }
}

const obtenerPorId = async (id) => {
  const config = { headers: { Authorization: token } }
  try {
    const response = await axios.get(`${baseUrl}/${id}`, config)
    return response.data
  } catch (error) {
    console.error('Error al obtener actividad por ID:', error.response || error)
    throw error
  }
}

const obtenerActividadesGenerales = async () => {
  const config = { headers: { Authorization: token } }
  try {
    const response = await axios.get(`${baseUrl}/generales`, config)
    return response.data
  } catch (error) {
    console.error('Error al obtener actividades generales:', error.response || error)
    throw error
  }
}

const obtenerActividadesGrupales = async () => {
  const config = { headers: { Authorization: token } }
  try {
    const response = await axios.get(`${baseUrl}/grupales`, config)
    return response.data
  } catch (error) {
    console.error('Error al obtener actividades grupales:', error.response || error)
    throw error
  }
}

const obtenerMisActividades = async () => {
  if (!token) {
    console.error('No hay token de autenticación');
    throw new Error('No hay token de autenticación');
  }

  const config = { 
    headers: { Authorization: token },
    validateStatus: function (status) {
      return status >= 200 && status < 300; // Por defecto solo acepta 2xx
    }
  }

  try {
    const response = await axios.get(`${baseUrl}/mis-actividades`, config);
    return response.data;
  } catch (error) {
    console.error('Error al obtener mis actividades:', {
      message: error.message,
      response: error.response ? {
        data: error.response.data,
        status: error.response.status
      } : null
    });
    throw error;
  }
}

const obtenerMisActividadesPorGrupo = async (grupoId) => {
  const config = { headers: { Authorization: token } }
  try {
    const response = await axios.get(`${baseUrl}/mis-actividades?grupoId=${grupoId}`, config)
    return response.data
  } catch (error) {
    console.error('Error al obtener actividades por grupo:', error.response || error)
    throw error
  }
}

const obtenerActividadesDeMiGrupo = async () => {
  const config = { headers: { Authorization: token } }
  try {
    const response = await axios.get(`${baseUrl}/mis-actividades`, config)
    return response.data
  } catch (error) {
    console.error('Error al obtener actividades de mi grupo:', error.response || error)
    throw error
  }
}

// --- Crear, actualizar, eliminar actividades ---
const crearActividad = async newObject => {
  const config = {
    headers: { 
      Authorization: token,
      'Content-Type': 'application/json'
    }
  }
  let dataToSend = { ...newObject }
  try {
    if (newObject.tipo === 'archivo' && (newObject.archivo || newObject.archivoUrl)) {
      const formData = new FormData()
      formData.append('titulo', newObject.titulo)
      formData.append('descripcion', newObject.descripcion)
      formData.append('fechaLimite', newObject.fechaLimite)
      formData.append('tipo', 'archivo')
      formData.append('global', String(newObject.global))
      if (newObject.archivo) formData.append('archivo', newObject.archivo)
      if (newObject.archivoUrl) formData.append('archivoUrl', newObject.archivoUrl)
      if (newObject.grupoId) formData.append('grupoId', newObject.grupoId)
      dataToSend = formData
      config.headers['Content-Type'] = 'multipart/form-data'
    } else if (newObject.tipo === 'formulario') {
      if (Array.isArray(newObject.preguntas)) {
        dataToSend = {
          ...dataToSend,
          preguntas: newObject.preguntas.map(pregunta => ({
            pregunta: pregunta.pregunta,
            opciones: pregunta.opciones,
            esCorrecta: pregunta.esCorrecta
          }))
        }
      }
    }
    const response = await axios.post(baseUrl, dataToSend, config)
    return response.data
  } catch (error) {
    console.error('Error al crear actividad:', error.response || error)
    throw error
  }
}

const actualizarActividad = async (id, updatedObject) => {
  const config = { headers: { Authorization: token } }
  let dataToSend = updatedObject
  try {
    if (updatedObject.tipo === 'archivo' && (updatedObject.archivo || updatedObject.archivoUrl)) {
      const formData = new FormData()
      formData.append('titulo', updatedObject.titulo)
      formData.append('descripcion', updatedObject.descripcion)
      formData.append('fechaLimite', updatedObject.fechaLimite)
      formData.append('tipo', 'archivo')
      formData.append('global', String(updatedObject.global))
      if (updatedObject.archivo) formData.append('archivo', updatedObject.archivo)
      if (updatedObject.archivoUrl) formData.append('archivoUrl', updatedObject.archivoUrl)
      if (updatedObject.grupoId) formData.append('grupoId', updatedObject.grupoId)
      dataToSend = formData
      config.headers['Content-Type'] = 'multipart/form-data'
    } else if (updatedObject.tipo === 'formulario') {
      if (updatedObject.archivo) {
        const formData = new FormData()
        formData.append('titulo', updatedObject.titulo)
        formData.append('descripcion', updatedObject.descripcion)
        formData.append('fechaLimite', updatedObject.fechaLimite)
        formData.append('tipo', 'formulario')
        formData.append('global', String(updatedObject.global))
        if (updatedObject.archivo) formData.append('archivo', updatedObject.archivo)
        if (updatedObject.archivoUrl) formData.append('archivoUrl', updatedObject.archivoUrl)
        if (updatedObject.grupoId) formData.append('grupoId', updatedObject.grupoId)
        if (Array.isArray(updatedObject.preguntas)) {
          formData.append('preguntas', JSON.stringify(updatedObject.preguntas))
        }
        dataToSend = formData
        config.headers['Content-Type'] = 'multipart/form-data'
      } else if (Array.isArray(updatedObject.preguntas)) {
        dataToSend = {
          ...dataToSend,
          preguntas: updatedObject.preguntas
        }
      }
    }
    const response = await axios.put(`${baseUrl}/${id}`, dataToSend, config)
    return response.data
  } catch (error) {
    console.error('Error al actualizar actividad:', error.response || error)
    throw error
  }
}

const eliminarActividad = async (id) => {
  const config = { headers: { Authorization: token } }
  try {
    const response = await axios.delete(`${baseUrl}/${id}`, config)
    return response.data
  } catch (error) {
    console.error('Error al eliminar actividad:', error.response || error)
    throw error
  }
}

// --- Responder y calificar actividades ---
const responderActividad = async (id, respuesta) => {
  const config = { headers: { Authorization: token } }
  try {
    let dataToSend;
    if (respuesta.archivo || respuesta.respuestaTexto) {
      const formData = new FormData()
      if (respuesta.archivo) formData.append('archivo', respuesta.archivo)
      if (respuesta.respuestaTexto) formData.append('respuestaTexto', respuesta.respuestaTexto)
      dataToSend = formData
      config.headers['Content-Type'] = 'multipart/form-data'
    } else {
      dataToSend = { respuestas: respuesta.respuestas }
      config.headers['Content-Type'] = 'application/json'
    }
    const response = await axios.post(`${baseUrl}/${id}/respuestas`, dataToSend, config)
    return response.data
  } catch (error) {
    console.error('Error al responder actividad:', error.response || error)
    throw error
  }
}

const calificarRespuesta = async (respuestaId, calificacion) => {
  const config = { headers: { Authorization: token, 'Content-Type': 'application/json' } }
  try {
    const response = await axios.put(`${baseUrl}/respuestas/${respuestaId}/calificar`, calificacion, config)
    return response.data
  } catch (error) {
    console.error('Error al calificar respuesta:', error.response || error)
    throw error
  }
}

const obtenerRespuestasActividad = async (actividadId) => {
  const config = { headers: { Authorization: token } }
  try {
    const response = await axios.get(`${baseUrl}/${actividadId}/respuestas`, config)
    return response.data
  } catch (error) {
    console.error('Error al obtener respuestas de la actividad:', error.response || error)
    throw error
  }
}

// ...existing code...
export default {
  setToken,
  obtenerTodas,
  obtenerPorGrupo,
  obtenerPorId,
  obtenerActividadesGenerales,
  obtenerActividadesGrupales,
  obtenerMisActividades,
  obtenerMisActividadesPorGrupo,
  obtenerActividadesDeMiGrupo,
  crearActividad,
  actualizarActividad,
  eliminarActividad,
  responderActividad,
  obtenerRespuestasActividad,
  calificarRespuesta
}
