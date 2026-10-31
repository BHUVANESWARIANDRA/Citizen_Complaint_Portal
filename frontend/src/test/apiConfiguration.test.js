import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from '../services/api';

describe('resolveApiBaseUrl', () => {
  it('keeps an empty URL for local proxy routing', () => {
    expect(resolveApiBaseUrl('')).toBe('');
  });

  it('adds HTTPS to a Render service hostname', () => {
    expect(resolveApiBaseUrl('smart-citizen-api.onrender.com'))
      .toBe('https://smart-citizen-api.onrender.com');
  });

  it('preserves an explicitly configured HTTP or HTTPS URL', () => {
    expect(resolveApiBaseUrl('https://api.example.test')).toBe('https://api.example.test');
    expect(resolveApiBaseUrl('http://localhost:8081')).toBe('http://localhost:8081');
  });
});
