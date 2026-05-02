const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/user.models');
const bcrypt = require('bcryptjs');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

test('POST /api/auth/login returns 200 and user data for valid credentials', async () => {
  const payload = {
    username: 'loginuser',
    password: 'password123',
    email: 'login@example.com',
    fullName: { firstName: 'Login', lastName: 'User' }
  };

  // create user with hashed password
  const hash = await bcrypt.hash(payload.password, 10);
  await User.create({ username: payload.username, password: hash, email: payload.email, fullName: payload.fullName });

  const res = await request(app).post('/api/auth/login').send({ username: payload.username, password: payload.password });
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('id');
  expect(res.body.username).toBe(payload.username);
});

test('POST /api/auth/login returns 401 for invalid password', async () => {
  const payload = {
    username: 'loginuser2',
    password: 'password123',
    email: 'login2@example.com',
    fullName: { firstName: 'Login', lastName: 'User' }
  };

  const hash = await bcrypt.hash(payload.password, 10);
  await User.create({ username: payload.username, password: hash, email: payload.email, fullName: payload.fullName });

  const res = await request(app).post('/api/auth/login').send({ username: payload.username, password: 'wrongpass' });
  expect(res.statusCode).toBe(401);
});
