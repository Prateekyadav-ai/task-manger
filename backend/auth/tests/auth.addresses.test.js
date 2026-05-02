const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const User = require('../src/models/user.models');

// Mock the User model
jest.mock('../src/models/user.models');

describe('User Addresses API', () => {
  const jwtSecret = process.env.jwt_secret || 'test_jwt_secret';
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockAddressId = '507f1f77bcf86cd799439012';
  
  let authToken;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a valid JWT token for each test
    authToken = jwt.sign(
      {
        id: mockUserId,
        username: 'testuser',
        email: 'test@example.com'
      },
      jwtSecret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/auth/users/me/addresses', () => {
    it('should return list of saved addresses for authenticated user', async () => {
      // Mock User.findById response with chained .select()
      const mockAddresses = [
        {
          _id: '507f1f77bcf86cd799439012',
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          pincode: '100001',
          phone: '9876543210',
          isDefault: true
        }
      ];

      const mockUserQuery = {
        address: mockAddresses
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserQuery)
      });

      const res = await request(app)
        .get('/api/auth/users/me/addresses')
        .set('Cookie', [`token=${authToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('addresses');
    }, 15000);

    it('should return empty array if user has no saved addresses', async () => {
      const mockUserQuery = {
        address: []
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserQuery)
      });

      const res = await request(app)
        .get('/api/auth/users/me/addresses')
        .set('Cookie', [`token=${authToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('addresses');
    }, 15000);

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/auth/users/me/addresses');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    }, 15000);

    it('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/users/me/addresses')
        .set('Cookie', [`token=invalid.token`]);

      expect(res.statusCode).toBe(401);
    }, 15000);
  });

  describe('POST /api/auth/users/me/addresses', () => {
    it('should successfully add a new address with valid data', async () => {
      const addressData = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        pincode: '100001',
        phone: '9876543210'
      };

      const mockUser = {
        _id: mockUserId,
        address: [],
        save: jest.fn().mockResolvedValue({
          _id: mockUserId,
          address: [{
            _id: mockAddressId,
            ...addressData,
            isDefault: true
          }]
        })
      };

      User.findById.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/users/me/addresses')
        .set('Cookie', [`token=${authToken}`])
        .send(addressData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('street', addressData.street);
      expect(res.body).toHaveProperty('city', addressData.city);
    }, 15000);

    it('should return 400 if pincode is invalid', async () => {
      const addressData = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        pincode: '12345', // Invalid - should be 6 digits
        phone: '9876543210'
      };

      const res = await request(app)
        .post('/api/auth/users/me/addresses')
        .set('Cookie', [`token=${authToken}`])
        .send(addressData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
    }, 15000);

    it('should return 400 if phone is invalid', async () => {
      const addressData = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        pincode: '100001',
        phone: '987654' // Invalid - should be 10 digits
      };

      const res = await request(app)
        .post('/api/auth/users/me/addresses')
        .set('Cookie', [`token=${authToken}`])
        .send(addressData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
    }, 15000);

    it('should return 400 if required fields are missing', async () => {
      const addressData = {
        street: '123 Main St',
        city: 'New York'
        // Missing state, pincode, and phone
      };

      const res = await request(app)
        .post('/api/auth/users/me/addresses')
        .set('Cookie', [`token=${authToken}`])
        .send(addressData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
    }, 15000);

    it('should return 401 if not authenticated', async () => {
      const addressData = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        pincode: '100001',
        phone: '9876543210'
      };

      const res = await request(app)
        .post('/api/auth/users/me/addresses')
        .send(addressData);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    }, 15000);

    it('should set first address as default', async () => {
      const addressData = {
        street: '456 Oak Ave',
        city: 'Boston',
        state: 'MA',
        pincode: '200001',
        phone: '9876543211'
      };

      const mockUser = {
        _id: mockUserId,
        address: [],
        save: jest.fn().mockResolvedValue({
          _id: mockUserId,
          address: [{
            _id: mockAddressId,
            ...addressData,
            isDefault: true
          }]
        })
      };

      User.findById.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/users/me/addresses')
        .set('Cookie', [`token=${authToken}`])
        .send(addressData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('isDefault');
    }, 15000);

    it('should allow marking address as default', async () => {
      const addressData = {
        street: '789 Pine Rd',
        city: 'Chicago',
        state: 'IL',
        pincode: '300001',
        phone: '9876543212',
        isDefault: true
      };

      const mockUser = {
        _id: mockUserId,
        address: [],
        save: jest.fn().mockResolvedValue({
          _id: mockUserId,
          address: [{
            _id: mockAddressId,
            ...addressData,
            isDefault: true
          }]
        })
      };

      User.findById.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/users/me/addresses')
        .set('Cookie', [`token=${authToken}`])
        .send(addressData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('isDefault', true);
    }, 15000);
  });

  describe('DELETE /api/auth/users/me/addresses/:addressId', () => {
    let addressId = '507f1f77bcf86cd799439012'; // Mock address ID

    it('should successfully delete an address', async () => {
      const mockUser = {
        _id: mockUserId,
        address: [{
          _id: addressId,
          street: '123 Main St',
          isDefault: true
        }],
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);

      const res = await request(app)
        .delete(`/api/auth/users/me/addresses/${addressId}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
    }, 15000);

    it('should return 404 if address not found', async () => {
      const invalidAddressId = '507f1f77bcf86cd799439099';

      const mockUser = {
        _id: mockUserId,
        address: [{
          _id: addressId,
          street: '123 Main St'
        }],
        save: jest.fn()
      };

      User.findById.mockResolvedValue(mockUser);

      const res = await request(app)
        .delete(`/api/auth/users/me/addresses/${invalidAddressId}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message');
    }, 15000);

    it('should return 400 if addressId is invalid format', async () => {
      const invalidAddressId = 'invalid-id-format';

      const res = await request(app)
        .delete(`/api/auth/users/me/addresses/${invalidAddressId}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    }, 15000);

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .delete(`/api/auth/users/me/addresses/${addressId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    }, 15000);

    it('should not allow deleting another user\'s address', async () => {
      const otherUserId = '507f1f77bcf86cd799439099';
      const otherUserToken = jwt.sign(
        {
          id: otherUserId,
          username: 'otheruser',
          email: 'other@example.com'
        },
        jwtSecret,
        { expiresIn: '1h' }
      );

      // Mock returning null for other user (user doesn't exist)
      User.findById.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/auth/users/me/addresses/${addressId}`)
        .set('Cookie', [`token=${otherUserToken}`]);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message');
    }, 15000);

    it('should return success message after deletion', async () => {
      const mockUser = {
        _id: mockUserId,
        address: [{
          _id: addressId,
          street: '123 Main St'
        }],
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);

      const res = await request(app)
        .delete(`/api/auth/users/me/addresses/${addressId}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(typeof res.body.message).toBe('string');
    }, 15000);
  });
});
