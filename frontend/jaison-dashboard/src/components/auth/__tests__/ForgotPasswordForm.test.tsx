import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPasswordForm from '../ForgotPasswordForm';
import { AuthProvider } from '../../../hooks/useAuth';
import * as authService from '../../../services/auth';

// Mock the auth service
jest.mock('../../../services/auth', () => ({
  requestPasswordReset: jest.fn(),
  checkAuth: jest.fn(),
  getToken: jest.fn(),
}));

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService.checkAuth as jest.Mock).mockResolvedValue(null);
    (authService.getToken as jest.Mock).mockReturnValue(null);
  });

  const renderForgotPasswordForm = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <ForgotPasswordForm />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders forgot password form correctly', () => {
    renderForgotPasswordForm();
    
    expect(screen.getByText('Reset your password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
    expect(screen.getByText('sign in to your account')).toBeInTheDocument();
  });

  test('submits form with email', async () => {
    (authService.requestPasswordReset as jest.Mock).mockResolvedValue(undefined);
    
    renderForgotPasswordForm();
    
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    
    await waitFor(() => {
      expect(authService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });
    
    // Success message should be displayed
    expect(screen.getByText('Password reset email sent')).toBeInTheDocument();
    expect(screen.getByText('If an account exists with the email you provided, you will receive a password reset link shortly.')).toBeInTheDocument();
    expect(screen.getByText('Return to login')).toBeInTheDocument();
  });

  test('shows error message on request failure', async () => {
    (authService.requestPasswordReset as jest.Mock).mockRejectedValue(new Error('Failed to send reset email'));
    
    renderForgotPasswordForm();
    
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to send reset email')).toBeInTheDocument();
    });
    
    // Form should still be visible (not success message)
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
  });

  test('disables submit button while submitting', async () => {
    // Make the requestPasswordReset function take some time to resolve
    (authService.requestPasswordReset as jest.Mock).mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(undefined);
        }, 100);
      });
    });
    
    renderForgotPasswordForm();
    
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    
    // Button should be disabled and show "Sending..."
    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
    
    // Wait for the request to complete
    await waitFor(() => {
      expect(authService.requestPasswordReset).toHaveBeenCalled();
    });
  });
});
