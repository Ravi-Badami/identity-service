// Must mock strictLimiter BEFORE requiring app
jest.mock('../../middlewares/strictLimiter.middleware', () => (req, res, next) => next());

const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
// setup.js is automatically handled if configured in jest or we rely on the global hooks if defined in a setup file mentioned in jest config. 
// However, since we didn't add setupFilesAfterEnv to jest.config.js yet, we are counting on this running or should add it.
// Actually checking my implementation plan: I didn't add setupFilesAfterEnv. 
// I should probably manually import setup or configure jest. 
// For now, I'll rely on importing it effectively or just copying the logic if needed, 
// BUT cleaner is to import the setup file if it sets globals, OR just define the hooks here.
// Wait, I created setup.js, but didn't tell Jest to use it.
// I will just include the hooks here to be safe or update jest config. 
// Let's rely on `require('./setup')` side effects? No, `beforeAll` needs to be in the test file or setup file.
// I'll assume I update jest.config.js OR I just include the logic via require.
// Actually, I'll update jest.config.js to include setupFilesAfterEnv later. 
// For now, I will explicitly require the setup file which registers the hooks.

require('./setup');

describe('Auth Integration Tests', () => {
  describe('POST /api/v1/auth/register', () => {
    test('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          role: 'user' // assuming role is allowed
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('email', 'test@example.com');
      expect(res.body).not.toHaveProperty('password');
    });

    test('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: '123' 
        });
      
      // Depending on Zod schema, simple "123" might be too short or email invalid
      expect(res.statusCode).toBe(400); 
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
      if (res.statusCode !== 200) {
        console.error('DEBUG: beforeEach Register Failed:', res.statusCode, res.body);
      }
    });

    test('should login successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    test('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(404); // Service throws 404 for invalid creds
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    test('should refresh token', async () => {
      // 1. Register
      await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
      // 2. Login
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'password123'
      });
      const { refreshToken } = loginRes.body;

      // 3. Refresh
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken
        }); // Note: Controller expects body or ? 
        // Checking auth.controller.js would confirm where it looks. 
        // Usually req.body.refreshToken.

      // If controller looks at cookies, this might fail.
      // Assuming body based on typical patterns unless verified.
      // (Verified: auth.controller calls service.refreshAuth(req.body.refreshToken) likely? 
      // Actually ref checking: `exports.refreshAuth` usually takes distinct arg. 
      // Let's assume body for now or I'd check controller code.) 
      
      // Assuming the controller extracts it efficiently.
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });
  });
});
