const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const { User } = require('../models')
const config = require('../utils/config')

loginRouter.post('/', async (request, response) => {
  try {
    const { username, password } = request.body

    console.log('Intento de login para usuario:', username);

    const user = await User.findOne({
      where: { username },
      attributes: ['id', 'username', 'nombre', 'passwordHash', 'rol'],
      include: [{
        model: require('../models').Grupo,
        as: 'grupos',
        attributes: ['id', 'nombre'],
        required: false
      }]
    });

    console.log('Usuario encontrado:', user ? 'sí' : 'no');

    if (!user) {
      return response.status(401).json({
        error: 'Usuario o contraseña inválidos'
      });
    }

    const passwordCorrect = await bcrypt.compare(password, user.passwordHash);
    console.log('Contraseña correcta:', passwordCorrect ? 'sí' : 'no');

    if (!passwordCorrect) {
      return response.status(401).json({
        error: 'Usuario o contraseña inválidos'
      });
    }

    const userForToken = {
      username: user.username,
      id: user.id,
      rol: user.rol
    }

    const token = jwt.sign(userForToken, config.SECRET, { expiresIn: '24h' })

    response.status(200).json({
      token,
      username: user.username,
      nombre: user.nombre,
      rol: user.rol,
      id: user.id,
      grupos: user.grupos || []
    })

  } catch (error) {
    console.error('Error en login:', error);
    console.error('Stack:', error.stack);
    console.error('Request body:', request.body);
    
    if (!request.body.username || !request.body.password) {
      return response.status(400).json({ 
        error: 'Usuario y contraseña son requeridos',
        details: 'Faltan campos requeridos'
      });
    }
    
    if (error.name === 'SequelizeConnectionError') {
      return response.status(500).json({ 
        error: 'Error de conexión con la base de datos',
        details: error.message
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return response.status(400).json({ 
        error: 'Error de validación',
        details: error.message
      });
    }
    
    if (error.name === 'TypeError') {
      console.error('Detalles del error de tipo:', error);
      return response.status(500).json({ 
        error: 'Error interno del servidor',
        details: 'Error procesando la solicitud'
      });
    }
    
    response.status(500).json({ 
      error: 'Error en el servidor',
      details: error.message,
      name: error.name
    });
  }
})

module.exports = loginRouter