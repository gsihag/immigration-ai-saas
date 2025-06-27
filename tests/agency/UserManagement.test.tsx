import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { UserManagement } from '@/components/agency/UserManagement';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      signUp: jest.fn(),
      admin: {
        getUserById: jest.fn()
      }
    }
  }
}));

// Mock useAuth hook
jest.mock('@/components/auth/AuthProvider', () => ({
  ...jest.requireActual('@/components/auth/AuthProvider'),
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      agency_id: 'test-agency-id',
      role: 'agency_admin',
      first_name: 'Test',
      last_name: 'Admin'
    }
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

describe('UserManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user management for agency admin', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        role: 'agency_staff',
        phone: '+1-555-0001',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z'
      }
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockUsers,
            error: null
          })
        })
      })
    });

    (supabase.auth.admin.getUserById as jest.Mock).mockResolvedValue({
      data: { user: { email: 'john.doe@example.com' } }
    });

    renderWithProviders(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });
  });

  it('shows permission denied for non-admin users', () => {
    // Mock non-admin user
    jest.doMock('@/components/auth/AuthProvider', () => ({
      ...jest.requireActual('@/components/auth/AuthProvider'),
      useAuth: () => ({
        user: {
          id: 'test-user-id',
          agency_id: 'test-agency-id',
          role: 'agency_staff',
          first_name: 'Test',
          last_name: 'Staff'
        }
      })
    }));

    renderWithProviders(<UserManagement />);

    expect(screen.getByText("You don't have permission to manage users.")).toBeInTheDocument();
  });

  it('opens add user dialog when clicking add user button', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
    });

    renderWithProviders(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add User'));

    expect(screen.getByText('Add New User')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('creates new user when form is submitted', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null
        })
      })
    });

    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: { id: 'new-user-id' } },
      error: null
    });

    renderWithProviders(<UserManagement />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add User'));
    });

    // Fill form
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'Jane' }
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'Smith' }
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'jane.smith@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /add user/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'jane.smith@example.com',
        password: 'password123',
        options: {
          data: {
            first_name: 'Jane',
            last_name: 'Smith',
            role: 'agency_staff',
            agency_id: 'test-agency-id'
          }
        }
      });
    });
  });

  it('deactivates user when deactivate button is clicked', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        role: 'agency_staff',
        phone: '+1-555-0001',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z'
      }
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockUsers,
            error: null
          })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null
        })
      })
    });

    (supabase.auth.admin.getUserById as jest.Mock).mockResolvedValue({
      data: { user: { email: 'john.doe@example.com' } }
    });

    renderWithProviders(<UserManagement />);

    await waitFor(() => {
      const deactivateButton = screen.getByRole('button', { name: '' });
      fireEvent.click(deactivateButton);
    });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('users');
    });
  });
});