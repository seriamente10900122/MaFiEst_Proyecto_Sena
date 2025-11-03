const { Grabacion, sequelize } = require('./models');

async function listarGrabaciones() {
  await sequelize.authenticate();
  const grabaciones = await Grabacion.findAll();
  console.log('Grabaciones:', grabaciones.map(g => g.toJSON()));
  await sequelize.close();
}

listarGrabaciones().catch(console.error);