import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ClientPortal } from '@/components/client/ClientPortal';
import { AuthProvider } from '@/components/auth/AuthProvider';

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

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }
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

describe('ClientPortal', () => {
  it('renders client portal for client users', () => {
    renderWithProviders(<ClientPortal />);

    expect(screen.getByText('Client Portal')).toBeInTheDocument();
    expect(screen.getByText('Manage your profile and immigration information')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Immigration Info')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('shows access denied for non-client users', () => {
    // Mock non-client user
    jest.doMock('@/components/auth/AuthProvider', () => ({
      ...jest.requireActual('@/components/auth/AuthProvider'),
      useAuth: () => ({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'agency_staff',
          first_name: 'Test',
          last_name: 'User'
        }
      })
    }));

    renderWithProviders(<ClientPortal />);

    expect(screen.getByText('Access denied. This portal is for clients only.')).toBeInTheDocument();
  });

  it('allows navigation between tabs', async () => {
    renderWithProviders(<ClientPortal />);

    // Click on Immigration Info tab
    fireEvent.click(screen.getByText('Immigration Info'));
    
    await waitFor(() => {
      expect(screen.getByText('Immigration Information')).toBeInTheDocument();
    });

    // Click on Documents tab
    fireEvent.click(screen.getByText('Documents'));
    
    await waitFor(() => {
      expect(screen.getByText('My Documents')).toBeInTheDocument();
    });
  });
});