const express = require('express');
const cors = require('cors');
const middleware = require('./utils/middleware');

// Import routers
const grabacionesRouter = require('./controllers/grabaciones');
const asesoriasRouter = require('./controllers/asesorias');
const usersRouter = require('./controllers/users');
const loginRouter = require('./controllers/login');
const contactsRouter = require('./controllers/contactos');
const actividadesRouter = require('./controllers/actividades');
const respuestasActividadRouter = require('./controllers/respuestasActividad');
const gruposRouter = require('./controllers/grupos');

const app = express();

// Middlewares generales
// Configuración de CORS para producción y desarrollo
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://mafiest-frontend.onrender.com']
    : ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
};
app.use(cors(corsOptions));

// Servir archivos subidos (descarga de archivos de actividades) ANTES de cualquier middleware
app.use('/uploads', express.static('uploads'));

// Middlewares generales
app.use(cors());
app.use(express.json());
app.use(middleware.requestLogger);


// Rutas públicas
app.use('/api/login', loginRouter);
app.use('/api/users', usersRouter);  // Permitir registro
app.use('/api/contactanos', contactsRouter); // <-- Esta ruta queda pública

// Middleware de autenticación
app.use(middleware.tokenExtractor);
app.use(middleware.userExtractor);


// Rutas protegidas
app.use('/api/grabaciones', grabacionesRouter);
app.use('/api/actividades', actividadesRouter);
app.use('/api/respuestas-actividad', respuestasActividadRouter);
app.use('/api/asesorias', asesoriasRouter);
app.use('/api/grupos', gruposRouter);

// Manejo de errores
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
