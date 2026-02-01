const { errorHandler } = require('../../middlewares/error.middleware');
const validate = require('../../middlewares/validate.middleware');
const ApiError = require('../../utils/ApiError');

describe('Middleware Unit Tests', () => {
  describe('Error Middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = { path: '/test', method: 'GET' };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
      // Mock console.log/error to keep test output clean
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should handle ApiError correctly', () => {
      const error = new ApiError(400, 'Test Error');
      errorHandler(error, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Test Error',
      }));
    });

    test('should handle Mongoose Duplicate Key Error (11000)', () => {
      const error = { code: 11000, keyValue: { email: 'test@example.com' } };
      errorHandler(error, req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'email already exists',
      }));
    });

    test('should handle Mongoose Cast Error', () => {
      const error = { name: 'CastError', path: '_id', value: 'invalid-id' };
      errorHandler(error, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid _id: invalid-id',
      }));
    });

    test('should handle generic errors as 500', () => {
      const error = new Error('Generic Error');
      errorHandler(error, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Generic Error',
      }));
    });
  });

  describe('Validate Middleware', () => {
    let req, res, next;
    const schema = {
      parse: jest.fn(),
    };

    beforeEach(() => {
        req = { body: {}, query: {}, params: {} };
        res = {};
        next = jest.fn();
    });

    test('should call next if validation succeeds', () => {
        schema.parse.mockReturnValue(true);
        validate(schema)(req, res, next);
        expect(next).toHaveBeenCalledWith();
        expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    test('should call next with error if validation fails', () => {
        const error = new Error('Validation Error');
        error.errors = [{ message: 'Field required' }];
        schema.parse.mockImplementation(() => { throw error; });
        
        validate(schema)(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(ApiError));
        expect(next.mock.calls[0][0].statusCode).toBe(400);
        expect(next.mock.calls[0][0].message).toBe('Field required');
    });
  });
});
