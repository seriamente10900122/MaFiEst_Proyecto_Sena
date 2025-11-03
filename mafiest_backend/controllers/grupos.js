const express = require('express');
const gruposRouter = express.Router();
const { User, Grupo } = require('../models');
const { userExtractor } = require('../utils/middleware');


// Middleware para verificar si es administrador
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'administrador') {
    return res.status(403).json({ error: 'Solo los administradores pueden realizar esta acción' });
  }
  next();
};

// Crear grupo (solo administradores)
gruposRouter.post('/', isAdmin, async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del grupo es obligatorio' });
    }
    const grupo = await Grupo.create({ nombre, descripcion });
    res.status(201).json({ message: 'Grupo creado exitosamente', grupo });
  } catch (error) {
    console.error('Error al crear grupo:', error);
    res.status(500).json({ error: 'Error al crear el grupo' });
  }
});
// Editar grupo (solo administradores)
gruposRouter.put('/:grupoId', isAdmin, async (req, res) => {
  try {
    const { grupoId } = req.params;
    const { nombre, descripcion } = req.body;
    const grupo = await Grupo.findByPk(grupoId);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    grupo.nombre = nombre;
    grupo.descripcion = descripcion;
    await grupo.save();
    res.json({ message: 'Grupo editado exitosamente', grupo });
  } catch (error) {
    console.error('Error al editar grupo:', error);
    res.status(500).json({ error: 'Error al editar el grupo' });
  }
});

// Borrar grupo (solo administradores)
gruposRouter.delete('/:grupoId', isAdmin, async (req, res) => {
  try {
    const { grupoId } = req.params;
    const grupo = await Grupo.findByPk(grupoId);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    await grupo.destroy();
    res.status(204).end();
  } catch (error) {
    console.error('Error al borrar grupo:', error);
    res.status(500).json({ error: 'Error al borrar el grupo' });
  }
});

// Obtener todos los grupos
gruposRouter.get('/', userExtractor, async (req, res) => {
  try {
    console.log('Usuario autenticado:', req.user);

    let whereCondition = {};
    let includeCondition = {
      model: User,
      as: 'usuarios',
      attributes: ['id', 'username', 'nombre', 'rol'],
      through: { attributes: [] }
    };

    // Si es docente, solo ver grupos donde es miembro
    if (req.user.rol === 'docente') {
      whereCondition = {
        '$usuarios.id$': req.user.id
      };
    }

    const grupos = await Grupo.findAll({
      where: whereCondition,
      include: [includeCondition],
      order: [['createdAt', 'DESC']]
    });

    res.json(grupos);
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    res.status(500).json({ 
      error: 'Error en la consulta a la base de datos',
      details: error.message 
    });
  }
});

// Asignar usuario a grupo (solo administradores)
gruposRouter.post('/:grupoId/usuarios', isAdmin, async (req, res) => {
  try {
    const { grupoId } = req.params;
    const { userId } = req.body;
    
    const grupo = await Grupo.findByPk(grupoId);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (user.rol === 'independiente') {
      return res.status(400).json({ error: 'No se pueden agregar usuarios independientes a los grupos' });
    }
    await grupo.addUsuario(user);
    res.json({ message: 'Usuario asignado al grupo exitosamente' });
  } catch (error) {
    console.error('Error al asignar usuario a grupo:', error);
    res.status(400).json({ error: error.message });
  }
});

// Remover usuario de grupo (solo administradores)
gruposRouter.delete('/:grupoId/usuarios/:userId', isAdmin, async (req, res) => {
  try {
    const { grupoId, userId } = req.params;
    
    const grupo = await Grupo.findByPk(grupoId);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si el usuario está en el grupo
    const isMember = await grupo.hasUsuario(user);
    if (!isMember) {
      return res.status(404).json({ error: 'Usuario no encontrado en este grupo' });
    }

    await grupo.removeUsuario(user);
    res.json({ message: 'Usuario removido del grupo exitosamente' });
  } catch (error) {
    console.error('Error al remover usuario del grupo:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = gruposRouter;