const { sequelize } = require('../db');
const { User, Grupo, Actividad, Asesoria, Grabacion } = require('../models');
const logger = require('./logger');
const bcrypt = require('bcrypt');

const setupDatabase = async () => {
  console.log('Iniciando configuración de la base de datos...');
  try {
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ force: true });
    console.log('Base de datos sincronizada');
    logger.info('Base de datos sincronizada');

    // Crear grupo inicial
    const grupo = await Grupo.create({
      nombre: 'Matemáticas Básicas',
      descripcion: 'Grupo para estudiantes de matemáticas básicas'
    });
    await grupo.save();
    logger.info('Grupo inicial creado');

    // Crear usuario administrador
    const admin = await User.create({
      username: 'admin',
      nombre: 'Administrador Principal',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('ADMIN123', 10),
      rol: 'administrador'
    });
    logger.info('Usuario administrador creado');

    // Crear docente
    const docente = await User.create({
      username: 'docente1',
      nombre: 'Juan Pérez',
      email: 'docente@example.com',
      passwordHash: await bcrypt.hash('docente123', 10),
      rol: 'docente',
      grupoId: grupo.id
    });
    logger.info('Usuario docente creado');

    // Crear estudiante
    const estudiante = await User.create({
      username: 'estudiante1',
      nombre: 'María García',
      email: 'estudiante@example.com',
      passwordHash: await bcrypt.hash('estudiante123', 10),
      rol: 'estudiante',
      grupoId: grupo.id
    });
    logger.info('Usuario estudiante creado');

    // Crear actividad inicial
    await Actividad.create({
      titulo: 'Ejercicios de Funciones',
      descripcion: 'Práctica de funciones lineales y cuadráticas',
      fechaLimite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      grupoId: grupo.id,
      creadorId: admin.id,
      estado: 'activa'
    });
    logger.info('Actividad inicial creada');

    // Crear asesoría inicial
    await Asesoria.create({
      titulo: 'Asesoría de Funciones',
      descripcion: 'Resolución de dudas sobre funciones',
      fecha: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      horaInicio: '14:00',
      horaFin: '15:00',
      grupoId: grupo.id,
      docenteId: docente.id,
      estado: 'programada'
    });
    logger.info('Asesoría inicial creada');

    // Crear grabación inicial
    await Grabacion.create({
      title: 'Introducción a Funciones',
      description: 'Conceptos básicos de funciones matemáticas',
      driveLink: 'https://drive.google.com/sample-link-1',
      grupoId: grupo.id,
      userId: docente.id
    });
    logger.info('Grabación inicial creada');

    logger.info('Datos iniciales creados exitosamente');
    console.log('¡Configuración completada exitosamente!');
  } catch (error) {
    console.error('Error al configurar la base de datos:', error);
    logger.error('Error al configurar la base de datos:', error);
    throw error;
  }
};

// Si este archivo se ejecuta directamente, ejecutar la función
if (require.main === module) {
  setupDatabase().catch(error => {
    console.error('Error durante la configuración:', error);
    process.exit(1);
  });
}

module.exports = { setupDatabase };