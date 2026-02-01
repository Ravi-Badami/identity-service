const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const jwtUtils = require('../../utils/jwt.utils');
const jwt = require('jsonwebtoken');

// Mock config for JWT tests
jest.mock('../../config/jwt', () => ({
  secret: 'test-access-secret',
  refreshSecret: 'test-refresh-secret',
  accessExpire: '15m',
  refreshExpire: '7d',
}));

describe('Utils Unit Tests', () => {
  describe('ApiError', () => {
    test('should create an error with correct properties', () => {
      const error = new ApiError(400, 'Bad Request', true, { field: 'email' });
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad Request');
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual({ field: 'email' });
      expect(error.timestamp).toBeDefined();
    });

    test('static methods should create correct errors', () => {
      const badRequest = ApiError.badRequest('Invalid input');
      expect(badRequest.statusCode).toBe(400);
      expect(badRequest.message).toBe('Invalid input');

      const unauthorized = ApiError.unauthorized();
      expect(unauthorized.statusCode).toBe(401);

      const notFound = ApiError.notFound();
      expect(notFound.statusCode).toBe(404);

      const internal = ApiError.internal();
      expect(internal.statusCode).toBe(500);
    });
  });

  describe('asyncHandler', () => {
    test('should call the function with req, res, next', async () => {
      const req = {};
      const res = {};
      const next = jest.fn();
      const fn = jest.fn().mockResolvedValue('success');

      await asyncHandler(fn)(req, res, next);
      expect(fn).toHaveBeenCalledWith(req, res, next);
    });

    test('should catch errors and call next', async () => {
      const req = {};
      const res = {};
      const next = jest.fn();
      const error = new Error('Test Error');
      const fn = jest.fn().mockRejectedValue(error);

      await asyncHandler(fn)(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('jwt.utils', () => {
    const userId = 'user-123';
    const role = 'user';
    const familyId = 'family-123';

    test('generateFamilyId should return a UUID', () => {
      const id = jwtUtils.generateFamilyId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('generateAccessToken should return a signed token', () => {
      const token = jwtUtils.generateAccessToken(userId, role);
      expect(typeof token).toBe('string');
      const decoded = jwt.verify(token, 'test-access-secret');
      expect(decoded.id).toBe(userId);
      expect(decoded.role).toBe(role);
    });

    test('generateRefreshToken should return a signed token', () => {
      const token = jwtUtils.generateRefreshToken(userId, familyId);
      expect(typeof token).toBe('string');
      const decoded = jwt.verify(token, 'test-refresh-secret');
      expect(decoded.id).toBe(userId);
      expect(decoded.familyId).toBe(familyId);
    });

    test('verifyAccessToken should verify a valid token', () => {
      const token = jwt.sign({ id: userId, role }, 'test-access-secret');
      const decoded = jwtUtils.verifyAccessToken(token);
      expect(decoded.id).toBe(userId);
    });

    test('verifyRefreshToken should verify a valid token', () => {
      const token = jwt.sign({ id: userId, familyId }, 'test-refresh-secret');
      const decoded = jwtUtils.verifyRefreshToken(token);
      expect(decoded.id).toBe(userId);
      expect(decoded.familyId).toBe(familyId);
    });
  });
});
