const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);
const { sequelize, User } = require('../models');
describe('User API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await User.destroy({ where: {} });
    await User.create({ username: 'admin', nombre: 'admin', email: 'admin@test.com', passwordHash: 'sekret', rol: 'administrador' });
  });

  test('creation succeeds with a fresh username', async () => {
    const newUser = {
      username: 'mluukkai',
      nombre: 'Matti Luukkainen',
      email: 'mluukkai@test.com',
      password: 'salainen',
      rol: 'estudiante'
    };
    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);
    const users = await User.findAll();
    expect(users.map(u => u.username)).toContain(newUser.username);
  });

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const newUser = {
      username: 'admin',
      nombre: 'admin',
      email: 'admin2@test.com',
      password: '1234',
      rol: 'administrador'
    };
    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);
    expect(result.body.error).toBeDefined();
  });

  afterAll(async () => {
    await sequelize.close();
  });
});