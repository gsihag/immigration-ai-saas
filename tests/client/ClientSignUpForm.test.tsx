import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ClientSignUpForm } from '@/components/auth/ClientSignUpForm';
import { AuthProvider } from '@/components/auth/AuthProvider';

// Mock useAuth hook
const mockSignUp = jest.fn();
jest.mock('@/components/auth/AuthProvider', () => ({
  ...jest.requireActual('@/components/auth/AuthProvider'),
  useAuth: () => ({
    signUp: mockSignUp
  })
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {component}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ClientSignUpForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders signup form with all required fields', () => {
    renderWithProviders(<ClientSignUpForm />);

    expect(screen.getByText('Create Your Account')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Password *')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password *')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<ClientSignUpForm />);

    // Try to submit without filling required fields
    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    renderWithProviders(<ClientSignUpForm />);

    // Fill in form with mismatched passwords
    fireEvent.change(screen.getByLabelText('First Name *'), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByLabelText('Last Name *'), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByLabelText('Email Address *'), {
      target: { value: 'john.doe@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByLabelText('Confirm Password *'), {
      target: { value: 'password456' }
    });

    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    renderWithProviders(<ClientSignUpForm />);

    // Fill in form with invalid email
    fireEvent.change(screen.getByLabelText('First Name *'), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByLabelText('Last Name *'), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByLabelText('Email Address *'), {
      target: { value: 'invalid-email' }
    });
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByLabelText('Confirm Password *'), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    renderWithProviders(<ClientSignUpForm />);

    // Fill in form with short password
    fireEvent.change(screen.getByLabelText('First Name *'), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByLabelText('Last Name *'), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByLabelText('Email Address *'), {
      target: { value: 'john.doe@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: '123' }
    });
    fireEvent.change(screen.getByLabelText('Confirm Password *'), {
      target: { value: '123' }
    });

    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
    });
  });

  it('successfully creates account with valid data', async () => {
    mockSignUp.mockResolvedValue({ error: null });

    renderWithProviders(<ClientSignUpForm />);

    // Fill in valid form data
    fireEvent.change(screen.getByLabelText('First Name *'), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByLabelText('Last Name *'), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByLabelText('Email Address *'), {
      target: { value: 'john.doe@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Phone Number'), {
      target: { value: '+1-555-0123' }
    });
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByLabelText('Confirm Password *'), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('john.doe@example.com', 'password123', {
        first_name: 'John',
        last_name: 'Doe',
        role: 'client',
        phone: '+1-555-0123'
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Welcome to Immigration AI!')).toBeInTheDocument();
    });
  });

  it('handles signup errors', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'Email already exists' } });

    renderWithProviders(<ClientSignUpForm />);

    // Fill in valid form data
    fireEvent.change(screen.getByLabelText('First Name *'), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByLabelText('Last Name *'), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByLabelText('Email Address *'), {
      target: { value: 'existing@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: 'password123' }
    });
    fireEvent.change(screen.getByLabelText('Confirm Password *'), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('clears errors when user starts typing', async () => {
    renderWithProviders(<ClientSignUpForm />);

    // Trigger validation error
    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
    });

    // Start typing in a field
    fireEvent.change(screen.getByLabelText('First Name *'), {
      target: { value: 'J' }
    });

    // Error should be cleared
    expect(screen.queryByText('Please fill in all required fields')).not.toBeInTheDocument();
  });
});