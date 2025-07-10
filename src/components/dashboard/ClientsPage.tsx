import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Filter, 
  Users, 
  Mail, 
  Phone,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const clientsData = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567',
    caseType: 'Family Based',
    status: 'Active',
    nationality: 'Canadian',
    agency: 'Immigration Partners LLC'
  },
  {
    id: 2,
    name: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    phone: '+1 (555) 234-5678',
    caseType: 'Employment Based',
    status: 'In Review',
    nationality: 'Mexican',
    agency: 'Global Immigration Services'
  },
  {
    id: 3,
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@email.com',
    phone: '+1 (555) 345-6789',
    caseType: 'Asylum',
    status: 'Pending',
    nationality: 'Syrian',
    agency: 'Immigration Partners LLC'
  },
  {
    id: 4,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 456-7890',
    caseType: 'Naturalization',
    status: 'Approved',
    nationality: 'British',
    agency: 'Legal Immigration Group'
  }
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'Active': return 'default';
    case 'In Review': return 'secondary';
    case 'Pending': return 'outline';
    case 'Approved': return 'destructive';
    default: return 'default';
  }
};

export const ClientsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clientsData.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.caseType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">Manage your immigration clients</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button variant="default" className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          Find Client
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          All Clients
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input 
                placeholder="Enter client name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Case Type</label>
              <Input placeholder="Select case type" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Input placeholder="Select status" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline">Clear</Button>
            <Button>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Found: {filteredClients.length} clients</CardTitle>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Export to Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Case Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Agency</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{client.caseType}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(client.status)}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{client.nationality}</TableCell>
                  <TableCell>{client.agency}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit Client</DropdownMenuItem>
                        <DropdownMenuItem>View Cases</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};