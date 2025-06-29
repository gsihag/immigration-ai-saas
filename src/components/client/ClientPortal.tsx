
import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ClientDashboardHome } from './ClientDashboardHome';
import { ClientCase } from './ClientCase';
import { ClientDocuments } from './ClientDocuments';
import { ClientEligibilityCheck } from './ClientEligibilityCheck';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Home, FileText, Upload, CheckCircle } from 'lucide-react';

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
          <h1 className="text-3xl font-bold tracking-tight">Client Dashboard</h1>
          <p className="text-muted-foreground">
            Track your immigration case progress and manage your documents
          </p>
        </div>

        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="case" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Case
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="eligibility" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Eligibility Check
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <ClientDashboardHome />
          </TabsContent>

          <TabsContent value="case">
            <ClientCase />
          </TabsContent>

          <TabsContent value="documents">
            <ClientDocuments />
          </TabsContent>

          <TabsContent value="eligibility">
            <ClientEligibilityCheck />
          </TabsContent>
        </Tabs>
      </div>

      {/* Always-visible Chat Widget */}
      <ChatContainer />
    </>
  );
};
