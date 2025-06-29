
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, FileText, User, Calendar, Phone, Mail, MapPin } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  caseType: string;
  status: string;
  assignedStaff: string;
  lastInteraction: string;
  phone: string;
  joinDate: string;
}

interface ClientDetailsPanelProps {
  client: Client;
}

export const ClientDetailsPanel: React.FC<ClientDetailsPanelProps> = ({ client }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock interaction data
  const recentInteractions = [
    {
      id: '1',
      type: 'message',
      description: 'Client inquired about visa processing timeline',
      timestamp: '2 hours ago',
      staff: 'Sarah Johnson'
    },
    {
      id: '2',
      type: 'document',
      description: 'Uploaded passport copy for verification',
      timestamp: '1 day ago'
    },
    {
      id: '3',
      type: 'status_change',
      description: 'Case status updated to "Documents Under Review"',
      timestamp: '3 days ago',
      staff: 'Mike Davis'
    }
  ];

  const documents = [
    { id: '1', name: 'Passport Copy', type: 'PDF', status: 'Verified', uploadDate: '3 days ago' },
    { id: '2', name: 'Birth Certificate', type: 'PDF', status: 'Pending', uploadDate: '2 days ago' },
    { id: '3', name: 'Bank Statement', type: 'PDF', status: 'Verified', uploadDate: '1 week ago' }
  ];

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'status_change':
        return <User className="h-4 w-4 text-orange-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{client.name}</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {client.email}
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {client.phone}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{client.caseType}</Badge>
            <Badge>{client.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            View Case
          </Button>
        </div>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Case Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Case Type</label>
                  <p className="text-sm">{client.caseType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                  <p className="text-sm">{client.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Assigned Staff</label>
                  <p className="text-sm">{client.assignedStaff}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Join Date</label>
                  <p className="text-sm">{client.joinDate}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{client.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-sm">{client.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-sm">123 Main Street, Toronto, ON M5V 3A8</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                  <p className="text-sm">Jane Rodriguez - (555) 987-6543</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInteractions.map((interaction) => (
                  <div key={interaction.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getInteractionIcon(interaction.type)}
                    <div className="flex-1">
                      <p className="text-sm">{interaction.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{interaction.timestamp}</span>
                        {interaction.staff && <span>• by {interaction.staff}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.type} • Uploaded {doc.uploadDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.status === 'Verified' ? 'default' : 'secondary'}>
                        {doc.status}
                      </Badge>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Case Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Application Submitted</p>
                    <p className="text-xs text-muted-foreground">3 weeks ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Documents Under Review</p>
                    <p className="text-xs text-muted-foreground">Current status</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Interview Scheduled</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
