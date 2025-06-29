
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, MessageSquare, Eye, UserPlus, Filter, MoreHorizontal } from 'lucide-react';
import { ClientDetailsPanel } from './ClientDetailsPanel';

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

export const ClientsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Mock data - in real app would come from API
  const clients: Client[] = [
    {
      id: '1',
      name: 'Maria Rodriguez',
      email: 'maria.rodriguez@email.com',
      caseType: 'Family Visa',
      status: 'Documents Under Review',
      assignedStaff: 'Sarah Johnson',
      lastInteraction: '2 hours ago',
      phone: '+1 (555) 123-4567',
      joinDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'John Smith',
      email: 'john.smith@email.com',
      caseType: 'Work Permit',
      status: 'Application Submitted',
      assignedStaff: 'Mike Davis',
      lastInteraction: '4 hours ago',
      phone: '+1 (555) 234-5678',
      joinDate: '2024-02-03'
    },
    {
      id: '3',
      name: 'Lisa Chen',
      email: 'lisa.chen@email.com',
      caseType: 'Student Visa',
      status: 'Interview Scheduled',
      assignedStaff: 'Sarah Johnson',
      lastInteraction: '6 hours ago',
      phone: '+1 (555) 345-6789',
      joinDate: '2024-01-28'
    },
    {
      id: '4',
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@email.com',
      caseType: 'Permanent Residence',
      status: 'Initial Consultation',
      assignedStaff: 'Mike Davis',
      lastInteraction: '1 day ago',
      phone: '+1 (555) 456-7890',
      joinDate: '2024-02-10'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Documents Under Review': 'secondary',
      'Application Submitted': 'default',
      'Interview Scheduled': 'outline',
      'Initial Consultation': 'destructive'
    } as const;

    return (
      <Badge variant={statusColors[status as keyof typeof statusColors] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.caseType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Case Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Staff</TableHead>
                <TableHead>Last Interaction</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">{client.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{client.caseType}</TableCell>
                  <TableCell>{getStatusBadge(client.status)}</TableCell>
                  <TableCell>{client.assignedStaff}</TableCell>
                  <TableCell>{client.lastInteraction}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewClient(client)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No clients found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <ClientDetailsPanel client={selectedClient} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
