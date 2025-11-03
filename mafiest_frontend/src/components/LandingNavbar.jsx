import { Link } from 'react-router-dom';
import '../styles/navbar.css';

const LandingNavbar = ({ user, setUser }) => {
  return (
    <nav className="main-navbar">
      <div className="nav-left">
        <Link to="/" className="nav-brand">
          MaFiEst
        </Link>
      </div>
      
      <div className="nav-right">
        <Link to="/">Inicio</Link>
        <Link to="/sobre-nosotros">Sobre Nosotros</Link>
        <Link to="/contactanos">Contáctanos</Link>
        <Link to="/login" className="nav-button">Iniciar Sesión</Link>
        <Link to="/registro" className="nav-button">Registrarse</Link>
      </div>
    </nav>
  );
};

export default LandingNavbar;