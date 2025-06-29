
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, FileText, User, Clock, Search, Filter } from 'lucide-react';

interface Interaction {
  id: string;
  type: 'message' | 'document' | 'status_change' | 'assignment';
  clientName: string;
  staffName?: string;
  description: string;
  timestamp: string;
  status?: 'pending' | 'completed' | 'in_progress';
}

export const RecentInteractions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Mock data - in real app would come from API
  const interactions: Interaction[] = [
    {
      id: '1',
      type: 'message',
      clientName: 'Maria Rodriguez',
      staffName: 'Sarah Johnson',
      description: 'Client inquired about visa processing timeline',
      timestamp: '2 hours ago',
      status: 'completed'
    },
    {
      id: '2',
      type: 'document',
      clientName: 'John Smith',
      description: 'Uploaded passport copy for verification',
      timestamp: '4 hours ago',
      status: 'pending'
    },
    {
      id: '3',
      type: 'status_change',
      clientName: 'Lisa Chen',
      staffName: 'Mike Davis',
      description: 'Case status updated to "Documents Under Review"',
      timestamp: '6 hours ago',
      status: 'completed'
    },
    {
      id: '4',
      type: 'assignment',
      clientName: 'Ahmed Hassan',
      staffName: 'Sarah Johnson',
      description: 'Case assigned to Sarah Johnson for review',
      timestamp: '1 day ago',
      status: 'in_progress'
    },
    {
      id: '5',
      type: 'message',
      clientName: 'Emily Davis',
      description: 'Client submitted additional supporting documents',
      timestamp: '1 day ago',
      status: 'completed'
    }
  ];

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'status_change':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'assignment':
        return <User className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const variants = {
      pending: 'secondary',
      completed: 'default',
      in_progress: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const filteredInteractions = interactions.filter(interaction => {
    const matchesSearch = interaction.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || interaction.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Interactions</CardTitle>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        
        {/* Search and Filter */}
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search interactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="message">Messages</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="status_change">Status Changes</SelectItem>
              <SelectItem value="assignment">Assignments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredInteractions.map((interaction) => (
            <div
              key={interaction.id}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="mt-1">
                {getInteractionIcon(interaction.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{interaction.clientName}</h4>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(interaction.status)}
                    <span className="text-xs text-muted-foreground">{interaction.timestamp}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{interaction.description}</p>
                {interaction.staffName && (
                  <p className="text-xs text-muted-foreground">by {interaction.staffName}</p>
                )}
              </div>
            </div>
          ))}
          
          {filteredInteractions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No interactions found matching your criteria.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
