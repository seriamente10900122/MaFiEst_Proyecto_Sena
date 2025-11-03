import axios from 'axios';
import { BASE_URL } from './config';

const baseUrl = `${BASE_URL}/respuestas-actividad`;
// Helper para obtener el token actual de localStorage
const getToken = () => {
  try {
    const loggedUserJSON = window.localStorage.getItem('loggedMafiestUser');
    if (loggedUserJSON) {
      const userData = JSON.parse(loggedUserJSON);
      if (userData && userData.token) {
        return `Bearer ${userData.token}`;
      }
    }
  } catch (e) {
    console.error('Error obteniendo token:', e);
  }
  return '';
};
// Editar retroalimentación
const editarRetroalimentacion = async (retroId, retroalimentacion, nota) => {
  const token = getToken();
  const config = { headers: { Authorization: token } };
  const response = await axios.put(
    `${baseUrl}/retroalimentacion/${retroId}`,
    { retroalimentacion, nota },
    config
  );
  return response.data;
};

// Borrar retroalimentación
const borrarRetroalimentacion = async (retroId) => {
  const token = getToken();
  const config = { headers: { Authorization: token } };
  const response = await axios.delete(`${baseUrl}/retroalimentacion/${retroId}`, config);
  return response.data;
};


// Obtener todas las respuestas de un usuario (para MisNotas)
const obtenerMisRespuestas = async () => {
  const token = getToken();
  const config = { headers: { Authorization: token } };
  const response = await axios.get(`${baseUrl}/mis-respuestas`, config);
  return response.data;
};

const subirRespuestaArchivo = async (actividadId, archivo, archivoUrl) => {
  const token = getToken();
  const config = { 
    headers: { 
      Authorization: token,
      'Content-Type': 'multipart/form-data'
    }
  };
  const formData = new FormData();
  
  // Si hay un archivo, adjuntarlo
  if (archivo) {
    formData.append('archivo', archivo);
  }
  
  // Si hay una URL, agregarla como campo separado
  if (archivoUrl) {
    formData.append('archivoUrl', archivoUrl);
  }

  // Agregar el tipo de respuesta
  formData.append('tipo', 'archivo');
  
  const response = await axios.post(`${baseUrl}/actividad/${actividadId}`, formData, config);
  return response.data;
};

const eliminarRespuesta = async (respuestaId) => {
  const token = getToken();
  const config = { headers: { Authorization: token } };
  const response = await axios.delete(`${baseUrl}/${respuestaId}`, config);
  return response.data;
};

const obtenerRespuestasActividad = async (actividadId) => {
  const token = getToken();
  if (!token) throw new Error('Token de autenticación faltante');
  const config = { headers: { Authorization: token } };
  const response = await axios.get(`${baseUrl}/actividad/${actividadId}`, config);
  return response.data;
};

const setRetroalimentacion = async (respuestaId, retroalimentacion, nota) => {
  const token = getToken();
  const config = { headers: { Authorization: token } };
  const response = await axios.post(
    `${baseUrl}/retroalimentacion`,
    { respuestaId, retroalimentacion, nota },
    config
  );
  return response.data;
};

const crearRespuestaFormulario = async (actividadId, data) => {
  const token = getToken();
  const config = { headers: { Authorization: token } };
  const response = await axios.post(`${baseUrl}/actividad/${actividadId}`, data, config);
  return response.data;
};

// Obtener respuestas de una actividad según el rol
const obtenerRespuestasActividadPorRol = async (actividadId, user) => {
  const token = getToken();
  if (!token) throw new Error('Token de autenticación faltante');
  const config = { headers: { Authorization: token } };
  const response = await axios.get(`${baseUrl}/actividad/${actividadId}`, config);
  if (!response.data || response.data.length === 0) {
    return [];
  }
  
  if (user.rol === 'administrador') {
    return response.data;
  } 
  
  if (user.rol === 'docente') {
    // Validar si es el creador de la actividad
    const primeraRespuesta = response.data[0];
    const actividadCreadorId = primeraRespuesta?.actividad?.creador_id;
    if (Number(actividadCreadorId) === Number(user.id)) {
      return response.data;
    }
  }
  
  if (["estudiante", "independiente"].includes(user.rol)) {
    return response.data.filter(r => 
      String(r.userId) === String(user.id) || String(r.user_id) === String(user.id)
    );
  }
  
  return [];
};
// Obtener todas las respuestas (solo admin/docente)
const obtenerTodasRespuestas = async () => {
  const token = getToken();
  const config = { headers: { Authorization: token } };
  const response = await axios.get(`${baseUrl}/todas`, config);
  return response.data;
};

// Deshacer entrega
const deshacerEntrega = async (respuestaId) => {
  const token = getToken();
  const config = { headers: { Authorization: token } };
  try {
    const response = await axios.patch(`${baseUrl}/deshacer/${respuestaId}`, {}, config);
    return response.data;
  } catch (error) {
    console.error('Error al deshacer entrega:', error.response?.data || error.message);
    throw error;
  }
};

export default {
  subirRespuestaArchivo,
  crearRespuestaFormulario,
  eliminarRespuesta,
  obtenerRespuestasActividad,
  setRetroalimentacion,
  editarRetroalimentacion,
  borrarRetroalimentacion,
  obtenerMisRespuestas,
  obtenerRespuestasActividadPorRol,
  obtenerTodasRespuestas,
  deshacerEntrega
};
