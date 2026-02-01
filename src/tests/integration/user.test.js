// Mock strictLimiter
jest.mock('../../middlewares/strictLimiter.middleware', () => (req, res, next) => next());

const request = require('supertest');
const app = require('../../app');
require('./setup');

describe('User Integration Tests', () => {
  let userId;

  beforeEach(async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'user@example.com',
      password: 'password123',
      name: 'Test User'
    });
    userId = res.body._id;
  });

  describe('GET /api/v1/users', () => {
    test('should return list of users', async () => {
      const res = await request(app).get('/api/v1/users');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].email).toBe('user@example.com');
    });

    test('should support pagination', async () => {
      const res = await request(app).get('/api/v1/users?limit=1&page=1');
      expect(res.statusCode).toBe(200);
      expect(res.body.limit).toBe(1);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    test('should return user by id', async () => {
      const res = await request(app).get(`/api/v1/users/${userId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe(userId);
    });

    test('should return 400 for invalid id format', async () => {
        // Assuming validation middleware checks param format
      const res = await request(app).get('/api/v1/users/invalid-id');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    test('should delete user', async () => {
      const res = await request(app).delete(`/api/v1/users/${userId}`);
      expect(res.statusCode).toBe(200);
      
      const check = await request(app).get(`/api/v1/users/${userId}`);
      expect(check.statusCode).toBe(404);
    });
  });
});
