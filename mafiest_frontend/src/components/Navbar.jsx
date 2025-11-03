import { Link, useNavigate } from 'react-router-dom';
import '../styles/navbar.css';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    window.localStorage.removeItem('loggedMafiestUser');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="main-navbar">
      <div className="nav-left">
        <Link to="/" className="nav-brand">
          MaFiEst
        </Link>
      </div>
      
      <div className="nav-center">
        {user && (
          <>
            {/* Menú para administrador */}
            {user.rol === 'administrador' && (
              <>
                <Link to="/panel">Panel de administrador</Link>
                <Link to="/usuarios">Gestión de Usuarios</Link>
                <Link to="/grupos">Gestión de Grupos</Link>
                <Link to="/gestion-asesorias">Gestión de Asesorías</Link>
                <Link to="/actividades">Gestión de Actividades</Link>
                <Link to="/grabaciones">Gestión de Grabaciones</Link>
              </>
            )}

            {/* Menú para docente */}
            {user.rol === 'docente' && (
              <>
                <Link to="/panel">Panel de docente</Link>
                <Link to="/gestion-asesorias">Gestión de Asesorías</Link>
                <Link to="/actividades">Gestión de Actividades</Link>
                <Link to="/grabaciones">Gestión de Grabaciones</Link>
              </>
            )}
            {user.rol === 'estudiante' && (
              <>
                <Link to="/panel">Panel de Estudiante</Link>
                <Link to="/asesorias">Solicitar Asesoría</Link>
                <Link to="/grabaciones/ver">Ver Grabaciones</Link>
                <Link to="/actividades/ver">Mis Actividades</Link>
                <Link to="/mis-notas">Mis Notas</Link>
              </>
            )}
            {user.rol === 'independiente' && (
              <>
                <Link to="/panel">Panel de independiente</Link>
                <Link to="/asesorias">Solicitar Asesoría</Link>
                <Link to="/grabaciones/ver">Ver Grabaciones</Link>
                <Link to="/actividades/ver">Mis Actividades</Link>
                <Link to="/mis-notas">Mis Notas</Link>
              </>
            )}
          </>
        )}
        <Link to="/biblioteca">Biblioteca</Link>
      </div>
      
      <div className="nav-right">
        {!user ? null : (
          <>
            <Link to="/perfil">Mi Perfil</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;