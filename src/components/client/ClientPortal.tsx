import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ClientProfile } from './ClientProfile';
import { ClientDataEntry } from './ClientDataEntry';
import { ClientDocuments } from './ClientDocuments';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { User, FileText, Upload } from 'lucide-react';

export const ClientPortal: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== 'client') {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Access denied. This portal is for clients only.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Portal</h1>
          <p className="text-muted-foreground">
            Manage your profile and immigration information
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              My Profile
            </TabsTrigger>
            <TabsTrigger value="data-entry" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Immigration Info
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ClientProfile />
          </TabsContent>

          <TabsContent value="data-entry">
            <ClientDataEntry />
          </TabsContent>

          <TabsContent value="documents">
            <ClientDocuments />
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Widget */}
      <ChatContainer />
    </>
  );
};