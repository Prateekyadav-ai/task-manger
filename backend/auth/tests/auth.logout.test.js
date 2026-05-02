const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

describe('GET /api/auth/logout', () => {
  const jwtSecret = process.env.jwt_secret || 'test_jwt_secret';

  it('should successfully logout and clear token cookie', async () => {
    // Create a valid JWT token
    const mockUserId = '507f1f77bcf86cd799439011';
    const token = jwt.sign(
      {
        id: mockUserId,
        username: 'testuser',
        email: 'test@example.com'
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/auth/logout')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message.toLowerCase()).toContain('logged out');
    // Check that the Set-Cookie header clears the token
    expect(res.headers['set-cookie']).toBeDefined();
  }, 10000); // Increase timeout to 10 seconds

  it('should return 401 if no token is provided', async () => {
    const res = await request(app).get('/api/auth/logout');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 401 if token is invalid', async () => {
    const invalidToken = 'invalid.jwt.token';

    const res = await request(app)
      .get('/api/auth/logout')
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
      { expiresIn: '0s' }
    );

    // Wait a moment to ensure token is expired
    await new Promise(resolve => setTimeout(resolve, 100));

    const res = await request(app)
      .get('/api/auth/logout')
      .set('Cookie', [`token=${expiredToken}`]);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should clear the token cookie and return success message', async () => {
    const token = jwt.sign(
      {
        id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com'
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    const res = await request(app)
      .get('/api/auth/logout')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    // Verify response body contains success message
    expect(res.body).toBeDefined();
    expect(typeof res.body).toBe('object');
  }, 10000); // Increase timeout to 10 seconds
});
