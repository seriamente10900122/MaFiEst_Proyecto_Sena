import axios from 'axios'
import { BASE_URL } from './config'
import asesoriaService from './asesorias'
import actividadesService from './actividades'

const login = async credentials => {
  try {
    const response = await axios.post(`${BASE_URL}/login`, credentials)
    const data = response.data
    
    // Guardar el token en localStorage
  
      if (data.token) {
      localStorage.setItem('loggedMafiestUser', JSON.stringify(data))
            // 👇 Establece el token global para las próximas peticiones
            asesoriaService.setToken(data.token)
            actividadesService.setToken(data.token)
    }
    
    return {
      ...data,
      userId: data.userId || data.id
    }
  } catch (error) {
    console.error('Error en login:', error)
    throw error
  }
}

export default { login }
