
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, Bot, User, Minimize2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_type: 'client' | 'agency_staff' | 'agency_admin' | 'ai_bot';
  message_text: string;
  message_type: 'text' | 'file' | 'system';
  is_ai_response: boolean;
  created_at: string;
}

interface GeminiChatWidgetProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  className?: string;
}

export const GeminiChatWidget: React.FC<GeminiChatWidgetProps> = ({
  isMinimized = false,
  onToggleMinimize,
  className = ''
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      initializeChat();
    }
  }, [user?.id]);

  useEffect(() => {
    if (conversationId) {
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Get or create conversation for the current user
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        client_user_id: user?.id
      });

      if (error) throw error;

      setConversationId(data);
      await loadMessages(data);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast({
        title: "Error",
        description: "Failed to initialize chat.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`gemini-chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || sending) return;

    setSending(true);
    try {
      // Send user message
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user?.id,
          sender_type: user?.role === 'client' ? 'client' : 
                      user?.role === 'agency_admin' ? 'agency_admin' : 'agency_staff',
          message_text: newMessage,
          message_type: 'text',
          is_ai_response: false
        });

      if (messageError) throw messageError;

      const currentMessage = newMessage;
      setNewMessage('');

      // Call Gemini AI for response
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('gemini-chat', {
        body: {
          message: currentMessage,
          conversation_id: conversationId,
          user_id: user?.id
        }
      });

      if (aiError) {
        console.error('AI response error:', aiError);
        toast({
          title: "AI Response Error",
          description: "The AI assistant is temporarily unavailable. Please try again.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'ai_bot':
        return <Bot className="h-4 w-4" />;
      case 'client':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getSenderName = (message: ChatMessage) => {
    if (message.is_ai_response) return 'Gemini Assistant';
    if (message.sender_type === 'client') return 'You';
    return 'Support Agent';
  };

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={onToggleMinimize}
          className="rounded-full h-12 w-12 shadow-lg bg-blue-600 hover:bg-blue-700"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={`w-80 h-96 flex flex-col ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4 text-blue-600" />
            Gemini Immigration Assistant
          </CardTitle>
          {onToggleMinimize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMinimize}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-muted-foreground">Loading chat...</div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground">
                  <Bot className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p>Welcome! I'm your Gemini-powered Australian immigration assistant.</p>
                  <p className="text-xs mt-1">Ask me about visa types, requirements, or the application process.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      message.sender_type === 'client' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.sender_type !== 'client' && (
                      <div className="flex-shrink-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          message.is_ai_response 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getSenderIcon(message.sender_type)}
                        </div>
                      </div>
                    )}
                    
                    <div className={`max-w-[70%] ${
                      message.sender_type === 'client' ? 'order-1' : ''
                    }`}>
                      <div className={`rounded-lg px-3 py-2 text-sm ${
                        message.sender_type === 'client'
                          ? 'bg-blue-500 text-white'
                          : message.is_ai_response
                          ? 'bg-blue-50 text-blue-900 border border-blue-200'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        {message.message_text}
                      </div>
                      
                      <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
                        message.sender_type === 'client' ? 'justify-end' : 'justify-start'
                      }`}>
                        <span>{getSenderName(message)}</span>
                        <span>•</span>
                        <span>{formatMessageTime(message.created_at)}</span>
                        {message.is_ai_response && (
                          <Badge variant="secondary" className="text-xs ml-1">
                            Gemini
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about Australian visas..."
              disabled={sending || loading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending || loading}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Bot className="h-3 w-3" />
            Powered by Google Gemini AI for Australian immigration queries
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
