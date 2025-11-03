import { Navigate } from 'react-router-dom';

/**
 * Componente que protege las rutas y verifica los roles de usuario
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos a renderizar
 * @param {string[]} props.allowedRoles - Roles permitidos para acceder a la ruta
 * @param {Object} props.user - Objeto con la información del usuario
 * @returns {React.ReactNode} - El componente hijo o redirección según corresponda
 */
export const RutaProtegida = ({ children, allowedRoles, user }) => {
  
  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Si se especifican roles permitidos y el usuario no tiene el rol adecuado
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    // Redirigir según el rol del usuario
    switch (user.rol) {
      case 'administrador':
      case 'docente':
      case 'estudiante':
      case 'independiente':
        return <Navigate to="/panel" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Si el usuario tiene acceso, mostrar el contenido
  return children;
};

/**
 * Obtiene la ruta principal según el rol del usuario
 * @param {Object} user - Objeto con la información del usuario
 * @returns {string} - Ruta principal según el rol
 */
export const getRutaPrincipal = (user) => {
  if (!user) return "/";
  
  switch (user.rol) {
    case 'administrador':
    case 'docente':
    case 'estudiante':
    case 'independiente':
      return "/panel";
    default:
      return "/";
  }
};

/**
 * Objeto con los roles permitidos para cada ruta
 */
export const ROLES_RUTAS = {
  ADMIN: ['administrador'],
  ADMIN_DOCENTE: ['administrador', 'docente'],
  ESTUDIANTE: ['estudiante'],
  ESTUDIANTE_INDEPENDIENTE: ['estudiante', 'independiente'],
  DOCENTE: ['docente'],
  TODOS: ['administrador', 'docente', 'estudiante', 'independiente']
};