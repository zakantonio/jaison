import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegisterForm from '../RegisterForm';
import { AuthProvider } from '../../../hooks/useAuth';
import * as authService from '../../../services/auth';

// Mock the auth service
jest.mock('../../../services/auth', () => ({
  register: jest.fn(),
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

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService.checkAuth as jest.Mock).mockResolvedValue(null);
    (authService.getToken as jest.Mock).mockReturnValue(null);
  });

  const renderRegisterForm = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders register form correctly', () => {
    renderRegisterForm();
    
    expect(screen.getByText('Create a new account')).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByText('sign in to your existing account')).toBeInTheDocument();
  });

  test('shows error when passwords do not match', async () => {
    renderRegisterForm();
    
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Test User' },
    });
    
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'password456' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  test('submits form with valid data', async () => {
    (authService.register as jest.Mock).mockResolvedValue({ id: '1', name: 'Test User', email: 'test@example.com' });
    (authService.login as jest.Mock).mockResolvedValue({ id: '1', name: 'Test User', email: 'test@example.com' });
    
    renderRegisterForm();
    
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Test User' },
    });
    
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
    });
  });

  test('shows error message on registration failure', async () => {
    (authService.register as jest.Mock).mockRejectedValue(new Error('Email already registered'));
    
    renderRegisterForm();
    
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Test User' },
    });
    
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    
    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });

  test('disables submit button while submitting', async () => {
    // Make the register function take some time to resolve
    (authService.register as jest.Mock).mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ id: '1', name: 'Test User', email: 'test@example.com' });
        }, 100);
      });
    });
    
    renderRegisterForm();
    
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Test User' },
    });
    
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    
    // Button should be disabled and show "Creating account..."
    expect(screen.getByRole('button', { name: 'Creating account...' })).toBeDisabled();
    
    // Wait for the registration to complete
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalled();
    });
  });
});
