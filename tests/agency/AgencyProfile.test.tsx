import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AgencyProfile } from '@/components/agency/AgencyProfile';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
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
      last_name: 'User'
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

describe('AgencyProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders agency profile with data', async () => {
    const mockAgencyData = {
      id: 'test-agency-id',
      name: 'Test Immigration Law Firm',
      email: 'admin@testfirm.com',
      phone: '+1-555-0123',
      website: 'https://testfirm.com',
      address: {
        street: '123 Main St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      }
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockAgencyData,
            error: null
          })
        })
      })
    });

    renderWithProviders(<AgencyProfile />);

    await waitFor(() => {
      expect(screen.getByText('Agency Profile')).toBeInTheDocument();
      expect(screen.getByText('Test Immigration Law Firm')).toBeInTheDocument();
      expect(screen.getByText('admin@testfirm.com')).toBeInTheDocument();
    });
  });

  it('allows agency admin to edit profile', async () => {
    const mockAgencyData = {
      id: 'test-agency-id',
      name: 'Test Immigration Law Firm',
      email: 'admin@testfirm.com',
      phone: '+1-555-0123',
      website: 'https://testfirm.com',
      address: {}
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockAgencyData,
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

    renderWithProviders(<AgencyProfile />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    // Click edit button
    fireEvent.click(screen.getByText('Edit Profile'));

    // Verify form fields are editable
    const nameInput = screen.getByDisplayValue('Test Immigration Law Firm');
    expect(nameInput).toBeInTheDocument();

    // Update name
    fireEvent.change(nameInput, { target: { value: 'Updated Law Firm' } });

    // Save changes
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('agencies');
    });
  });

  it('shows loading state initially', () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockImplementation(() => new Promise(() => {}))
        })
      })
    });

    renderWithProviders(<AgencyProfile />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('handles error when fetching agency data', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Agency not found' }
          })
        })
      })
    });

    renderWithProviders(<AgencyProfile />);

    await waitFor(() => {
      expect(screen.getByText('No agency information found.')).toBeInTheDocument();
    });
  });
});