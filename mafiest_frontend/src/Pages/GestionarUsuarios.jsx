import React, { useState, useEffect } from 'react';
import ListaUsuarios from '../components/ListaUsuarios';
import CrearUsuarioForm from '../components/CrearUsuarioForm';
import { useNavigate } from 'react-router-dom';
import userService from '../services/user';
import ToastNotification from '../components/Notification';
import Navbar from '../components/Navbar';
import '../styles/gestion-usuarios.css';

const GestionarUsuarios = ({ user, setUser }) => {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.rol !== 'administrador') {
      navigate('/');
      return;
    }

    if (user.token) {
      userService.setToken(user.token);
    }

    const fetchUsers = async () => {
      try {
        const data = await userService.getAll();
        setUsuarios(data);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, navigate]);

  // Eliminada la versión duplicada de handleUserCreated
  const handleUserCreated = async (msg) => {
    setShowForm(false);
    try {
      const data = await userService.getAll();
      setUsuarios(data);
      if (msg) setToast({ show: true, message: msg, type: 'success' });
    } catch (error) {
      setToast({ show: true, message: 'Error al actualizar lista de usuarios', type: 'danger' });
      console.error('Error al actualizar lista:', error);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar user={user} setUser={setUser} />
        <div className="container">
          <div>Cargando...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar user={user} setUser={setUser} />
      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      <div className="container mt-4 d-flex flex-column align-items-center justify-content-center" style={{minHeight:'90vh'}}>
          <div className="row">
            <div className="col-12 d-flex justify-content-center">
              <h1 className="text-center" style={{width:'100%',textAlign:'center',fontWeight:'bold',fontSize:'2rem',margin:'2rem 0',color:"#ffffff"}}>Gestión de Usuarios</h1>
            </div>
          </div>
        <div className="btn-group w-100 mb-4 justify-content-center d-flex">
          <button 
            className={`btn ${!showForm ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setShowForm(false)}
          >
            Ver Lista de Usuarios
          </button>
          <button 
            className={`btn ${showForm ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setShowForm(true)}
          >
            Crear Nuevo Usuario
          </button>
        </div>

        <div className="container min-vh-100 general card" style={{ 
                minHeight: "80vh",
                maxWidth: '1400px', margin: '64px 64px', padding: '32px 32px',
          }}>
          {showForm ? (
            <div style={{ maxWidth: '1400px', margin: '0 auto 48px auto', padding: '32px 32px' }}>
              <div className="card-body">
                <div className="d-flex justify-content-center w-100">
                  <h3 className="gestion-usuarios-list-title text-center" style={{width:'100%',textAlign:'center',fontWeight:'bold',fontSize:'1.5rem'}}>Crear Nuevo Usuario</h3>
                </div>
                  <CrearUsuarioForm onUserCreated={() => handleUserCreated('Usuario creado correctamente')} />
                </div>
            </div>
          ) : (
            <div style={{ maxWidth: '1400px', margin: '0 auto 48px auto', padding: '32px 32px' }}>
              <div className="card-body">
                    <div className="d-flex justify-content-center w-100">
                      <h3 className="gestion-usuarios-list-title text-center" style={{width:'100%',textAlign:'center',fontWeight:'bold',fontSize:'1.5rem'}}>Lista de Usuarios</h3>
                    </div>
                <ListaUsuarios usuarios={usuarios} onUserDeleted={() => handleUserCreated('Usuario eliminado correctamente')} user={user} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GestionarUsuarios;