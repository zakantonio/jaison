import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../LoginForm';
import { AuthProvider } from '../../../hooks/useAuth';
import * as authService from '../../../services/auth';

// Mock the auth service
jest.mock('../../../services/auth', () => ({
  login: jest.fn(),
  checkAuth: jest.fn(),
  getToken: jest.fn(),
}));

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: { from: { pathname: '/dashboard' } } }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService.checkAuth as jest.Mock).mockResolvedValue(null);
    (authService.getToken as jest.Mock).mockReturnValue(null);
  });

  const renderLoginForm = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders login form correctly', () => {
    renderLoginForm();
    
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('create a new account')).toBeInTheDocument();
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
  });

  test('submits form with email and password', async () => {
    (authService.login as jest.Mock).mockResolvedValue({ id: '1', name: 'Test User', email: 'test@example.com' });
    
    renderLoginForm();
    
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('shows error message on login failure', async () => {
    (authService.login as jest.Mock).mockRejectedValue(new Error('Invalid email or password'));
    
    renderLoginForm();
    
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  test('disables submit button while submitting', async () => {
    // Make the login function take some time to resolve
    (authService.login as jest.Mock).mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ id: '1', name: 'Test User', email: 'test@example.com' });
        }, 100);
      });
    });
    
    renderLoginForm();
    
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    
    // Button should be disabled and show "Signing in..."
    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled();
    
    // Wait for the login to complete
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalled();
    });
  });
});
