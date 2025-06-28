import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, GraduationCap, Briefcase, Plane, Plus, Trash2 } from 'lucide-react';

interface EducationEntry {
  id?: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  country: string;
}

interface WorkEntry {
  id?: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  country: string;
  description: string;
}

interface TravelEntry {
  id?: string;
  country: string;
  purpose: string;
  start_date: string;
  end_date: string;
  notes: string;
}

interface ClientExtendedData {
  id?: string;
  education_history: EducationEntry[];
  work_history: WorkEntry[];
  travel_history: TravelEntry[];
  languages: string[];
  family_members: any[];
  additional_notes: string;
}

export const ClientDataEntry: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ClientExtendedData>({
    education_history: [],
    work_history: [],
    travel_history: [],
    languages: [],
    family_members: [],
    additional_notes: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchExtendedData();
    }
  }, [user?.id]);

  const fetchExtendedData = async () => {
    try {
      // For now, we'll store this data in the client's notes or create a separate table
      // Since we can't modify the migration, we'll use a JSON field approach
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (clientData) {
        // Parse extended data from a JSON field or initialize empty
        const extendedData = clientData.extended_data || {
          education_history: [],
          work_history: [],
          travel_history: [],
          languages: [],
          family_members: [],
          additional_notes: ''
        };
        setData(extendedData);
      }
    } catch (error) {
      console.error('Error fetching extended data:', error);
      toast({
        title: "Error",
        description: "Failed to load immigration data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveExtendedData = async () => {
    setSaving(true);
    try {
      // First, ensure client record exists
      const { data: existingClient, error: fetchError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!existingClient) {
        // Create client record if it doesn't exist
        const { error: createError } = await supabase
          .from('clients')
          .insert({
            user_id: user?.id,
            agency_id: user?.agency_id,
            extended_data: data
          });

        if (createError) throw createError;
      } else {
        // Update existing client record with extended data
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            extended_data: data,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Success",
        description: "Immigration information saved successfully."
      });
    } catch (error) {
      console.error('Error saving extended data:', error);
      toast({
        title: "Error",
        description: "Failed to save immigration information.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addEducationEntry = () => {
    setData({
      ...data,
      education_history: [
        ...data.education_history,
        {
          institution: '',
          degree: '',
          field_of_study: '',
          start_date: '',
          end_date: '',
          country: ''
        }
      ]
    });
  };

  const removeEducationEntry = (index: number) => {
    setData({
      ...data,
      education_history: data.education_history.filter((_, i) => i !== index)
    });
  };

  const updateEducationEntry = (index: number, field: keyof EducationEntry, value: string) => {
    const updated = [...data.education_history];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, education_history: updated });
  };

  const addWorkEntry = () => {
    setData({
      ...data,
      work_history: [
        ...data.work_history,
        {
          company: '',
          position: '',
          start_date: '',
          end_date: '',
          country: '',
          description: ''
        }
      ]
    });
  };

  const removeWorkEntry = (index: number) => {
    setData({
      ...data,
      work_history: data.work_history.filter((_, i) => i !== index)
    });
  };

  const updateWorkEntry = (index: number, field: keyof WorkEntry, value: string) => {
    const updated = [...data.work_history];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, work_history: updated });
  };

  const addTravelEntry = () => {
    setData({
      ...data,
      travel_history: [
        ...data.travel_history,
        {
          country: '',
          purpose: '',
          start_date: '',
          end_date: '',
          notes: ''
        }
      ]
    });
  };

  const removeTravelEntry = (index: number) => {
    setData({
      ...data,
      travel_history: data.travel_history.filter((_, i) => i !== index)
    });
  };

  const updateTravelEntry = (index: number, field: keyof TravelEntry, value: string) => {
    const updated = [...data.travel_history];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, travel_history: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Immigration Information</h2>
          <p className="text-muted-foreground">Provide detailed information for your immigration case</p>
        </div>
        <Button onClick={saveExtendedData} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save All Information
        </Button>
      </div>

      {/* Education History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education History
          </CardTitle>
          <CardDescription>
            Add your educational background and qualifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.education_history.map((entry, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Education Entry {index + 1}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeEducationEntry(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Institution Name</Label>
                  <Input
                    value={entry.institution}
                    onChange={(e) => updateEducationEntry(index, 'institution', e.target.value)}
                    placeholder="University/School name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Degree/Qualification</Label>
                  <Input
                    value={entry.degree}
                    onChange={(e) => updateEducationEntry(index, 'degree', e.target.value)}
                    placeholder="Bachelor's, Master's, etc."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Field of Study</Label>
                  <Input
                    value={entry.field_of_study}
                    onChange={(e) => updateEducationEntry(index, 'field_of_study', e.target.value)}
                    placeholder="Computer Science, Engineering, etc."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={entry.country}
                    onChange={(e) => updateEducationEntry(index, 'country', e.target.value)}
                    placeholder="Country where you studied"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={entry.start_date}
                    onChange={(e) => updateEducationEntry(index, 'start_date', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={entry.end_date}
                    onChange={(e) => updateEducationEntry(index, 'end_date', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Button onClick={addEducationEntry} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Education Entry
          </Button>
        </CardContent>
      </Card>

      {/* Work History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work History
          </CardTitle>
          <CardDescription>
            Add your employment history and work experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.work_history.map((entry, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Work Entry {index + 1}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeWorkEntry(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={entry.company}
                    onChange={(e) => updateWorkEntry(index, 'company', e.target.value)}
                    placeholder="Company/Organization name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Position/Title</Label>
                  <Input
                    value={entry.position}
                    onChange={(e) => updateWorkEntry(index, 'position', e.target.value)}
                    placeholder="Job title or position"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={entry.country}
                    onChange={(e) => updateWorkEntry(index, 'country', e.target.value)}
                    placeholder="Country where you worked"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={entry.start_date}
                    onChange={(e) => updateWorkEntry(index, 'start_date', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={entry.end_date}
                    onChange={(e) => updateWorkEntry(index, 'end_date', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label>Job Description</Label>
                  <Textarea
                    value={entry.description}
                    onChange={(e) => updateWorkEntry(index, 'description', e.target.value)}
                    placeholder="Describe your responsibilities and achievements"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Button onClick={addWorkEntry} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Work Entry
          </Button>
        </CardContent>
      </Card>

      {/* Travel History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Travel History
          </CardTitle>
          <CardDescription>
            Record your international travel history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.travel_history.map((entry, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Travel Entry {index + 1}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeTravelEntry(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country Visited</Label>
                  <Input
                    value={entry.country}
                    onChange={(e) => updateTravelEntry(index, 'country', e.target.value)}
                    placeholder="Country you visited"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Purpose of Visit</Label>
                  <Select
                    value={entry.purpose}
                    onValueChange={(value) => updateTravelEntry(index, 'purpose', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tourism">Tourism</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="family">Family Visit</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Entry Date</Label>
                  <Input
                    type="date"
                    value={entry.start_date}
                    onChange={(e) => updateTravelEntry(index, 'start_date', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Exit Date</Label>
                  <Input
                    type="date"
                    value={entry.end_date}
                    onChange={(e) => updateTravelEntry(index, 'end_date', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={entry.notes}
                    onChange={(e) => updateTravelEntry(index, 'notes', e.target.value)}
                    placeholder="Any additional details about this trip"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Button onClick={addTravelEntry} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Travel Entry
          </Button>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>
            Any other relevant information for your immigration case
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Languages Spoken</Label>
            <Input
              value={data.languages.join(', ')}
              onChange={(e) => setData({ ...data, languages: e.target.value.split(',').map(lang => lang.trim()) })}
              placeholder="English, Spanish, French, etc. (comma-separated)"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={data.additional_notes}
              onChange={(e) => setData({ ...data, additional_notes: e.target.value })}
              placeholder="Any other information that might be relevant to your immigration case"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};