import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ToastNotification from '../components/Notification';
import userService from '../services/user';
import '../styles/gestion.css';

const Perfil = ({ user, setUser }) => {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    nombre: '',
    email: '',
    username: '',
    rol: '',
    password: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (user.token) {
      userService.setToken(user.token);
    }

    // Inicializar campos vacíos
    setUserData({
      nombre: '',
      email: '',
      username: '',
      rol: user.rol || '',
      password: ''
    });
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Solo incluir los campos que han sido modificados
    const updatedFields = {};
    if (userData.nombre) updatedFields.nombre = userData.nombre;
    if (userData.email) updatedFields.email = userData.email;
    if (userData.username) updatedFields.username = userData.username;
    if (userData.password) updatedFields.password = userData.password;

    try {
      const updatedUser = await userService.updateUser(user.id, updatedFields);

      // Actualizar el usuario local y en localStorage
      const updatedUserWithToken = { 
        ...user, 
        ...updatedUser,
        nombre: updatedUser.nombre || user.nombre || user.name,
        email: updatedUser.email || user.email
      };
      setUser(updatedUserWithToken);
      localStorage.setItem('loggedMafiestUser', JSON.stringify(updatedUserWithToken));

      setToast({ show: true, message: 'Perfil actualizado exitosamente', type: 'success' });
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      alert('Error al actualizar el perfil');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedMafiestUser');
    setUser(null);
    navigate('/');
  };

  if (!user) return null;

  return (
    <div>
      <Navbar user={user} setUser={setUser} />
      <ToastNotification
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
      <div className=" gestion-container gestionar-contenido">
        <h2 className="mb-4 text-center" style={{fontWeight:'bold',fontSize:'2rem',color:'#fff'}}>Mi Perfil</h2>
        <div className="card mb-4" style={{maxWidth:'700px',margin:'0 auto',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
          <div className="card-body">
            <h3 className="text-center" style={{fontWeight:'bold',fontSize:'1.4rem',marginBottom:'1.5rem',textAlign:'center'}}>Información Personal</h3>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <p><strong>Nombre:</strong><br /><span className="text-primary fs-5">{user.nombre || user.name}</span></p>
              </div>
              <div className="col-12 col-md-6">
                <p><strong>Usuario:</strong><br /><span className="text-primary fs-5">{user.username}</span></p>
              </div>
              <div className="col-12 col-md-6">
                <p><strong>Correo:</strong><br /><span className="text-primary fs-5">{user.email}</span></p>
              </div>
              <div className="col-12 col-md-6">
                <p><strong>Rol:</strong><br /><span className="text-primary fs-5 text-capitalize">{user.rol}</span></p>
              </div>
                  {/* Formulario de edición */}         
              <div>
                <div className="card-body">
                  <h3 className="text-center" style={{fontWeight:'bold',fontSize:'1.4rem',marginBottom:'1.5rem',textAlign:'center'}}>Actualizar Información</h3>
                  <form onSubmit={handleSubmit} autoComplete="off">
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label htmlFor="username" className="form-label" style={{ color: '#fff' }}>Nombre</label>
                        <input
                          type="text"
                          className="form-control"
                          id="nombre"
                          name="nombre"
                          value={userData.nombre}
                          onChange={handleChange}
                          placeholder={user.nombre || user.name || "Tu nombre"}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label htmlFor="username" className="form-label" style={{ color: '#fff' }}>Nombre de usuario</label>
                        <input
                          type="text"
                          className="form-control"
                          id="username"
                          name="username"
                          value={userData.username}
                          onChange={handleChange}
                          placeholder={user.username || "Tu nombre de usuario"}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label htmlFor="email" className="form-label" style={{ color: '#fff' }}>Correo electrónico</label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          value={userData.email}
                          onChange={handleChange}
                          placeholder={user.email || "tu@correo.com"}
                          autoComplete="new-email"
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label htmlFor="username" className="form-label" style={{ color: '#fff' }}>Nueva Contraseña</label>
                        <input
                          type="password"
                          className="form-control"
                          id="password"
                          name="password"
                          value={userData.password}
                          onChange={handleChange}
                          placeholder="Dejar en blanco para mantener la actual"
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                    <div className="d-flex flex-column flex-md-row justify-content-center align-items-center" style={{gap:'2rem',marginTop:'2rem'}}>
                      <button type="submit" className="btn btn-primary" style={{minWidth:'180px',fontWeight:'600',fontSize:'1.1rem'}}>
                        <i className="fas fa-save me-2"></i>Guardar Cambios
                      </button><br />
                      <button type="button" className="btn btn-danger" style={{minWidth:'180px',fontWeight:'600',fontSize:'1.1rem'}} onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
