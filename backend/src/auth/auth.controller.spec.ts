import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  registerMahasiswa: jest.fn(),
  login: jest.fn(),
  getProfile: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.registerMahasiswa with dto', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'Password123!',
        nama: 'Test User',
        nim: '123456789012',
        jurusanId: '1',
        programStudiId: '1',
      };
      const expected = {
        user: { id: 'uuid-123', email: 'test@example.com' },
        mahasiswa: { id: '1', nama: 'Test User', nim: '123456789012' },
      };
      mockAuthService.registerMahasiswa.mockResolvedValueOnce(expected);

      const result = await controller.register(dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.registerMahasiswa).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should call authService.login with dto', async () => {
      const dto = { email: 'test@example.com', password: 'Password123!' };
      const expected = {
        access_token: 'token-abc',
        refresh_token: 'refresh-abc',
        user: { id: 'uuid-123', email: 'test@example.com', role: 'mahasiswa' },
        profile: { id: '1', nama: 'Test User', nim: '123456789012' },
      };
      mockAuthService.login.mockResolvedValueOnce(expected);

      const result = await controller.login(dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('getProfile', () => {
    it('should call authService.getProfile with user id', async () => {
      const user = { id: 'uuid-123', email: 'test@example.com', role: 'mahasiswa' };
      const expected = { role: 'mahasiswa', profile: { id: 1n, nama: 'Test' } };
      mockAuthService.getProfile.mockResolvedValueOnce(expected);

      const result = await controller.getProfile(user as any);

      expect(result).toEqual(expected);
      expect(mockAuthService.getProfile).toHaveBeenCalledWith('uuid-123');
    });
  });
});
