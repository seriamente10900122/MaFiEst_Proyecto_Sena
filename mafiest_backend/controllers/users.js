const express = require('express');
const usersRouter = express.Router();
const { User, Grupo } = require('../models');
const bcrypt = require('bcrypt');

const validRoles = ['independiente', 'estudiante', 'docente', 'administrador'];

// Edit user info (self-update)
usersRouter.patch('/:id', async (request, response) => {
  try {
    const id = request.params.id;
    const { nombre, email, password, username } = request.body;
    const user = await User.findByPk(id);
    if (!user) {
      return response.status(404).json({ error: 'User not found' });
    }
    if (nombre) user.nombre = nombre;
    if (email) user.email = email;
    if (username) user.username = username;
    if (password) {
      const saltRounds = 10;
      user.passwordHash = await bcrypt.hash(password, saltRounds);
    }
    await user.save();

    // Obtener el usuario actualizado con sus grupos
    const updatedUser = await User.findByPk(user.id, {
      include: [{
        model: Grupo,
        as: 'grupos',
        attributes: ['id', 'nombre'],
        through: { attributes: [] }
      }]
    });

    response.json({
      id: updatedUser.id,
      username: updatedUser.username,
      nombre: updatedUser.nombre,
      email: updatedUser.email,
      rol: updatedUser.rol,
      grupos: updatedUser.grupos
    });
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

// Get all users
usersRouter.get('/', async (request, response) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'nombre', 'email', 'rol'],
      include: [{
        model: Grupo,
        as: 'grupos',
        attributes: ['id', 'nombre', 'descripcion'],
        through: { attributes: [] }
      }],
      order: [
        ['id', 'ASC'],
        [{ model: Grupo, as: 'grupos' }, 'id', 'ASC']
      ]
    });
    response.json(users);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    console.error(error.stack);
    response.status(500).json({ error: 'Error retrieving users', details: error.message });
  }
});

// Create new user
usersRouter.post('/', async (request, response) => {
  try {
  const { username, nombre, email, password, rol, grupoId } = request.body;

    // Validate required fields
    if (!username || !password || !nombre || !email) {
      return response.status(400).json({
        error: 'El usuario, contraseña, nombre y correo son requeridos'
      });
    }

    // Validate role
    if (!validRoles.includes(rol)) {
      return response.status(400).json({
        error: 'Rol inválido. Debe ser: independiente, estudiante, docente o administrador'
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      username,
      nombre,
      email,
      passwordHash,
      rol,
      grupoId
    });

    response.status(201).json({
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      grupoId: user.grupoId
    });
  } catch (error) {
    console.error('Error creating user:', error);
    response.status(400).json({
      error: error.message
    });
  }
});

// Delete user
usersRouter.delete('/:id', async (request, response) => {
  try {
    const id = request.params.id;

    // Verificar si el usuario existe
    const user = await User.findByPk(id);
    if (!user) {
      return response.status(404).json({
        error: 'User not found'
      });
    }

    // Eliminar el usuario
    await user.destroy();
    response.status(204).end();
  } catch (error) {
    response.status(500).json({
      error: 'Error deleting user',
      details: error.message
    });
  }
});

module.exports = usersRouter;