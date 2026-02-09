import { of } from 'rxjs';
import { BigIntInterceptor } from './bigint.interceptor';

describe('BigIntInterceptor', () => {
  let interceptor: BigIntInterceptor;

  beforeEach(() => {
    interceptor = new BigIntInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  function runInterceptor(data: any): Promise<any> {
    const context = {} as any;
    const next = { handle: () => of(data) };
    return new Promise((resolve) => {
      interceptor.intercept(context, next).subscribe(resolve);
    });
  }

  it('should convert BigInt to string', async () => {
    const result = await runInterceptor({ id: 1n, name: 'test' });
    expect(result).toEqual({ id: '1', name: 'test' });
  });

  it('should handle nested BigInt', async () => {
    const result = await runInterceptor({
      id: 1n,
      team: { id: 2n, name: 'Team A' },
    });
    expect(result).toEqual({
      id: '1',
      team: { id: '2', name: 'Team A' },
    });
  });

  it('should handle arrays with BigInt', async () => {
    const result = await runInterceptor([
      { id: 1n, name: 'A' },
      { id: 2n, name: 'B' },
    ]);
    expect(result).toEqual([
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ]);
  });

  it('should handle null and undefined', async () => {
    expect(await runInterceptor(null)).toBeNull();
    expect(await runInterceptor(undefined)).toBeUndefined();
  });

  it('should convert Date to ISO string', async () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    const result = await runInterceptor({ createdAt: date });
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('should pass through primitive types', async () => {
    const result = await runInterceptor({
      str: 'hello',
      num: 42,
      bool: true,
    });
    expect(result).toEqual({ str: 'hello', num: 42, bool: true });
  });

  it('should handle deeply nested structures', async () => {
    const result = await runInterceptor({
      level1: {
        level2: {
          level3: { id: 99n },
        },
      },
    });
    expect(result.level1.level2.level3.id).toBe('99');
  });
});
