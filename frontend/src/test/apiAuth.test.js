import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  requestInterceptor: vi.fn(),
  responseInterceptor: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: () => ({
      post: mocks.post,
      get: mocks.get,
      put: mocks.put,
      delete: mocks.delete,
      interceptors: {
        request: { use: mocks.requestInterceptor },
        response: { use: mocks.responseInterceptor },
      },
    }),
  },
}));

import { AuthService } from '../services/api';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('sends the officer setup key only in the authorization header', async () => {
    mocks.post.mockResolvedValue({
      data: { userId: 7, role: 'ROLE_OFFICER', token: null },
    });

    await AuthService.provisionOfficer({
      name: 'Officer Lee',
      email: 'lee@example.gov',
      phone: null,
      password: 'secure-password',
      confirmPassword: 'secure-password',
      setupKey: 'server-only-key',
    }, 'server-only-key');

    expect(mocks.post).toHaveBeenCalledWith(
      '/api/auth/officer/register',
      {
        name: 'Officer Lee',
        email: 'lee@example.gov',
        phone: null,
        password: 'secure-password',
        confirmPassword: 'secure-password',
      },
      { headers: { 'X-Admin-Setup-Key': 'server-only-key' } }
    );
    expect(localStorage.getItem('smart_citizen_token')).toBeNull();
  });

  it('stores the role returned by the backend after authentication', async () => {
    mocks.post.mockResolvedValue({
      data: { token: 'signed-token', role: 'ROLE_OFFICER' },
    });

    await AuthService.login({
      email: 'officer@example.gov',
      password: 'correct-password',
    });

    expect(localStorage.getItem('smart_citizen_token')).toBe('signed-token');
    expect(JSON.parse(localStorage.getItem('smart_citizen_user')).role).toBe('ROLE_OFFICER');
  });
});
