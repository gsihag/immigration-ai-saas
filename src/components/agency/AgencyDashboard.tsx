
import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { CRMDashboard } from './CRMDashboard';
import { ChatContainer } from '@/components/chat/ChatContainer';

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
      <CRMDashboard />
      
      {/* Chat Widget for Agency Staff */}
      {['agency_admin', 'agency_staff'].includes(user?.role || '') && (
        <ChatContainer />
      )}
    </>
  );
};
