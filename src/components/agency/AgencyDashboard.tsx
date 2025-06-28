import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { AgencyProfile } from './AgencyProfile';
import { UserManagement } from './UserManagement';
import { ClientManagement } from './ClientManagement';
import { DocumentManagement } from './DocumentManagement';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Building, Users, UserCheck, MessageCircle, FileText } from 'lucide-react';

export const AgencyDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user?.agency_id) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">You are not associated with any agency.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agency Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your agency profile, users, clients, documents, and support conversations
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Agency Profile
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2"
              disabled={user?.role !== 'agency_admin'}
            >
              <UserCheck className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger 
              value="clients" 
              className="flex items-center gap-2"
              disabled={!['agency_admin', 'agency_staff'].includes(user?.role || '')}
            >
              <Users className="h-4 w-4" />
              Client Management
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="flex items-center gap-2"
              disabled={!['agency_admin', 'agency_staff'].includes(user?.role || '')}
            >
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="flex items-center gap-2"
              disabled={!['agency_admin', 'agency_staff'].includes(user?.role || '')}
            >
              <MessageCircle className="h-4 w-4" />
              Chat Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <AgencyProfile />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="clients">
            <ClientManagement />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManagement />
          </TabsContent>

          <TabsContent value="chat">
            <ChatPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Widget for Agency Staff */}
      {['agency_admin', 'agency_staff'].includes(user?.role || '') && (
        <ChatContainer />
      )}
    </>
  );
};