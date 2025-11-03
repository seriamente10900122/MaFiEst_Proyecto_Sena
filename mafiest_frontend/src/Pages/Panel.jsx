import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/panel.css';

const Panel = ({ user, setUser }) => {
  if (!user) {
    return <p>No tienes acceso a este panel. Inicia sesión primero.</p>;
  }

  return (
    <div>
      <Navbar user={user} setUser={setUser} />
      <div className="panel-wrapper">
        <div className="panel-card">
          <h1 className="panel-title">Panel de {user.rol}</h1>
          <div className="panel-buttons">

            {user.rol === 'administrador' && (
              <div className="panel-buttons-grid">
                <Link to="/usuarios" className="panel-btn">👥 Gestión de Usuarios</Link>
                <Link to="/grupos" className="panel-btn">🧩 Gestión de Grupos</Link>
                <Link to="/gestion-asesorias" className="panel-btn">📅 Gestión de Asesorías</Link>
                <Link to="/actividades" className="panel-btn">📄 Gestión de Actividades</Link>
                <Link to="/grabaciones" className="panel-btn">🎥 Gestión de Grabaciones</Link>
                <Link to="/perfil" className="panel-btn">👤 Mi Perfil</Link>
              </div>
            )}

            {user.rol === 'docente' && (
              <div className="panel-buttons-grid">
                <Link to="/gestion-asesorias" className="panel-btn">📅 Gestión de Asesorías</Link>
                <Link to="/actividades" className="panel-btn">📄 Gestión de Actividades</Link>
                <Link to="/grabaciones" className="panel-btn">🎥 Gestión de Grabaciones</Link>
                <Link to="/biblioteca" className="panel-btn">📚 Biblioteca</Link>
                <Link to="/perfil" className="panel-btn">👤 Mi Perfil</Link>
              </div>
            )}

            {user.rol === 'estudiante' && (
              <div className="panel-buttons-grid">
                <Link to="/asesorias" className="panel-btn">📅 Solicitar Asesoría</Link>
                <Link to="/grabaciones/ver" className="panel-btn">▶️ Ver Grabaciones</Link>
                <Link to="/actividades" className="panel-btn">📄 Mis Actividades</Link>
                <Link to="/mis-notas" className="panel-btn">📄 Mis Notas</Link>
                <Link to="/perfil" className="panel-btn">👤 Mi Perfil</Link>
              </div>
            )}

            {user.rol === 'independiente' && (
              <div className="panel-buttons-grid">
                <Link to="/asesorias" className="panel-btn">📅 Solicitar Asesoría</Link>
                <Link to="/grabaciones/ver" className="panel-btn">▶️ Ver Grabaciones</Link>
                <Link to="/actividades/ver" className="panel-btn">📝 Mis Actividades</Link>
                <Link to="/mis-notas" className="panel-btn">📄 Mis Notas</Link>
                <Link to="/perfil" className="panel-btn">👤 Mi Perfil</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Panel;
