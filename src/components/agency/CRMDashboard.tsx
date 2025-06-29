
import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { HomeTab } from './crm/HomeTab';
import { ClientsTab } from './crm/ClientsTab';
import { StaffTab } from './crm/StaffTab';
import { TasksTab } from './crm/TasksTab';
import { Home, Users, UserCheck, ClipboardList } from 'lucide-react';

export const CRMDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agency CRM Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your clients, staff, and tasks in one centralized view
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="home" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Home
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="home">
          <HomeTab />
        </TabsContent>

        <TabsContent value="clients">
          <ClientsTab />
        </TabsContent>

        <TabsContent value="staff">
          <StaffTab />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
