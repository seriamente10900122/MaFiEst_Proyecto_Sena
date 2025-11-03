import axios from 'axios'
import { BASE_URL } from './config'

const baseUrl = `${BASE_URL}/grupos`

let token = null

const setToken = newToken => {
  token = `Bearer ${newToken}`
}

// Obtener todos los grupos con sus miembros
const getAll = async () => {
  const config = {
    headers: { Authorization: token }
  }
  const response = await axios.get(baseUrl, config)
  return response.data
}

// Crear nuevo grupo (solo admin)
const createGrupo = async (grupoData) => {
  const config = {
    headers: { Authorization: token }
  }
  const response = await axios.post(baseUrl, grupoData, config)
  return response.data
}

// Asignar usuario a grupo (solo admin)
const asignarUsuario = async (grupoId, userId) => {
  const config = {
    headers: { Authorization: token }
  }
  const response = await axios.post(`${baseUrl}/${grupoId}/usuarios`, { userId }, config)
  return response.data
}

// Remover usuario de grupo (solo admin)
const removerUsuario = async (grupoId, userId) => {
  const config = {
    headers: { Authorization: token }
  }
  const response = await axios.delete(`${baseUrl}/${grupoId}/usuarios/${userId}`, config)
  return response.data
}

// Editar grupo (solo admin)
const editarGrupo = async (grupoId, datosActualizados) => {
  const config = {
    headers: { Authorization: token }
  }
  const response = await axios.put(`${baseUrl}/${grupoId}`, datosActualizados, config)
  return response.data
}

// Borrar grupo (solo admin)
const borrarGrupo = async (grupoId) => {
  const config = {
    headers: { Authorization: token }
  }
  const response = await axios.delete(`${baseUrl}/${grupoId}`, config)
  return response.data
}

const grupoService = {
  setToken,
  getAll,
  createGrupo,
  asignarUsuario,
  removerUsuario,
  editarGrupo,
  borrarGrupo
}

export default grupoService