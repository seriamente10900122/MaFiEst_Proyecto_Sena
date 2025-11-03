import React, { useState } from 'react';
import userService from "../services/user";
import ToastNotification from "./Notification";
import '../styles/gestion-usuarios.css';

const CrearUsuarioForm = ({ onUserCreated }) => {
  const [username, setUsername] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("estudiante");
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validación: notificar si el nombre contiene números
    if (/\d/.test(nombre)) {
      setMessage('El nombre contiene números, por favor ingresa solo texto');
      setTimeout(() => setMessage(null), 4000);
      return;
    }
    try {
      const newUser = {
        username,
        nombre,
        email,
        password,
        rol,
      };
      await userService.createUser(newUser);
      setMessage('Usuario creado correctamente');
      setTimeout(() => setMessage(null), 4000);
      setUsername("");
      setNombre("");
      setEmail("");
      setPassword("");
      setRol("estudiante");
      if (onUserCreated) {
        onUserCreated();
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage(`❌ ${error.response?.data?.error || error.message}`);
    }
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div>
      {/* Toast arriba a la derecha */}
      {message && (
        <div style={{position: 'fixed', top: 30, left: 30, zIndex: 9999}}>
          <ToastNotification show={true} type={message === 'Usuario creado correctamente' ? 'success' : message.startsWith('❌') ? 'danger' : message.includes('números, por favor ingresa solo texto') ? 'warning' : 'info'} message={message} onClose={() => setMessage(null)} />
        </div>
      )}
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="card-body" style={{ color:"#fff"}}>Usuario: </label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              minLength={3}
              autoComplete="off"
            />
          </div>
          <div className="mb-3">
            <label className="card-body" style={{ color:"#fff"}}>Nombre: </label>
            <input
              type="text"
              className="form-control"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="mb-3">
            <label className="card-body" style={{ color:"#fff"}}>Correo: </label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="mb-3">
            <label className="card-body" style={{ color:"#fff"}}>Contraseña: </label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="off"
            />
          </div>
          <div className="mb-3">
            <label className="card-body" style={{ color:"#fff"}}>Rol: </label>
            <select 
              className="form-select"
              value={rol} 
              onChange={e => setRol(e.target.value)}
              required
              autoComplete="off"
            >
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
          {/* Campo de grupo eliminado */}
          <button type="submit" className="btn btn-success">Crear Usuario</button>
        </form>
      </div>
    </div>
  );
};

export default CrearUsuarioForm;