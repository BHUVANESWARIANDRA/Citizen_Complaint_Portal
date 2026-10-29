import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
  navigate: vi.fn(),
  provisionOfficer: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mocks.login,
    logout: mocks.logout,
    provisionOfficer: mocks.provisionOfficer,
    isAdmin: false,
  }),
}));

vi.mock('../router/Router', () => ({
  useRouter: () => ({ navigate: mocks.navigate }),
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}));

import OfficerLoginPage from '../pages/OfficerLoginPage';
import OfficerRegisterPage from '../pages/OfficerRegisterPage';

describe('Officer authentication pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs in a registered officer and routes to the officer dashboard', async () => {
    mocks.login.mockResolvedValue({ role: 'ROLE_OFFICER' });
    render(<OfficerLoginPage />);

    fireEvent.change(screen.getByLabelText('Official Email Address'), {
      target: { value: 'officer@example.gov' },
    });
    fireEvent.change(screen.getByLabelText('Officer Password'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in as officer/i }));

    await waitFor(() => {
      expect(mocks.login).toHaveBeenCalledWith({
        email: 'officer@example.gov',
        password: 'correct-password',
      });
    });
    await waitFor(
      () => expect(mocks.navigate).toHaveBeenCalledWith('/officer/dashboard'),
      { timeout: 1500 }
    );
  });

  it('shows a generic error for invalid officer credentials', async () => {
    mocks.login.mockRejectedValue({
      response: { status: 401, data: { message: 'Invalid email address or password' } },
    });
    render(<OfficerLoginPage />);

    fireEvent.change(screen.getByLabelText('Official Email Address'), {
      target: { value: 'officer@example.gov' },
    });
    fireEvent.change(screen.getByLabelText('Officer Password'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in as officer/i }));

    expect(await screen.findByText('Sign-in failed. Check your official email and password.'))
      .toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('submits the server setup key separately and routes a new officer to sign-in', async () => {
    mocks.provisionOfficer.mockResolvedValue({ role: 'ROLE_OFFICER' });
    render(<OfficerRegisterPage />);

    fireEvent.change(screen.getByLabelText('Officer Name *'), {
      target: { value: 'Officer Lee' },
    });
    fireEvent.change(screen.getByLabelText('Official Email Address *'), {
      target: { value: 'lee@example.gov' },
    });
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: 'secure-password' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password *'), {
      target: { value: 'secure-password' },
    });
    fireEvent.change(screen.getByLabelText('Officer Authorization Key *'), {
      target: { value: 'server-only-key' },
    });
    fireEvent.click(screen.getByRole('button', { name: /provision officer account/i }));

    await waitFor(() => {
      expect(mocks.provisionOfficer).toHaveBeenCalledWith({
        name: 'Officer Lee',
        email: 'lee@example.gov',
        phone: null,
        password: 'secure-password',
        confirmPassword: 'secure-password',
      }, 'server-only-key');
    });
    await waitFor(
      () => expect(mocks.navigate).toHaveBeenCalledWith('/officer/login'),
      { timeout: 1500 }
    );
  });
});
