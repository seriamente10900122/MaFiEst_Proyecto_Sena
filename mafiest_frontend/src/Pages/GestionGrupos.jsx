import React from 'react';
import { Navigate } from 'react-router-dom';
import GestionarGrupos from '../components/GestionarGrupos';
import Navbar from '../components/Navbar';
import '../styles/gestionar-grupos.css';

const PaginaGestionGrupos = ({ user, setUser }) => {
  if (!user || user.rol !== 'administrador') {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <Navbar user={user} setUser={setUser} />
      <div className="container">
        <GestionarGrupos user={user} />
      </div>
    </div>
  );
};

export default PaginaGestionGrupos;