import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChatWidget } from './ChatWidget';
import { MessageCircle, Users, Clock, CheckCircle } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  status: 'active' | 'closed' | 'archived';
  created_at: string;
  updated_at: string;
  client?: {
    user?: {
      first_name: string | null;
      last_name: string | null;
    };
  };
  message_count?: number;
  last_message?: string;
}

export const ChatPanel: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.agency_id && ['agency_admin', 'agency_staff'].includes(user?.role || '')) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          client:clients(
            user:users(first_name, last_name)
          )
        `)
        .eq('agency_id', user?.agency_id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get message counts and last messages for each conversation
      const conversationsWithCounts = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: messages, error: msgError } = await supabase
            .from('chat_messages')
            .select('message_text, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (msgError) {
            console.error('Error fetching message count:', msgError);
            return { ...conv, message_count: 0, last_message: '' };
          }

          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          return {
            ...conv,
            message_count: count || 0,
            last_message: messages?.[0]?.message_text || 'No messages yet'
          };
        })
      );

      setConversations(conversationsWithCounts);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConversationStatus = async (conversationId: string, status: 'active' | 'closed' | 'archived') => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Conversation ${status} successfully.`
      });

      fetchConversations();
    } catch (error) {
      console.error('Error updating conversation status:', error);
      toast({
        title: "Error",
        description: "Failed to update conversation status.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openChatDialog = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setIsDialogOpen(true);
  };

  if (!['agency_admin', 'agency_staff'].includes(user?.role || '')) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Access denied. This panel is for agency staff only.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Chat Management</h2>
        <p className="text-muted-foreground">Manage client conversations and support requests</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ongoing client conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.reduce((sum, c) => sum + (c.message_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Messages exchanged today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">
              Average response rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Client Conversations
          </CardTitle>
          <CardDescription>
            View and manage all client conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-sm text-muted-foreground">Loading conversations...</div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-8">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No conversations found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Last Message</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conversation) => (
                  <TableRow key={conversation.id}>
                    <TableCell>
                      <div className="font-medium">
                        {conversation.client?.user?.first_name} {conversation.client?.user?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {conversation.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm">
                        {conversation.last_message}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {conversation.message_count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(conversation.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(conversation.updated_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openChatDialog(conversation.id)}
                        >
                          View Chat
                        </Button>
                        {conversation.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateConversationStatus(conversation.id, 'closed')}
                          >
                            Close
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Chat Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] h-[600px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Client Conversation</DialogTitle>
            <DialogDescription>
              Chat with your client in real-time
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 p-6 pt-0">
            {selectedConversation && (
              <ChatWidget className="w-full h-full border-0 shadow-none" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};