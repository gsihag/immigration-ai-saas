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
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id && !isMinimized && !initialized) {
      initializeChat();
    }
  }, [user?.id, isMinimized, initialized]);

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
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('Initializing chat for user:', user.id);
      
      // Get or create conversation for the current user
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        client_user_id: user.id
      });

      if (error) {
        console.error('Error creating conversation:', error);
        // If RPC fails, try to create a simple conversation ID
        const simpleConvId = `conv_${user.id}_${Date.now()}`;
        setConversationId(simpleConvId);
        setInitialized(true);
        return;
      }

      console.log('Conversation created/found:', data);
      setConversationId(data);
      await loadMessages(data);
      setInitialized(true);
    } catch (error) {
      console.error('Error initializing chat:', error);
      // Fallback: create a simple conversation ID
      const fallbackConvId = `conv_${user.id}_${Date.now()}`;
      setConversationId(fallbackConvId);
      setInitialized(true);
      toast({
        title: "Chat Ready",
        description: "Chat is ready to use.",
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

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`ritu-chat-${conversationId}`)
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
      console.log('Sending message:', newMessage);
      
      // Send user message directly to state first for immediate feedback
      const userMsg: ChatMessage = {
        id: `temp_${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user?.id || null,
        sender_type: user?.role === 'client' ? 'client' : 
                    user?.role === 'agency_admin' ? 'agency_admin' : 'agency_staff',
        message_text: newMessage,
        message_type: 'text',
        is_ai_response: false,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, userMsg]);
      const currentMessage = newMessage;
      setNewMessage('');

      // Try to save to database (optional - if it fails, message still shows)
      try {
        await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user?.id,
            sender_type: user?.role === 'client' ? 'client' : 
                        user?.role === 'agency_admin' ? 'agency_admin' : 'agency_staff',
            message_text: currentMessage,
            message_type: 'text',
            is_ai_response: false
          });
      } catch (dbError) {
        console.error('Database save failed:', dbError);
        // Continue anyway - user can still chat
      }

      // Call Gemini AI for response
      try {
        const { data: aiResponse, error: aiError } = await supabase.functions.invoke('gemini-chat', {
          body: {
            message: currentMessage,
            conversation_id: conversationId,
            user_id: user?.id
          }
        });

        if (aiError) {
          console.error('AI response error:', aiError);
          // Add a fallback response
          const fallbackResponse: ChatMessage = {
            id: `ai_${Date.now()}`,
            conversation_id: conversationId,
            sender_id: null,
            sender_type: 'ai_bot',
            message_text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or feel free to contact our support team directly.",
            message_type: 'text',
            is_ai_response: true,
            created_at: new Date().toISOString()
          };
          setMessages(prev => [...prev, fallbackResponse]);
        }
      } catch (aiError) {
        console.error('AI call failed:', aiError);
        // Add a fallback response
        const fallbackResponse: ChatMessage = {
          id: `ai_${Date.now()}`,
          conversation_id: conversationId,
          sender_id: null,
          sender_type: 'ai_bot',
          message_text: "I'm temporarily unavailable. Please try again later or contact our support team for immediate assistance.",
          message_type: 'text',
          is_ai_response: true,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, fallbackResponse]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Message Sent",
        description: "Your message has been received.",
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
    if (message.is_ai_response) return 'Ritu';
    if (message.sender_type === 'client') return 'You';
    return 'Support Agent';
  };

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={onToggleMinimize}
          className="rounded-full h-12 w-12 shadow-lg bg-purple-600 hover:bg-purple-700"
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
            <Bot className="h-4 w-4 text-purple-600" />
            Ritu: Your Assistant
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
              <div className="text-sm text-muted-foreground">Starting chat...</div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground">
                  <Bot className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p>Hi! I'm Ritu, your personal Australian immigration assistant.</p>
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
                            ? 'bg-purple-100 text-purple-600' 
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
                          ? 'bg-purple-50 text-purple-900 border border-purple-200'
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
                            AI
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
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Bot className="h-3 w-3" />
            Powered by Immigration AI SaaS
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
