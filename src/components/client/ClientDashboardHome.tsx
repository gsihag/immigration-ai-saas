
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, CheckCircle, MessageSquare, Calendar, Clock, ArrowRight } from 'lucide-react';

export const ClientDashboardHome: React.FC = () => {
  // Mock data - in real app would come from API
  const caseData = {
    type: 'Family-Based Green Card',
    status: 'Document Review',
    lastUpdate: '2024-06-25',
    nextSteps: 'Submit medical examination results',
    assignedAgent: 'Sarah Johnson',
    estimatedCompletion: '2024-08-15'
  };

  const recentActivity = [
    {
      id: '1',
      type: 'document_uploaded',
      title: 'Birth Certificate uploaded',
      date: '2024-06-25',
      status: 'pending'
    },
    {
      id: '2',
      type: 'status_update',
      title: 'Case moved to Document Review',
      date: '2024-06-20',
      status: 'completed'
    },
    {
      id: '3',
      type: 'message',
      title: 'Message from Sarah Johnson',
      date: '2024-06-18',
      status: 'read'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Document Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Case Summary Widget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Case Summary</span>
            <Badge className={getStatusColor(caseData.status)}>
              {caseData.status}
            </Badge>
          </CardTitle>
          <CardDescription>
            Your current immigration case overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Case Type</h4>
                <p className="text-lg font-semibold">{caseData.type}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Last Update</h4>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(caseData.lastUpdate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Assigned Agent</h4>
                <p>{caseData.assignedAgent}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Next Steps</h4>
                <p className="text-sm">{caseData.nextSteps}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Estimated Completion</h4>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {new Date(caseData.estimatedCompletion).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks you can perform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Upload className="h-6 w-6" />
              <span>Upload Documents</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <CheckCircle className="h-6 w-6" />
              <span>Check Eligibility</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <MessageSquare className="h-6 w-6" />
              <span>Contact Support</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates on your case
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {activity.type === 'document_uploaded' && <Upload className="h-5 w-5 text-blue-600" />}
                  {activity.type === 'status_update' && <ArrowRight className="h-5 w-5 text-green-600" />}
                  {activity.type === 'message' && <MessageSquare className="h-5 w-5 text-purple-600" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{activity.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
