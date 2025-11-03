const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);
const { Grabacion, User, Grupo, sequelize } = require('../models');
const bcrypt = require('bcrypt');

// Utilidades para crear usuarios y grupos de prueba
async function crearUsuario({ username, nombre, rol, email }) {
  const password = 'sekret';
  const passwordHash = await bcrypt.hash(password, 10);
  return await User.create({ username, nombre, rol, email: email || `${username}@test.com`, passwordHash });
}
async function crearGrupo({ nombre }) {
  return await Grupo.create({ nombre });
}

describe('Grabaciones API', () => {
  let admin, docente, estudiante, independiente, grupo;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  admin = await crearUsuario({ username: 'admin', nombre: 'Admin', rol: 'administrador' });
  docente = await crearUsuario({ username: 'docente', nombre: 'Docente', rol: 'docente' });
  estudiante = await crearUsuario({ username: 'estudiante', nombre: 'Estudiante', rol: 'estudiante' });
  independiente = await crearUsuario({ username: 'indep', nombre: 'Indep', rol: 'independiente' });
  grupo = await crearGrupo({ nombre: 'Grupo 1' });
  await docente.addGrupo(grupo);
  await estudiante.addGrupo(grupo);

  // Obtener tokens para cada usuario
  const loginAdmin = await api.post('/api/login').send({ username: 'admin', password: 'sekret' });
  admin.token = loginAdmin.body.token;
  const loginDocente = await api.post('/api/login').send({ username: 'docente', password: 'sekret' });
  docente.token = loginDocente.body.token;
  const loginEstudiante = await api.post('/api/login').send({ username: 'estudiante', password: 'sekret' });
  estudiante.token = loginEstudiante.body.token;
  const loginIndep = await api.post('/api/login').send({ username: 'indep', password: 'sekret' });
  independiente.token = loginIndep.body.token;
  });

  test('Admin puede ver todas las grabaciones', async () => {
    await Grabacion.create({ title: 'General', description: 'desc', driveLink: 'link', tipo: 'general', userId: admin.id });
    await Grabacion.create({ title: 'Grupal', description: 'desc', driveLink: 'link', tipo: 'grupal', grupoId: grupo.id, userId: docente.id });
    const res = await api.get('/api/grabaciones').set('Authorization', `Bearer ${admin.token}`).expect(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test('Docente solo puede crear grabaciones grupales', async () => {
    const res = await api.post('/api/grabaciones').set('Authorization', `Bearer ${docente.token}`)
      .send({ title: 'General', description: 'desc', driveLink: 'link', tipo: 'general' });
    expect(res.status).toBe(400);
  });

  test('Estudiante solo ve generales y grupales de su grupo', async () => {
    const res = await api.get('/api/grabaciones').set('Authorization', `Bearer ${estudiante.token}`).expect(200);
    expect(res.body.some(g => g.tipo === 'general')).toBe(true);
    expect(res.body.some(g => g.tipo === 'grupal')).toBe(true);
  });

  test('Independiente solo ve grabaciones generales', async () => {
    const res = await api.get('/api/grabaciones').set('Authorization', `Bearer ${independiente.token}`).expect(200);
    expect(res.body.every(g => g.tipo === 'general')).toBe(true);
  });

  afterAll(async () => {
    await sequelize.close();
  });
});
