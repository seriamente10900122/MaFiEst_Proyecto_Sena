// Script para listar todos los grupos en la base de datos
const { Grupo } = require('./models');
const { sequelize } = require('./models');

async function listarGrupos() {
  try {
    await sequelize.authenticate();
    const grupos = await Grupo.findAll();
    console.log('Grupos en la base de datos:');
    grupos.forEach(g => {
      console.log(`ID: ${g.id}, Nombre: ${g.nombre}, Descripción: ${g.descripcion}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error al listar grupos:', err);
    process.exit(1);
  }
}

listarGrupos();
