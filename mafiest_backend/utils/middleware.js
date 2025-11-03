// Middleware para verificar roles permitidos
const permitRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    next();
  };
};
const logger = require('./logger')
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('./config');

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
    return response.status(400).json({
      error: 'expected `username` to be unique'
    })
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({
      error: 'invalid token'
    })
  } else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({
      error: 'token expired'
    })
  } else if (error.name === 'SequelizeValidationError') {
    return response.status(400).json({ error: error.message });
  }

  next(error)
}

const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    request.token = authorization.replace('Bearer ', '')
  } else {
    request.token = null
  }
  next()
}

const userExtractor = async (request, response, next) => {
  try {
    const authorization = request.get('authorization');
    console.log('Authorization header recibido:', authorization);
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('Token missing en userExtractor');
      return response.status(401).json({ error: 'token missing' });
    }

    const token = authorization.replace('Bearer ', '');
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, config.SECRET);
    } catch (err) {
      console.log('Error al verificar token:', err);
      return response.status(401).json({ error: 'invalid token' });
    }
    // Incluye grupoId si el usuario pertenece a un grupo
    const user = await User.findByPk(decodedToken.id, {
      include: [{ 
        association: 'grupos',
        through: { attributes: [] }
      }]
    });
    console.log('DEBUG - Usuario encontrado:', {
      id: user.id,
      username: user.username,
      rol: user.rol,
      grupos: user.grupos?.map(g => ({ id: g.id, nombre: g.nombre }))
    });
    if (!user) {
      console.log('Usuario no encontrado para el token');
      return response.status(401).json({ error: 'invalid token' });
    }
    // Si el usuario tiene grupos, asigna el primero como grupoId y pasa todos los grupos
    let grupoId = null;
    let grupos = [];
    if (user.grupos && user.grupos.length > 0) {
      grupoId = user.grupos[0].id;
      grupos = user.grupos.map(g => ({ id: g.id, nombre: g.nombre }));
    }
    console.log('Usuario extraído:', user.username, '| ID:', user.id, '| grupoId:', grupoId, '| grupos:', grupos, '| rol:', user.rol);
    request.user = { ...user.toJSON(), grupoId, grupos };
    next();
  } catch (error) {
    console.log('Error en userExtractor:', error);
    next(error);
  }
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
  permitRoles
}