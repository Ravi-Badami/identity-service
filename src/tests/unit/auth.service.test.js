const authService = require('../../modules/auth/auth.service');
const authRepo = require('../../modules/auth/auth.repo');
const userRepo = require('../../modules/user/user.repo');
const jwtUtils = require('../../utils/jwt.utils');
const bcrypt = require('bcrypt');
const ApiError = require('../../utils/ApiError');

jest.mock('../../modules/auth/auth.repo');
jest.mock('../../modules/user/user.repo');
jest.mock('../../utils/jwt.utils');
jest.mock('bcrypt');

describe('Auth Service Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    test('should register a new user', async () => {
      const userData = { email: 'test@test.com', password: 'password' };
      userRepo.findUserByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      authRepo.registerUser.mockImplementation(async (data) => ({
          ...data,
          _id: 'user123',
          toObject: () => ({ ...data, _id: 'user123' })
      }));

      const result = await authService.registerUser(userData);

      expect(userRepo.findUserByEmail).toHaveBeenCalledWith(userData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(authRepo.registerUser).toHaveBeenCalled();
      expect(result.email).toBe(userData.email);
      expect(result.password).toBeUndefined(); // Password should be removed
    });

    test('should throw conflict if email exists', async () => {
      userRepo.findUserByEmail.mockResolvedValue({ _id: '1' });
      await expect(authService.registerUser({ email: 'test@test.com', password: '123' }))
        .rejects.toThrow('Email already taken');
    });
  });

  describe('loginUser', () => {
    test('should return tokens on successful login', async () => {
        const userData = { email: 'test@test.com', password: 'password' };
        const mockUser = { _id: 'user123', email: 'test@test.com', password: 'hashedPassword', role: 'user' };
        
        authRepo.findUserByEmailWithPassword.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        jwtUtils.generateFamilyId.mockReturnValue('family123');
        jwtUtils.generateAccessToken.mockReturnValue('accessToken');
        jwtUtils.generateRefreshToken.mockReturnValue('refreshToken');
        
        const result = await authService.loginUser(userData);

        expect(result).toHaveProperty('accessToken', 'accessToken');
        expect(result).toHaveProperty('refreshToken', 'refreshToken');
        expect(authRepo.createTokenFamily).toHaveBeenCalled();
    });

    test('should throw error on invalid credentials', async () => {
        authRepo.findUserByEmailWithPassword.mockResolvedValue(null);
        await expect(authService.loginUser({ email: 'wrong', password: 'wrong' }))
            .rejects.toThrow('Invalid email or pass');
    });
  });

  describe('refreshAuth', () => {
      test('should rotate tokens successfully (SCENARIO 4)', async () => {
          const incomingToken = 'validRefToken';
          const decoded = { id: 'user1', familyId: 'fam1' };
          const family = { token: incomingToken, previousToken: 'oldToken' };
          
          jwtUtils.verifyRefreshToken.mockReturnValue(decoded);
          authRepo.findTokenFamily.mockResolvedValue(family);
          jwtUtils.generateRefreshToken.mockReturnValue('newRefToken');
          jwtUtils.generateAccessToken.mockReturnValue('newAccessToken');

          const result = await authService.refreshAuth(incomingToken);

          expect(result).toEqual({ accessToken: 'newAccessToken', refreshToken: 'newRefToken' });
          expect(authRepo.rotateToken).toHaveBeenCalled();
      });

      test('should detect reuse and revoke family (SCENARIO 2)', async () => {
          const incomingToken = 'stolenToken';
          const decoded = { id: 'user1', familyId: 'fam1' };
          const family = { token: 'currentToken', previousToken: 'prevToken' }; // Incoming doesn't match either
          
          jwtUtils.verifyRefreshToken.mockReturnValue(decoded);
          authRepo.findTokenFamily.mockResolvedValue(family);

          await expect(authService.refreshAuth(incomingToken)).rejects.toThrow('Reuse detected');
          expect(authRepo.revokeFamily).toHaveBeenCalledWith(decoded.familyId);
      });
  });
});
