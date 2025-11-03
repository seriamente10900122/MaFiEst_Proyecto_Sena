const { sequelize } = require('../db');
const { DataTypes } = require('sequelize');


const User = require('./user')(sequelize, DataTypes);
const Grupo = require('./grupo')(sequelize, DataTypes);
const Grabacion = require('./grabacion')(sequelize, DataTypes);
const Contacto = require('./contacto')(sequelize, DataTypes);
const Actividad = require('./actividad')(sequelize, DataTypes);
const Asesoria = require('./asesoria')(sequelize, DataTypes);
const AsesoriasUsuarios = require('./asesorias_usuarios')(sequelize);


const RespuestaActividad = require('./respuestaActividad')(sequelize, DataTypes);
const Retroalimentacion = require('./retroalimentacion')(sequelize, DataTypes);


// Tabla intermedia User-Grupo
const GrupoUsuario = sequelize.define('GrupoUsuario', {}, { tableName: 'grupo_usuarios' });


const models = {
  User,
  Grupo,
  Grabacion,
  Contacto,
  Actividad,
  Asesoria,
  RespuestaActividad,
  GrupoUsuario,
  Retroalimentacion,
  AsesoriasUsuarios
};

Object.values(models).forEach(model => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

async function syncModels() {
  await sequelize.sync({ force: false });
}

module.exports = {
  sequelize,
  ...models,
  testConnection,
  syncModels
};
