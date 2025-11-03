import axios from 'axios';

const baseUrl = '/api/grabaciones';

let token = null;

// 🟢 Setear token al iniciar sesión
const setToken = newToken => {
  token = `Bearer ${newToken}`;
};

// 🛡️ Configuración del header Authorization
const config = () => ({
  headers: { Authorization: token },
});

/* =====================================================
   FUNCIONES GENERALES (acceso según rol)
   ===================================================== */

// 📄 Obtener todas las grabaciones generales (visibles para todos)
const obtenerGrabacionesGenerales = async () => {
  const response = await axios.get(`${baseUrl}/generales`, config());
  return response.data;
};

// 📄 Obtener todas las grabaciones grupales (solo admin)
const obtenerGrabacionesGrupales = async () => {
  const response = await axios.get(`${baseUrl}/grupales`, config());
  return response.data;
};

// 📄 Obtener las grabaciones de los grupos del usuario (docente o estudiante)
const obtenerGrabacionesDeMiGrupo = async () => {
  const response = await axios.get(`${baseUrl}/mi-grupo`, config());
  return response.data;
};

// 📄 Obtener solo las grabaciones creadas por el usuario (admin/docente)
const obtenerMisGrabaciones = async () => {
  const response = await axios.get(`${baseUrl}/mis-grabaciones`, config());
  return response.data;
};

/* =====================================================
   CRUD: Crear, Editar, Eliminar
   ===================================================== */

// 🟢 Crear una nueva grabación
const crearGrabacion = async (grabacionData) => {
  const response = await axios.post(baseUrl, grabacionData, config());
  return response.data;
};

// ✏️ Editar una grabación existente
const editarGrabacion = async (id, updatedData) => {
  const response = await axios.put(`${baseUrl}/${id}`, updatedData, config());
  return response.data;
};

// 🗑️ Eliminar una grabación
const eliminarGrabacion = async (id) => {
  await axios.delete(`${baseUrl}/${id}`, config());
};

/* =====================================================
   EXPORTAR
   ===================================================== */

export default {
  setToken,
  obtenerGrabacionesGenerales,
  obtenerGrabacionesGrupales,
  obtenerGrabacionesDeMiGrupo,
  obtenerMisGrabaciones,
  crearGrabacion,
  editarGrabacion,
  eliminarGrabacion,
};
