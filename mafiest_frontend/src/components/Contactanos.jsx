import { useState } from 'react'
import contactosService from '../services/contactos'
import Navbar from "../components/Navbar"
import LandingNavbar from "../components/LandingNavbar"
import ToastNotification from '../components/Notification'
import '../styles/contactanos.css'

const Contactanos = ({ user, setUser }) => {
  const [message, setMessage] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validar que el nombre solo tenga letras y espacios
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(formData.nombre)) {
      setMessage({
        type: 'error',
        text: 'El nombre solo puede contener letras y espacios.'
      });
      setTimeout(() => setMessage(null), 5000);
      return;
    }
    try {
      await contactosService.crearContacto(formData);
      setMessage({
        type: 'success',
        text: '¡Gracias por contactarnos! Tu mensaje fue enviado exitosamente. Te responderemos pronto al correo proporcionado.'
      });
      setFormData({
        nombre: '',
        email: '',
        asunto: '',
        mensaje: ''
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'No se pudo enviar tu mensaje en este momento. Por favor verifica tus datos o intenta más tarde.'
      });
    }
    setTimeout(() => setMessage(null), 5000);
  }

  return (
    <div className="contactanos-container">
      {user ? <Navbar user={user} setUser={setUser} /> : <LandingNavbar user={user} setUser={setUser} />}
      <div className="contactanos-content">
        {message && <ToastNotification show={true} type={message.type} message={message.text} onClose={() => setMessage(null)} />}
        <div className="contactanos-header">
          <h1 className="contactanos-title">
            Contáctanos
          </h1>
          <p className="contactanos-subtitle">
            Estamos aquí para ayudarte. ¡Envíanos tu mensaje!
          </p>
        </div>
        <div className="contactanos-form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Ingresa tu nombre completo"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="ejemplo@correo.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Asunto
              </label>
              <input
                type="text"
                name="asunto"
                value={formData.asunto}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="¿Sobre qué nos quieres contactar?"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Mensaje
              </label>
              <textarea
                name="mensaje"
                value={formData.mensaje}
                onChange={handleChange}
                required
                className="form-textarea"
                placeholder="Escribe tu mensaje aquí..."
              />
            </div>
            <button type="submit" className="submit-button">
              Enviar mensaje
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Contactanos