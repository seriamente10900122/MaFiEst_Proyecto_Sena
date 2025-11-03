const express = require('express');
const { Op } = require('sequelize');
const { Grabacion, User, Grupo } = require('../models');
const middleware = require('../utils/middleware');

const grabacionesRouter = express.Router();

// Middleware: requiere usuario autenticado
grabacionesRouter.use(middleware.userExtractor);

/**
 * Obtener todas las grabaciones según el rol
 * (Endpoint principal: /api/grabaciones)
 */
grabacionesRouter.get('/', async (req, res) => {
  try {
    const rol = req.user.rol;
    const userId = req.user.id;

    let grabaciones = [];

    if (rol === 'administrador') {
      // Admin: todas (generales + grupales)
      grabaciones = await Grabacion.findAll({
        include: [
          { model: Grupo, as: 'grupo', attributes: ['id', 'nombre'] },
          { model: User, as: 'usuario', attributes: ['id', 'username', 'nombre', 'rol'] }
        ],
        order: [['createdAt', 'DESC']],
      });
    } 
    else if (rol === 'docente') {
      // Docente: generales + grupales de sus grupos
      const usuario = await User.findByPk(userId, {
        include: { model: Grupo, as: 'grupos', attributes: ['id', 'nombre'] },
      });
      const grupoIds = usuario.grupos.map(g => g.id);

      grabaciones = await Grabacion.findAll({
        where: {
          [Op.or]: [
            { tipo: 'general' },
            { tipo: 'grupal', grupoId: { [Op.in]: grupoIds } }
          ]
        },
        include: [
          { model: Grupo, as: 'grupo', attributes: ['id', 'nombre'] },
          { model: User, as: 'usuario', attributes: ['id', 'username', 'nombre', 'rol'] }
        ],
        order: [['createdAt', 'DESC']],
      });
    } 
    else if (rol === 'estudiante') {
      // Estudiante: generales + grupales de sus grupos
      const usuario = await User.findByPk(userId, {
        include: { model: Grupo, as: 'grupos', attributes: ['id', 'nombre'] },
      });
      const grupoIds = usuario.grupos.map(g => g.id);

      grabaciones = await Grabacion.findAll({
        where: {
          [Op.or]: [
            { tipo: 'general' },
            { tipo: 'grupal', grupoId: { [Op.in]: grupoIds } }
          ]
        },
        include: [
          { model: Grupo, as: 'grupo', attributes: ['id', 'nombre'] },
          { model: User, as: 'usuario', attributes: ['id', 'username', 'nombre', 'rol'] }
        ],
        order: [['createdAt', 'DESC']],
      });
    } 
    else if (rol === 'independiente') {
      // Independiente: solo grabaciones generales
      grabaciones = await Grabacion.findAll({
        where: { tipo: 'general' },
        include: [
          { model: User, as: 'usuario', attributes: ['id', 'username', 'nombre', 'rol'] },
        ],
        order: [['createdAt', 'DESC']],
      });
    }

    res.json(grabaciones);
  } catch (error) {
    console.error('Error al obtener grabaciones:', error);
    res.status(500).json({ error: 'Error al obtener grabaciones' });
  }
});

/**
 * 📄 Obtener grabaciones generales
 */
grabacionesRouter.get('/generales', async (req, res) => {
  try {
    const grabaciones = await Grabacion.findAll({
      where: { tipo: 'general' },
      include: [{ model: User, as: 'usuario', attributes: ['id', 'username', 'nombre', 'rol'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(grabaciones);
  } catch (error) {
    console.error('Error al obtener grabaciones generales:', error);
    res.status(500).json({ error: 'Error al obtener grabaciones generales' });
  }
});

/**
 * 📄 Obtener todas las grabaciones grupales (solo admin)
 */
grabacionesRouter.get('/grupales', async (req, res) => {
  try {
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const grabaciones = await Grabacion.findAll({
      where: { tipo: 'grupal' },
      include: [
        { model: Grupo, as: 'grupo', attributes: ['id', 'nombre'] },
        { model: User, as: 'usuario', attributes: ['id', 'username', 'nombre'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(grabaciones);
  } catch (error) {
    console.error('Error al obtener grabaciones grupales:', error);
    res.status(500).json({ error: 'Error al obtener grabaciones grupales' });
  }
});

/**
 * 📄 Obtener grabaciones del grupo del usuario
 */
grabacionesRouter.get('/mi-grupo', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: { model: Grupo, as: 'grupos', attributes: ['id', 'nombre'] },
    });

    if (!user || !user.grupos.length) return res.json([]);

    const grupoIds = user.grupos.map(g => g.id);

    const grabaciones = await Grabacion.findAll({
      where: { tipo: 'grupal', grupoId: { [Op.in]: grupoIds } },
      include: [
        { model: Grupo, as: 'grupo', attributes: ['id', 'nombre'] },
        { model: User, as: 'usuario', attributes: ['id', 'username', 'nombre'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(grabaciones);
  } catch (error) {
    console.error('Error al obtener grabaciones del grupo:', error);
    res.status(500).json({ error: 'Error al obtener grabaciones del grupo' });
  }
});

/**
 * 📄 Obtener mis grabaciones (admin y docente)
 */
grabacionesRouter.get('/mis-grabaciones', async (req, res) => {
  try {
    const grabaciones = await Grabacion.findAll({
      where: { userId: req.user.id },
      include: [{ model: Grupo, as: 'grupo', attributes: ['id', 'nombre'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(grabaciones);
  } catch (error) {
    console.error('Error al obtener mis grabaciones:', error);
    res.status(500).json({ error: 'Error al obtener mis grabaciones' });
  }
});

/**
 * 🟢 Crear nueva grabación
 */
grabacionesRouter.post('/', async (req, res) => {
  try {
    let { title, description, driveLink, tipo, grupoId } = req.body;
    const rol = req.user.rol;
    // Si el rol es docente y no se envía tipo, asignar 'grupal'
    if (rol === 'docente' && !tipo) {
      tipo = 'grupal';
    }

    if (!['administrador', 'docente'].includes(rol)) {
      return res.status(403).json({ error: 'No autorizado para crear grabaciones' });
    }

    if (rol === 'docente' && tipo !== 'grupal') {
      return res.status(400).json({ error: 'El docente solo puede crear grabaciones grupales' });
    }

    // Si es admin y tipo grupal, puede crear para cualquier grupo
    if (rol === 'administrador' && tipo === 'grupal') {
      if (!grupoId) {
        return res.status(400).json({ error: 'Debes seleccionar un grupo para la grabación grupal' });
      }
      const nuevaGrabacion = await Grabacion.create({
        title,
        description,
        driveLink,
        tipo: 'grupal',
        grupoId,
        userId: req.user.id,
      });
      return res.status(201).json([nuevaGrabacion]);
    }
    // Si es admin y tipo general
    if (rol === 'administrador' && tipo === 'general') {
      const nuevaGrabacion = await Grabacion.create({
        title,
        description,
        driveLink,
        tipo: 'general',
        grupoId: null,
        userId: req.user.id,
      });
      return res.status(201).json([nuevaGrabacion]);
    }
    // Si es tipo general en general (por otros roles)
    if (tipo === 'general') {
      const nuevaGrabacion = await Grabacion.create({
        title,
        description,
        driveLink,
        tipo: 'general',
        grupoId: null,
        userId: req.user.id,
      });
      return res.status(201).json([nuevaGrabacion]);
    }

    // Si es docente y tipo grupal, crear solo en el grupo seleccionado
    const docente = await User.findByPk(req.user.id, {
      include: { model: require('../models').Grupo, as: 'grupos', attributes: ['id', 'nombre'] }
    });
    if (!docente.grupos || docente.grupos.length === 0) {
      return res.status(400).json({ error: 'El docente no pertenece a ningún grupo' });
    }
    // Validar que el grupoId recibido pertenece al docente
    const grupoValido = docente.grupos.find(g => String(g.id) === String(grupoId));
    if (!grupoValido) {
      return res.status(400).json({ error: 'El grupo seleccionado no pertenece al docente' });
    }
    const nuevaGrabacion = await Grabacion.create({
      title,
      description,
      driveLink,
      tipo: 'grupal',
      grupoId,
      userId: req.user.id,
    });
    res.status(201).json([nuevaGrabacion]);
  } catch (error) {
    console.error('Error al crear grabación:', error);
    res.status(500).json({ error: 'Error al crear la grabación' });
  }
});

/**
 * ✏️ Editar grabación
 */
grabacionesRouter.put('/:id', async (req, res) => {
  try {
    const grabacion = await Grabacion.findByPk(req.params.id);
    if (!grabacion) return res.status(404).json({ error: 'Grabación no encontrada' });

    const rol = req.user.rol;
    const esPropia = grabacion.userId === req.user.id;

    if (rol !== 'administrador' && !(rol === 'docente' && esPropia && grabacion.tipo === 'grupal')) {
      return res.status(403).json({ error: 'No autorizado para editar esta grabación' });
    }

    const { title, description, driveLink } = req.body;
    grabacion.title = title ?? grabacion.title;
    grabacion.description = description ?? grabacion.description;
    grabacion.driveLink = driveLink ?? grabacion.driveLink;

    await grabacion.save();
    res.json(grabacion);
  } catch (error) {
    console.error('Error al editar grabación:', error);
    res.status(500).json({ error: 'Error al editar grabación' });
  }
});

/**
 * 🗑️ Eliminar grabación
 */
grabacionesRouter.delete('/:id', async (req, res) => {
  try {
    const grabacion = await Grabacion.findByPk(req.params.id);
    if (!grabacion) return res.status(404).json({ error: 'Grabación no encontrada' });

    const rol = req.user.rol;
    const esPropia = grabacion.userId === req.user.id;

    if (rol !== 'administrador' && !(rol === 'docente' && esPropia && grabacion.tipo === 'grupal')) {
      return res.status(403).json({ error: 'No autorizado para eliminar esta grabación' });
    }

    await grabacion.destroy();
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar grabación:', error);
    res.status(500).json({ error: 'Error al eliminar grabación' });
  }
});

module.exports = grabacionesRouter;
