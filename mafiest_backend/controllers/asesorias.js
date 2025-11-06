const express = require('express');
const { Asesoria, User, AsesoriasUsuarios } = require('../models');
const { userExtractor, permitRoles } = require('../utils/middleware');

const asesoriasRouter = express.Router();
// Editar una asesoría (solo admin/docente)
asesoriasRouter.put('/:id', userExtractor, permitRoles('administrador', 'docente'), async (req, res) => {
  try {
    const asesoria = await Asesoria.findByPk(req.params.id);
    if (!asesoria) {
      return res.status(404).json({ error: 'Asesoría no encontrada' });
    }
    await asesoria.update(req.body);
    res.json(asesoria);
  } catch (error) {
    console.error('Error al editar asesoría:', error);
    res.status(400).json({ error: error.message });
  }
});

// Eliminar una asesoría (solo admin/docente)
asesoriasRouter.delete('/:id', userExtractor, permitRoles('administrador', 'docente'), async (req, res) => {
  try {
    const asesoria = await Asesoria.findByPk(req.params.id);
    if (!asesoria) {
      return res.status(404).json({ error: 'Asesoría no encontrada' });
    }
    await asesoria.destroy();
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar asesoría:', error);
    res.status(400).json({ error: error.message });
  }
});


// Obtener solicitudes de asesoría del usuario autenticado
asesoriasRouter.get('/mis-asesorias', userExtractor, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    // Buscar solicitudes en la tabla intermedia
    const solicitudes = await AsesoriasUsuarios.findAll({
      where: { userId: usuarioId },
      attributes: ['id', 'titulo', 'descripcion', 'asesoriaId', 'createdAt']
    });
    res.json(solicitudes);
  } catch (error) {
    console.error('Error al obtener mis asesorías:', error);
    res.status(500).json({ error: 'Error al obtener tus asesorías' });
  }
});

// Obtener todas las solicitudes pendientes (sin asesoría asignada)
asesoriasRouter.get('/pendientes', userExtractor, permitRoles('administrador', 'docente'), async (req, res) => {
  try {
    const pendientes = await AsesoriasUsuarios.findAll({
      where: { asesoriaId: null },
      attributes: ['id', 'titulo', 'descripcion', 'userId', 'createdAt'],
      include: [{
        association: 'user',
        attributes: ['id', 'nombre', 'email']
      }]
    });
    
    // Ajustar la fecha para que muestre el día correcto
    const pendientesAjustados = pendientes.map(p => {
      const data = p.toJSON();
      data.createdAt = new Date(new Date(data.createdAt).setHours(12, 0, 0, 0));
      return data;
    });
    res.json(pendientesAjustados);
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error);
    res.status(500).json({ error: 'Error al obtener solicitudes pendientes' });
  }
});

// Obtener asesoría individual por id (para estudiantes/independientes)
asesoriasRouter.get('/:id', userExtractor, async (req, res) => {
  try {
    const asesoria = await Asesoria.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'docente',
          attributes: ['id', 'nombre', 'email', 'rol']
        }
      ]
    });
    if (!asesoria) {
      return res.status(404).json({ error: 'Asesoría no encontrada' });
    }
    res.json(asesoria);
  } catch (error) {
    console.error('Error al obtener asesoría:', error);
    res.status(500).json({ error: 'Error al obtener la asesoría' });
  }
});

// Asignar datos completos a una solicitud pendiente y crear la asesoría
asesoriasRouter.post('/asignar/:solicitudId', userExtractor, permitRoles('administrador', 'docente'), async (req, res) => {
  try {
    const { solicitudId } = req.params;
  let { fecha, horaInicio, horaFin, lugar, docenteNombre, precio } = req.body;
  // Ajustar la fecha a mediodía para evitar desfase por zona horaria
  if (fecha && typeof fecha === 'string' && fecha.length === 10) {
    const [year, month, day] = fecha.split('-');
    const fechaObj = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
    // Convertir de nuevo a string YYYY-MM-DD para guardar en DATEONLY
    fecha = fechaObj.toISOString().substring(0, 10);
  }
    // Buscar la solicitud pendiente
    const solicitud = await AsesoriasUsuarios.findByPk(solicitudId);
    if (!solicitud || solicitud.asesoriaId) {
      return res.status(404).json({ error: 'Solicitud no encontrada o ya asignada' });
    }
    // Buscar el docente
    let docenteId = null;
    if (docenteNombre) {
      const docente = await User.findOne({ where: { nombre: docenteNombre, rol: 'docente' } });
      if (!docente) {
        return res.status(400).json({ error: 'Docente no encontrado' });
      }
      docenteId = docente.id;
    }
    // Validar que no exista otra asesoría con el mismo docente, fecha y hora
    const conflicto = await Asesoria.findOne({
      where: {
        docenteId,
        fecha: fecha, // comparar como string YYYY-MM-DD
        horaInicio,
        horaFin
      }
    });
    if (conflicto) {
      return res.status(400).json({ error: 'Ya existe una asesoría programada con este docente en esa fecha y hora.' });
    }
    // Crear la asesoría completa
    const asesoria = await Asesoria.create({
      titulo: solicitud.titulo,
      descripcion: solicitud.descripcion,
      fecha: fecha, // guardar como string YYYY-MM-DD
      horaInicio,
      horaFin,
      lugar,
      docenteId,
      estudianteId: solicitud.userId,
      precio
    });
    // Actualizar la solicitud con el id de la asesoría
    solicitud.asesoriaId = asesoria.id;
    await solicitud.save();
    res.status(201).json({ mensaje: 'Asesoría asignada correctamente', asesoria });
  } catch (error) {
    console.error('Error al asignar asesoría:', error);
    res.status(400).json({ error: error.message });
  }
});



// Solicitud de asesoría por estudiante/independiente (solo título y descripción)
asesoriasRouter.post('/solicitar', userExtractor, async (req, res) => {
  try {
    console.log('Solicitud recibida en /solicitar:', req.body);
    const { titulo, descripcion } = req.body;
    if (!titulo || !descripcion) {
      console.log('Campos recibidos:', req.body);
      return res.status(400).json({ error: 'Faltan campos obligatorios', body: req.body });
    }
    // Registrar la solicitud en la tabla intermedia (sin asesoría creada)
    await AsesoriasUsuarios.create({
      titulo,
      descripcion,
      userId: req.user.id
    });
    res.status(201).json({ mensaje: 'Solicitud de asesoría enviada correctamente' });
  } catch (error) {
    console.error('Error al solicitar asesoría:', error);
    res.status(400).json({ error: error.message });
  }
});

// Creación de asesoría completa por docente/administrador


// Obtener todas las asesorías (solo admin/docente)
asesoriasRouter.get('/', userExtractor, permitRoles('docente', 'administrador'), async (req, res) => {
  try {
    const asesorias = await Asesoria.findAll({
      include: [
        {
          model: User,
          as: 'docente',
          attributes: ['id', 'nombre', 'email', 'rol']
        },
        {
          model: User,
          as: 'estudiante',
          attributes: ['id', 'nombre', 'email', 'rol']
        }
      ]
    });
    res.json(asesorias);
  } catch (error) {
    console.error('Error al obtener asesorías:', error);
    res.status(500).json({ error: 'Error al obtener las asesorías' });
  }
});



// Obtener solicitudes de asesoría del usuario autenticado
asesoriasRouter.get('/mis-asesorias', userExtractor, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    // Buscar solicitudes en la tabla intermedia
    const solicitudes = await AsesoriasUsuarios.findAll({
      where: { userId: usuarioId },
      attributes: ['id', 'titulo', 'descripcion', 'asesoriaId', 'createdAt']
    });
    res.json(solicitudes);
  } catch (error) {
    console.error('Error al obtener mis asesorías:', error);
    res.status(500).json({ error: 'Error al obtener tus asesorías' });
  }
});

module.exports = asesoriasRouter;
