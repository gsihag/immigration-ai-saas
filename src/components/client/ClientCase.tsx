
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, User, Calendar, MessageSquare, ArrowRight, Clock } from 'lucide-react';

export const ClientCase: React.FC = () => {
  // Mock case data - in real app would come from API
  const caseDetails = {
    id: 'CASE-2024-001',
    type: 'Family-Based Green Card (I-485)',
    status: 'Document Review',
    priority: 'Normal',
    submittedDate: '2024-05-15',
    lastUpdate: '2024-06-25',
    estimatedCompletion: '2024-08-15',
    assignedAgent: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@lawfirm.com',
      phone: '(555) 123-4567'
    },
    description: 'Application to adjust status to permanent resident based on marriage to U.S. citizen.',
    currentStage: 'Document Review and Verification',
    nextSteps: [
      'Submit medical examination results (Form I-693)',
      'Provide additional financial documentation',
      'Schedule biometrics appointment'
    ]
  };

  const timeline = [
    {
      id: '1',
      date: '2024-06-25',
      title: 'Document Review Started',
      description: 'Your documents are being reviewed by our team.',
      status: 'current'
    },
    {
      id: '2',
      date: '2024-06-20',
      title: 'Initial Documents Received',
      description: 'All initial required documents have been received and logged.',
      status: 'completed'
    },
    {
      id: '3',
      date: '2024-06-01',
      title: 'Case Assignment',
      description: 'Your case has been assigned to Sarah Johnson.',
      status: 'completed'
    },
    {
      id: '4',
      date: '2024-05-15',
      title: 'Case Created',
      description: 'Your immigration case has been officially opened.',
      status: 'completed'
    }
  ];

  const recentMessages = [
    {
      id: '1',
      from: 'Sarah Johnson',
      message: 'Please upload your medical examination results when available.',
      date: '2024-06-25',
      type: 'staff'
    },
    {
      id: '2',
      from: 'You',
      message: 'When should I expect the biometrics appointment notice?',
      date: '2024-06-22',
      type: 'client'
    },
    {
      id: '3',
      from: 'Sarah Johnson',
      message: 'Your initial document review is progressing well. We may need additional financial documents.',
      date: '2024-06-20',
      type: 'staff'
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
      {/* Case Details Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{caseDetails.type}</CardTitle>
              <CardDescription className="text-base mt-2">
                Case ID: {caseDetails.id}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(caseDetails.status)}>
              {caseDetails.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Stage</h4>
              <p className="font-semibold">{caseDetails.currentStage}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Submitted Date</h4>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(caseDetails.submittedDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Estimated Completion</h4>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {new Date(caseDetails.estimatedCompletion).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Next Steps
            </CardTitle>
            <CardDescription>
              Actions required to move your case forward
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {caseDetails.nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <p className="text-sm">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assigned Agent */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assigned Agent
            </CardTitle>
            <CardDescription>
              Your dedicated immigration specialist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg">{caseDetails.assignedAgent.name}</h4>
                <p className="text-sm text-muted-foreground">Immigration Specialist</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {caseDetails.assignedAgent.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Phone:</span> {caseDetails.assignedAgent.phone}
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Case Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Case Timeline</CardTitle>
          <CardDescription>
            Track the progress of your immigration case
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {timeline.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    event.status === 'current' 
                      ? 'bg-blue-500 border-blue-500' 
                      : event.status === 'completed'
                      ? 'bg-green-500 border-green-500'
                      : 'bg-gray-200 border-gray-300'
                  }`} />
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{event.title}</h4>
                    <span className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Communications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Communications</CardTitle>
          <CardDescription>
            Latest messages and updates from your case team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentMessages.map((message) => (
              <div key={message.id} className={`p-4 rounded-lg border ${
                message.type === 'client' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{message.from}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{message.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
