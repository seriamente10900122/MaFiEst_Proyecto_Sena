import MisNotas from "../pages/MisNotas";
import VerRespuestasActividad from "../pages/VerRespuestasActividad";
import { Routes, Route, Navigate } from "react-router-dom";
import { RutaProtegida, getRutaPrincipal, ROLES_RUTAS } from "./RutaProtegida";
import LandingPage from "../pages/LandingPage";
import Contactanos from "../components/Contactanos";
import SobreNosotros from "../components/SobreNosotros";
import Actividades from "../pages/Actividades";
import ResponderActividades from "../pages/ResponderActividades";
import VerActividadPage from "../pages/VerActividadPage";
import Asesorias from "../pages/Asesorias";
import Login from "../pages/Login";
import RegistroIndependiente from "../pages/RegistroIndependiente";
import Grabaciones from "../pages/Grabaciones";
import GestionAsesorias from "../pages/GestionAsesorias";
import Biblioteca from "../pages/Biblioteca";
import GestionarUsuarios from "../pages/GestionarUsuarios";
import Perfil from "../pages/Perfil";
import Panel from "../pages/Panel";
import GestionGrupos from "../pages/GestionGrupos";

const AppRoutes = ({ user, setUser }) => {
  return (
    <Routes>
      <Route
        path="/ver-respuestas-actividad"
        element={
          <RutaProtegida user={user} rolesPermitidos={['estudiante','docente','administrador','independiente']}>
            <VerRespuestasActividad />
          </RutaProtegida>
        }
      />
      <Route
        path="/ver-actividad"
        element={
          <RutaProtegida user={user} rolesPermitidos={['estudiante','docente','administrador','independiente']}>
            <VerActividadPage />
          </RutaProtegida>
        }
      />
      <Route
        path="/mis-notas"
        element={
          <RutaProtegida user={user} rolesPermitidos={['estudiante','independiente']}>
            <MisNotas user={user} setUser={setUser} />
          </RutaProtegida>
        }
      />
        {/* Ruta protegida para el panel */}
      <Route
        path="/panel"
        element={
          <RutaProtegida user={user} allowedRoles={ROLES_RUTAS.TODOS}>
            <Panel user={user} setUser={setUser} />
          </RutaProtegida>
        }
      />
      <Route
        path="/responder-actividad"
        element={
          <RutaProtegida user={user} rolesPermitidos={['estudiante','docente','administrador','independiente']}>
            <ResponderActividades />
          </RutaProtegida>
        }
      />
      {/* Rutas públicas */}
      <Route 
        path="/" 
        element={!user ? <LandingPage user={user} setUser={setUser} /> : <Navigate to={getRutaPrincipal(user)} replace />} 
      />
      <Route 
        path="/login" 
        element={!user ? <Login setUser={setUser} /> : <Navigate to={getRutaPrincipal(user)} replace />} 
      />
      <Route 
        path="/registro" 
        element={!user ? <RegistroIndependiente user={user} setUser={setUser} /> : <Navigate to={getRutaPrincipal(user)} replace />} 
      />
      <Route 
        path="/sobre-nosotros" 
        element={<SobreNosotros user={user} setUser={setUser} />} 
      />
      <Route 
        path="/contactanos" 
        element={<Contactanos user={user} setUser={setUser} />} 
      />

      {/* Rutas protegidas comunes */}
      <Route
        path="/biblioteca"
        element={
          <RutaProtegida user={user}>
            <Biblioteca user={user} setUser={setUser} />
          </RutaProtegida>
        }
      />
      
      <Route
        path="/grupos"
        element={
          <RutaProtegida user={user} rolesPermitidos={['administrador']}>
            <GestionGrupos user={user} setUser={setUser} />
          </RutaProtegida>
        }
      />
      <Route
        path="/perfil"
        element={
          <RutaProtegida user={user}>
            <Perfil user={user} setUser={setUser} />
          </RutaProtegida>
        }
      />

      {/* Rutas de Administrador */}
      <Route
        path="/usuarios"
        element={
          <RutaProtegida user={user} allowedRoles={ROLES_RUTAS.ADMIN}>
            <GestionarUsuarios user={user} />
          </RutaProtegida>
        }
      />
      <Route
        path="/gestion-asesorias"
        element={
          <RutaProtegida user={user} allowedRoles={ROLES_RUTAS.ADMIN_DOCENTE}>
            <GestionAsesorias user={user} />
          </RutaProtegida>
        }
      />

      {/* Rutas de Actividades */}
      <Route
        path="/actividades/*"
        element={
          <RutaProtegida user={user} allowedRoles={ROLES_RUTAS.TODOS}>
            <Actividades user={user} setUser={setUser} />
          </RutaProtegida>
        }
      />

      {/* Rutas de Grabaciones */}
      <Route
        path="/grabaciones/*"
        element={
          <RutaProtegida user={user} allowedRoles={ROLES_RUTAS.TODOS}>
            <Grabaciones user={user} setUser={setUser} />
          </RutaProtegida>
        }
      />

      {/* Rutas de Asesorías */}
      <Route
        path="/asesorias"
        element={
          <RutaProtegida user={user} allowedRoles={ROLES_RUTAS.TODOS}>
            <Asesorias user={user} setUser={setUser} />
          </RutaProtegida>
        }
      />

      {/* Ruta para cualquier otra dirección */}
      <Route
        path="*"
        element={<Navigate to={user ? getRutaPrincipal(user) : "/"} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;