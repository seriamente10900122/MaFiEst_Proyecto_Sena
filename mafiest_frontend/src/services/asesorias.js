import axios from 'axios'
import { BASE_URL } from './config'

let token = null

const setToken = newToken => {
  token = `Bearer ${newToken}`
}
// Asignar asesoría a solicitud pendiente (solo admin)
const asignar = async (solicitudId, datos) => {
  const config = {
    headers: { Authorization: token }
  }
  const response = await axios.post(`${BASE_URL}/asesorias/asignar/${solicitudId}`, datos, config);
  return response.data;
}
// Solicitar asesoría (estudiante/independiente)
const solicitar = async (solicitud) => {
  const config = {
    headers: { Authorization: token }
  }
  const response = await axios.post(`${BASE_URL}/asesorias/solicitar`, solicitud, config);
  return response.data;
}

// Obtener todas las asesorías (solo admin)
const getAll = async () => {
  const config = {
    headers: { Authorization: token }
  }
  const response = await axios.get(`${BASE_URL}/asesorias`, config)
  return response.data
}

// Obtener asesorías de un usuario específico
const getByUser = async (userId) => {
  const config = {
    headers: { Authorization: token }
  }
  const response = await axios.get(`${BASE_URL}/asesorias/user/${userId}`, config)
  return response.data
}

// Obtener asesorías del usuario actual
const getMisAsesorias = async () => {
  const config = {
    headers: { Authorization: token }
  }
  const response = await axios.get(`${BASE_URL}/asesorias/mis-asesorias`, config)
  return response.data
}

// Crear una nueva asesoría (envía docenteNombre si existe)
const create = async (asesoria) => {
  const config = {
    headers: { Authorization: token }
  }
  // Si existe nombreDocente, lo envía como docenteNombre
  const payload = { ...asesoria };
  if (asesoria.nombreDocente) {
    payload.docenteNombre = asesoria.nombreDocente;
    delete payload.nombreDocente;
  }
  const response = await axios.post(`${BASE_URL}/asesorias`, payload, config);
  return response.data;
}

// Actualizar una asesoría (incluye responder)
const update = async (id, asesoria) => {
  const config = {
    headers: { Authorization: token }
  }
  const response = await axios.put(`${BASE_URL}/asesorias/${id}`, asesoria, config)
  return response.data
}

// Responder una asesoría (específico para admin)
const responder = async (id, respuesta) => {
  const config = {
    headers: { Authorization: token }
  }
  const response = await axios.post(`${BASE_URL}/asesorias/${id}/responder`, respuesta, config)
  return response.data
}

// Eliminar una asesoría
const remove = async (id) => {
  const config = {
    headers: { Authorization: token }
  }
  const response = await axios.delete(`${BASE_URL}/asesorias/${id}`, config)
  return response.data
}

// Obtener asesorías pendientes (solo admin)
const getPendientes = async () => {
  const config = {
    headers: { Authorization: token }
  }
  const response = await axios.get(`${BASE_URL}/asesorias/pendientes`, config)
  return response.data
}

export default {
  setToken,
  getAll,
  getByUser,
  getMisAsesorias,
  create,
  update,
  responder,
  remove,
  getPendientes,
  solicitar
  ,asignar
}