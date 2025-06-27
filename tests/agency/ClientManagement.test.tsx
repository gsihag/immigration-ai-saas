import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ClientManagement } from '@/components/agency/ClientManagement';
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
      role: 'agency_staff',
      first_name: 'Test',
      last_name: 'Staff'
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

describe('ClientManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders client management for agency staff', async () => {
    const mockClients = [
      {
        id: 'client-1',
        user_id: 'user-1',
        date_of_birth: '1990-01-01',
        nationality: 'Canadian',
        created_at: '2023-01-01T00:00:00Z',
        user: {
          first_name: 'Alice',
          last_name: 'Johnson',
          phone: '+1-555-0001',
          is_active: true
        }
      }
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockClients,
            error: null
          })
        })
      })
    });

    (supabase.auth.admin.getUserById as jest.Mock).mockResolvedValue({
      data: { user: { email: 'alice.johnson@example.com' } }
    });

    renderWithProviders(<ClientManagement />);

    await waitFor(() => {
      expect(screen.getByText('Client Management')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Add Client')).toBeInTheDocument();
    });
  });

  it('shows permission denied for client users', () => {
    // Mock client user
    jest.doMock('@/components/auth/AuthProvider', () => ({
      ...jest.requireActual('@/components/auth/AuthProvider'),
      useAuth: () => ({
        user: {
          id: 'test-user-id',
          agency_id: 'test-agency-id',
          role: 'client',
          first_name: 'Test',
          last_name: 'Client'
        }
      })
    }));

    renderWithProviders(<ClientManagement />);

    expect(screen.getByText("You don't have permission to manage clients.")).toBeInTheDocument();
  });

  it('opens add client dialog with comprehensive form', async () => {
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

    renderWithProviders(<ClientManagement />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Client'));
    });

    expect(screen.getByText('Add New Client')).toBeInTheDocument();
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Emergency Contact')).toBeInTheDocument();
  });

  it('creates new client when comprehensive form is submitted', async () => {
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
      }),
      insert: jest.fn().mockResolvedValue({
        error: null
      })
    });

    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: { id: 'new-client-id' } },
      error: null
    });

    renderWithProviders(<ClientManagement />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Client'));
    });

    // Fill basic information
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'Bob' }
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'Wilson' }
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'bob.wilson@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /add client/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'bob.wilson@example.com',
        password: 'password123',
        options: {
          data: {
            first_name: 'Bob',
            last_name: 'Wilson',
            role: 'client',
            agency_id: 'test-agency-id'
          }
        }
      });
    });
  });

  it('displays client information in table format', async () => {
    const mockClients = [
      {
        id: 'client-1',
        user_id: 'user-1',
        date_of_birth: '1990-01-01',
        nationality: 'Canadian',
        created_at: '2023-01-01T00:00:00Z',
        user: {
          first_name: 'Alice',
          last_name: 'Johnson',
          phone: '+1-555-0001',
          is_active: true
        }
      }
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockClients,
            error: null
          })
        })
      })
    });

    (supabase.auth.admin.getUserById as jest.Mock).mockResolvedValue({
      data: { user: { email: 'alice.johnson@example.com' } }
    });

    renderWithProviders(<ClientManagement />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Canadian')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });
});