import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ClientProfile } from '@/components/client/ClientProfile';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Mock useAuth hook
jest.mock('@/components/auth/AuthProvider', () => ({
  ...jest.requireActual('@/components/auth/AuthProvider'),
  useAuth: () => ({
    user: {
      id: 'test-client-id',
      email: 'test.client@example.com',
      role: 'client',
      first_name: 'Test',
      last_name: 'Client'
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

describe('ClientProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders client profile sections', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' } // No rows found
          })
        })
      })
    });

    renderWithProviders(<ClientProfile />);

    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument();
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Immigration Details')).toBeInTheDocument();
      expect(screen.getByText('Address Information')).toBeInTheDocument();
      expect(screen.getByText('Emergency Contact')).toBeInTheDocument();
    });
  });

  it('loads and displays existing client data', async () => {
    const mockClientData = {
      id: 'client-1',
      user_id: 'test-client-id',
      date_of_birth: '1990-01-01',
      nationality: 'Canadian',
      passport_number: 'CA123456789',
      address: {
        street: '123 Main St',
        city: 'Toronto',
        state: 'ON',
        zipCode: 'M5V 3A8',
        country: 'Canada'
      },
      emergency_contact: {
        name: 'John Doe',
        phone: '+1-416-555-0123',
        relationship: 'Brother'
      },
      user: {
        first_name: 'Test',
        last_name: 'Client',
        phone: '+1-416-555-0001'
      }
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockClientData,
            error: null
          })
        })
      })
    });

    renderWithProviders(<ClientProfile />);

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('Client')).toBeInTheDocument();
      expect(screen.getByText('Canadian')).toBeInTheDocument();
      expect(screen.getByText('CA123456789')).toBeInTheDocument();
    });
  });

  it('allows editing profile information', async () => {
    const mockClientData = {
      id: 'client-1',
      user_id: 'test-client-id',
      date_of_birth: '1990-01-01',
      nationality: 'Canadian',
      user: {
        first_name: 'Test',
        last_name: 'Client',
        phone: '+1-416-555-0001'
      }
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockClientData,
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

    renderWithProviders(<ClientProfile />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    // Click edit button
    fireEvent.click(screen.getByText('Edit Profile'));

    // Verify form fields are editable
    const firstNameInput = screen.getByDisplayValue('Test');
    expect(firstNameInput).toBeInTheDocument();

    // Update first name
    fireEvent.change(firstNameInput, { target: { value: 'Updated' } });

    // Save changes
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('users');
    });
  });

  it('handles profile creation for new clients', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
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

    renderWithProviders(<ClientProfile />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Edit Profile'));
    });

    // Fill in some data
    const firstNameInput = screen.getByPlaceholderText('Enter first name');
    fireEvent.change(firstNameInput, { target: { value: 'New' } });

    const lastNameInput = screen.getByPlaceholderText('Enter last name');
    fireEvent.change(lastNameInput, { target: { value: 'Client' } });

    // Save changes
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('clients');
    });
  });
});