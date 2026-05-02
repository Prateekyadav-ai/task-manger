const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/user.models');

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

test('POST /auth/register creates a new user and returns 201', async () => {
  const payload = {
    username: 'testuser',
    password: 'password123',
    email: 'test@example.com',
    fullName: { firstName: 'Test', lastName: 'User' }
  };

  const res = await request(app).post('/api/auth/register').send(payload);
  expect(res.statusCode).toBe(201);
  expect(res.body).toHaveProperty('id');
  expect(res.body.username).toBe(payload.username);

  const user = await User.findOne({ username: payload.username });
  expect(user).not.toBeNull();
  expect(user.email).toBe(payload.email);
});
