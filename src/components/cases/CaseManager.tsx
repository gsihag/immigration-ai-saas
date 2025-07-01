
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, Clock, User, MessageSquare } from 'lucide-react';

interface Case {
  id: string;
  case_number: string;
  title: string;
  case_type: string;
  status: string;
  priority: number;
  created_at: string;
  updated_at: string;
  due_date?: string;
  client?: {
    id: string;
    user?: {
      first_name: string;
      last_name: string;
    };
  };
  assigned_to?: {
    first_name: string;
    last_name: string;
  };
}

interface CaseActivity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

interface CaseNote {
  id: string;
  content: string;
  is_private: boolean;
  created_at: string;
  author?: {
    first_name: string;
    last_name: string;
  };
}

export const CaseManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [activities, setActivities] = useState<CaseActivity[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [notePrivate, setNotePrivate] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (selectedCase) {
      fetchCaseDetails(selectedCase.id);
    }
  }, [selectedCase]);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          clients:client_id (
            id,
            users:user_id (first_name, last_name)
          ),
          assigned_user:assigned_to (first_name, last_name)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast({
        title: "Error",
        description: "Failed to load cases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseDetails = async (caseId: string) => {
    try {
      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('case_activities')
        .select(`
          *,
          users:user_id (first_name, last_name)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('case_notes')
        .select(`
          *,
          author:author_id (first_name, last_name)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);
    } catch (error) {
      console.error('Error fetching case details:', error);
    }
  };

  const addNote = async () => {
    if (!selectedCase || !newNote.trim()) return;

    try {
      const { error } = await supabase
        .from('case_notes')
        .insert({
          case_id: selectedCase.id,
          author_id: user?.id,
          content: newNote.trim(),
          is_private: notePrivate
        });

      if (error) throw error;

      // Create activity for note addition
      await supabase.rpc('create_case_activity', {
        p_case_id: selectedCase.id,
        p_activity_type: 'note_added',
        p_description: `Added a ${notePrivate ? 'private' : 'public'} note`
      });

      setNewNote('');
      setNotePrivate(false);
      fetchCaseDetails(selectedCase.id);
      
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Case Management</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Case
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Cases</CardTitle>
              <CardDescription>
                {cases.length} total cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {cases.map((case_) => (
                <div
                  key={case_.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCase?.id === case_.id 
                      ? 'bg-primary/10 border-primary' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCase(case_)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm">{case_.case_number}</span>
                    <Badge className={getStatusColor(case_.status)}>
                      {case_.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{case_.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{case_.case_type}</span>
                    <Badge className={getPriorityColor(case_.priority)}>
                      P{case_.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Case Details */}
        <div className="lg:col-span-2">
          {selectedCase ? (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {selectedCase.case_number}
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(selectedCase.status)}>
                          {selectedCase.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(selectedCase.priority)}>
                          Priority {selectedCase.priority}
                        </Badge>
                      </div>
                    </CardTitle>
                    <CardDescription>{selectedCase.title}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Case Type</label>
                        <p className="mt-1">{selectedCase.case_type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Client</label>
                        <p className="mt-1">
                          {selectedCase.client?.user?.first_name} {selectedCase.client?.user?.last_name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created</label>
                        <p className="mt-1">
                          {new Date(selectedCase.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Updated</label>
                        <p className="mt-1">
                          {new Date(selectedCase.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline">
                <Card>
                  <CardHeader>
                    <CardTitle>Case Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                          <Clock className="h-4 w-4 mt-1 text-gray-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <User className="h-3 w-3" />
                              <span>
                                {activity.user?.first_name} {activity.user?.last_name}
                              </span>
                              <span>•</span>
                              <span>{new Date(activity.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes">
                <Card>
                  <CardHeader>
                    <CardTitle>Case Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add Note Form */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                      <Textarea
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={notePrivate}
                            onChange={(e) => setNotePrivate(e.target.checked)}
                          />
                          Private note (only visible to agency staff)
                        </label>
                        <Button onClick={addNote} disabled={!newNote.trim()}>
                          Add Note
                        </Button>
                      </div>
                    </div>

                    {/* Notes List */}
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {notes.map((note) => (
                        <div key={note.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">
                                {note.author?.first_name} {note.author?.last_name}
                              </span>
                              {note.is_private && (
                                <Badge variant="outline" className="text-xs">
                                  Private
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(note.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Select a case to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
