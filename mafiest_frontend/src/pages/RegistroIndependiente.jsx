import '../styles/auth.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import userService from '../services/user';
import LandingNavbar from '../components/LandingNavbar';
import ToastNotification from '../components/Notification';

const RegistroIndependiente = ({ user, setUser, onSuccess, onRegistroExitoso }) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newUser = {
        username,
          nombre: name,
        email,
        password,
        rol: 'independiente',
      };
      await userService.createUser(newUser);
      setMessage({ type: true, message: '¡Registro exitoso! Ahora puedes iniciar sesión.' });
      setUsername('');
      setName('');
      setEmail('');
      setPassword('');
      if (onSuccess) onSuccess();
      if (onRegistroExitoso) onRegistroExitoso();
    } catch (err) {
      let errorMsg = err.response?.data?.error || 'Error al registrar.';
      if (errorMsg.includes('llave duplicada') || errorMsg.includes('restricción de unicidad')) {
        errorMsg = 'El nombre de usuario o correo ya está registrado. Por favor elige otro.';
      }
      setMessage({ type: false, message: errorMsg });
    }
  };

  return (
    <div className="auth-container">
      <LandingNavbar user={user} setUser={setUser} />
      {/* Toast arriba a la derecha */}
      {message && (
        <div style={{position: 'fixed', top: 30, right: 30, zIndex: 9999}}>
          <ToastNotification show={true} type={message.type ? 'success' : 'danger'} message={message.message} onClose={() => setMessage(null)} />
        </div>
      )}
      <div className="auth-content">
        <div className="auth-header">
          <h2 className="auth-title">Registro Independiente</h2>
          <p className="auth-subtitle">Crea tu cuenta gratuita y comienza a aprender</p>
        </div>
        <div className="auth-form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre de usuario</label>
              <input
                type="text"
                value={username}
                name="Username"
                className="form-input"
                placeholder="Elige un nombre de usuario"
                onChange={({ target }) => setUsername(target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input
                type="text"
                value={name}
                name="Name"
                className="form-input"
                placeholder="Tu nombre completo"
                onChange={({ target }) => setName(target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input
                type="email"
                value={email}
                name="Email"
                className="form-input"
                placeholder="tucorreo@ejemplo.com"
                onChange={({ target }) => setEmail(target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  name="Password"
                  className="form-input"
                  placeholder="Crea una contraseña segura"
                  onChange={({ target }) => setPassword(target.value)}
                  required
                />
                <button
                  type="button"
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1em' }}
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="submit-button"
            >
              Crear cuenta
            </button>

            <Link to="/login" className="auth-switch-link">
              ¿Ya tienes una cuenta? Inicia sesión aquí
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistroIndependiente;