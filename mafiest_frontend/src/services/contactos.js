import axios from 'axios'
const baseUrl = '/api/contactanos'

const crearContacto = async (nuevoContacto) => {
  const response = await axios.post(baseUrl, nuevoContacto)
  return response.data
}

const getAll = async () => {
  const response = await axios.get(baseUrl)
  return response.data
}

export default { crearContacto, getAll }
