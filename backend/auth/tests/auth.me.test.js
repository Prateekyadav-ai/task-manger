const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

describe('GET /api/auth/me', () => {
  const jwtSecret = process.env.jwt_secret || 'test_jwt_secret';

  it('should return user info if authenticated with valid token', async () => {
    // Mock a valid JWT token
    const mockUserId = '507f1f77bcf86cd799439011';
    const mockUsername = 'testuser';
    const mockEmail = 'test@example.com';

    const token = jwt.sign(
      {
        id: mockUserId,
        username: mockUsername,
        email: mockEmail
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username');
    expect(res.body).toHaveProperty('email');
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 401 if token is invalid', async () => {
    const invalidToken = 'invalid.jwt.token';

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`token=${invalidToken}`]);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 401 if token is expired', async () => {
    // Create an expired token
    const expiredToken = jwt.sign(
      {
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com'
      },
      jwtSecret,
      { expiresIn: '0s' } // Expires immediately
    );

    // Wait a moment to ensure token is expired
    await new Promise(resolve => setTimeout(resolve, 100));

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`token=${expiredToken}`]);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
});
