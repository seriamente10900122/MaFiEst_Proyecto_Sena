import { useState, useEffect } from 'react'
import './styles/styles.css';
import AppRoutes from "./routes/AppRoutes"
import gruposService from './services/grupos';
import grabacionesService from './services/grabaciones';
import asesoriasService from './services/asesorias';
import actividadesService from './services/actividades';

const App = () => {
  const [user, setUser] = useState(null)

  // Cargar usuario desde localStorage al montar
  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedMafiestUser')
    if (loggedUserJSON) {
      const userData = JSON.parse(loggedUserJSON)
      setUser(userData)

      // Configurar el token en todos los servicios
      if (userData.token) {
        gruposService.setToken(userData.token)
        grabacionesService.setToken(userData.token)
        asesoriasService.setToken(userData.token)
        actividadesService.setToken(userData.token)
      }
    }
  }, [])

  // Configurar token cada vez que el usuario cambia
  useEffect(() => {
    if (user && user.token) {
      gruposService.setToken(user.token)
      grabacionesService.setToken(user.token)
      asesoriasService.setToken(user.token)
      actividadesService.setToken(user.token)
    }
  }, [user])

  return (
    <div className="page-bg">
      <AppRoutes user={user} setUser={setUser} />
    </div>
  )
}

export default App
