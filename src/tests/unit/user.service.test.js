const userService = require('../../modules/user/user.service');
const userRepo = require('../../modules/user/user.repo');
const ApiError = require('../../utils/ApiError');

jest.mock('../../modules/user/user.repo');

describe('User Service Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    test('should return paginated users', async () => {
      const mockUsers = [{ _id: '1', name: 'User 1' }];
      const mockTotal = 1;
      userRepo.findUsers.mockResolvedValue(mockUsers);
      userRepo.countUsers.mockResolvedValue(mockTotal);

      const result = await userService.getUsers({ page: 1, limit: 10 });

      expect(userRepo.findUsers).toHaveBeenCalledWith({}, 0, 10);
      expect(result).toEqual({
        data: mockUsers,
        nextCursor: '1',
        page: 1,
        limit: 10,
        total: mockTotal,
        totalPages: 1,
      });
    });

    test('should use cursor for pagination', async () => {
      const cursor = 'next_cursor_id';
      userRepo.findUsers.mockResolvedValue([]);
      userRepo.countUsers.mockResolvedValue(0);

      await userService.getUsers({ cursor, limit: 10 });

      expect(userRepo.findUsers).toHaveBeenCalledWith({ _id: { $gt: cursor } }, 0, 10);
    });
  });

  describe('getOneUser', () => {
    test('should return user if found', async () => {
      const mockUser = { _id: '1', name: 'User 1' };
      userRepo.findUserById.mockResolvedValue(mockUser);

      const result = await userService.getOneUser('1');
      expect(result).toEqual(mockUser);
    });

    test('should throw error if id not given', async () => {
      await expect(userService.getOneUser()).rejects.toThrow(ApiError);
    });

    test('should throw 404 if user not found', async () => {
      userRepo.findUserById.mockResolvedValue(null);
      await expect(userService.getOneUser('1')).rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    test('should delete user if found', async () => {
      const mockUser = { _id: '1', name: 'Deleted User' };
      userRepo.deleteUser.mockResolvedValue(mockUser);

      const result = await userService.deleteUser('1');
      expect(result).toEqual(mockUser);
    });

    test('should throw 404 if user not found to delete', async () => {
      userRepo.deleteUser.mockResolvedValue(null);
      await expect(userService.deleteUser('1')).rejects.toThrow('User not found');
    });
  });
});
