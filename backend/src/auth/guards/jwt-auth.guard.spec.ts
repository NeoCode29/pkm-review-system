import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('handleRequest', () => {
    it('should return user when valid', () => {
      const user = { id: 'uuid-123', role: 'mahasiswa' };
      const result = guard.handleRequest(null, user, null);
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when no user', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw the original error when error is provided', () => {
      const error = new Error('Token expired');
      expect(() => guard.handleRequest(error, null, null)).toThrow('Token expired');
    });

    it('should throw error even if user exists when error is provided', () => {
      const error = new UnauthorizedException('Bad token');
      const user = { id: 'uuid-123' };
      expect(() => guard.handleRequest(error, user, null)).toThrow(
        UnauthorizedException,
      );
    });
  });
});
