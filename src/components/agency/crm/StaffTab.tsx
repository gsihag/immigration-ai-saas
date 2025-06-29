
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, MessageSquare, UserPlus, ClipboardList, MoreHorizontal, User } from 'lucide-react';
import { AssignTaskDialog } from './AssignTaskDialog';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  assignedClients: number;
  pendingTasks: number;
  completedTasks: number;
  joinDate: string;
  phone: string;
}

export const StaffTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);

  // Mock data - in real app would come from API
  const staffMembers: StaffMember[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@agency.com',
      role: 'Senior Immigration Consultant',
      status: 'active',
      assignedClients: 12,
      pendingTasks: 5,
      completedTasks: 28,
      joinDate: '2023-01-15',
      phone: '+1 (555) 111-2222'
    },
    {
      id: '2',
      name: 'Mike Davis',
      email: 'mike.davis@agency.com',
      role: 'Immigration Consultant',
      status: 'active',
      assignedClients: 8,
      pendingTasks: 3,
      completedTasks: 15,
      joinDate: '2023-06-01',
      phone: '+1 (555) 333-4444'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@agency.com',
      role: 'Document Specialist',
      status: 'active',
      assignedClients: 0,
      pendingTasks: 8,
      completedTasks: 42,
      joinDate: '2022-11-10',
      phone: '+1 (555) 555-6666'
    },
    {
      id: '4',
      name: 'David Chen',
      email: 'david.chen@agency.com',
      role: 'Junior Consultant',
      status: 'active',
      assignedClients: 4,
      pendingTasks: 2,
      completedTasks: 8,
      joinDate: '2024-01-03',
      phone: '+1 (555) 777-8888'
    }
  ];

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredStaff = staffMembers.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignTask = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsAssignTaskOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Staff Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              {staffMembers.filter(s => s.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffMembers.reduce((sum, staff) => sum + staff.assignedClients, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Assigned to staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffMembers.reduce((sum, staff) => sum + staff.pendingTasks, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffMembers.reduce((sum, staff) => sum + staff.completedTasks, 0)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({filteredStaff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clients</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((staff) => (
                <TableRow key={staff.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{staff.name}</div>
                      <div className="text-sm text-muted-foreground">{staff.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{staff.role}</TableCell>
                  <TableCell>{getStatusBadge(staff.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{staff.assignedClients} assigned</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div>{staff.pendingTasks} pending</div>
                      <div className="text-muted-foreground">{staff.completedTasks} completed</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAssignTask(staff)}
                      >
                        <ClipboardList className="h-4 w-4" />
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

          {filteredStaff.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No staff members found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Task Dialog */}
      <AssignTaskDialog
        isOpen={isAssignTaskOpen}
        onOpenChange={setIsAssignTaskOpen}
        staff={selectedStaff}
      />
    </div>
  );
};
