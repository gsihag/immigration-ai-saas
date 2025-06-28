import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ChatPanel } from '@/components/chat/ChatPanel';
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
      id: 'test-staff-id',
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

describe('ChatPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat management panel for agency staff', async () => {
    const mockConversations = [
      {
        id: 'conv-1',
        title: 'Client Support',
        status: 'active',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T11:00:00Z',
        client: {
          user: {
            first_name: 'John',
            last_name: 'Doe'
          }
        }
      }
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockConversations,
            error: null
          })
        })
      })
    });

    renderWithProviders(<ChatPanel />);

    await waitFor(() => {
      expect(screen.getByText('Chat Management')).toBeInTheDocument();
      expect(screen.getByText('Active Conversations')).toBeInTheDocument();
      expect(screen.getByText('Client Conversations')).toBeInTheDocument();
    });
  });

  it('shows access denied for non-agency users', () => {
    // Mock client user
    jest.doMock('@/components/auth/AuthProvider', () => ({
      ...jest.requireActual('@/components/auth/AuthProvider'),
      useAuth: () => ({
        user: {
          id: 'test-client-id',
          role: 'client',
          first_name: 'Test',
          last_name: 'Client'
        }
      })
    }));

    renderWithProviders(<ChatPanel />);

    expect(screen.getByText('Access denied. This panel is for agency staff only.')).toBeInTheDocument();
  });

  it('displays conversation statistics', async () => {
    const mockConversations = [
      {
        id: 'conv-1',
        status: 'active',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T11:00:00Z',
        client: { user: { first_name: 'John', last_name: 'Doe' } }
      },
      {
        id: 'conv-2',
        status: 'closed',
        created_at: '2024-01-01T09:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
        client: { user: { first_name: 'Jane', last_name: 'Smith' } }
      }
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockConversations,
            error: null
          })
        })
      })
    });

    renderWithProviders(<ChatPanel />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Active conversations count
    });
  });

  it('displays conversations in table format', async () => {
    const mockConversations = [
      {
        id: 'conv-1',
        title: 'Client Support',
        status: 'active',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T11:00:00Z',
        client: {
          user: {
            first_name: 'John',
            last_name: 'Doe'
          }
        }
      }
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockConversations,
            error: null
          })
        })
      })
    });

    renderWithProviders(<ChatPanel />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Client Support')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('View Chat')).toBeInTheDocument();
    });
  });

  it('allows closing active conversations', async () => {
    const mockConversations = [
      {
        id: 'conv-1',
        title: 'Client Support',
        status: 'active',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T11:00:00Z',
        client: {
          user: {
            first_name: 'John',
            last_name: 'Doe'
          }
        }
      }
    ];

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null })
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockConversations,
            error: null
          })
        })
      }),
      update: mockUpdate
    });

    renderWithProviders(<ChatPanel />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Close'));
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'closed',
        updated_at: expect.any(String)
      });
    });
  });

  it('shows empty state when no conversations exist', async () => {
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

    renderWithProviders(<ChatPanel />);

    await waitFor(() => {
      expect(screen.getByText('No conversations found.')).toBeInTheDocument();
    });
  });
});