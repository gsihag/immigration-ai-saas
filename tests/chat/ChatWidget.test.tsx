import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn()
      }))
    })),
    removeChannel: jest.fn()
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

describe('ChatWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders minimized chat button', () => {
    renderWithProviders(<ChatWidget isMinimized={true} />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders expanded chat interface', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: 'conversation-id',
      error: null
    });

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

    renderWithProviders(<ChatWidget isMinimized={false} />);

    await waitFor(() => {
      expect(screen.getByText('Chat Support')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });
  });

  it('initializes conversation for client', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: 'conversation-id',
      error: null
    });

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

    renderWithProviders(<ChatWidget isMinimized={false} />);

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('get_or_create_conversation', {
        client_user_id: 'test-client-id'
      });
    });
  });

  it('sends message when form is submitted', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: 'conversation-id',
      error: null
    });

    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      }),
      insert: mockInsert
    });

    renderWithProviders(<ChatWidget isMinimized={false} />);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('Type your message...');
      fireEvent.change(input, { target: { value: 'Hello, I need help' } });
      fireEvent.click(screen.getByRole('button', { name: '' }));
    });

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        conversation_id: 'conversation-id',
        sender_id: 'test-client-id',
        sender_type: 'client',
        message_text: 'Hello, I need help',
        message_type: 'text',
        is_ai_response: false
      });
    });
  });

  it('displays welcome message for empty chat', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: 'conversation-id',
      error: null
    });

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

    renderWithProviders(<ChatWidget isMinimized={false} />);

    await waitFor(() => {
      expect(screen.getByText("Welcome! I'm here to help with your immigration questions.")).toBeInTheDocument();
      expect(screen.getByText('Type a message to get started.')).toBeInTheDocument();
    });
  });

  it('displays chat messages correctly', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        conversation_id: 'conversation-id',
        sender_id: 'test-client-id',
        sender_type: 'client',
        message_text: 'Hello, I need help',
        message_type: 'text',
        is_ai_response: false,
        created_at: '2024-01-01T10:00:00Z'
      },
      {
        id: 'msg-2',
        conversation_id: 'conversation-id',
        sender_id: null,
        sender_type: 'ai_bot',
        message_text: 'Hello! How can I assist you today?',
        message_type: 'text',
        is_ai_response: true,
        created_at: '2024-01-01T10:01:00Z'
      }
    ];

    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: 'conversation-id',
      error: null
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockMessages,
            error: null
          })
        })
      })
    });

    renderWithProviders(<ChatWidget isMinimized={false} />);

    await waitFor(() => {
      expect(screen.getByText('Hello, I need help')).toBeInTheDocument();
      expect(screen.getByText('Hello! How can I assist you today?')).toBeInTheDocument();
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
    });
  });

  it('handles FAQ responses for client messages', async () => {
    (supabase.rpc as jest.Mock)
      .mockResolvedValueOnce({
        data: 'conversation-id',
        error: null
      })
      .mockResolvedValueOnce({
        data: 'This is an automated FAQ response',
        error: null
      });

    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      }),
      insert: mockInsert
    });

    renderWithProviders(<ChatWidget isMinimized={false} />);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('Type your message...');
      fireEvent.change(input, { target: { value: 'What documents do I need?' } });
      fireEvent.click(screen.getByRole('button', { name: '' }));
    });

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('match_faq_response', {
        question_text: 'What documents do I need?'
      });
    });
  });
});