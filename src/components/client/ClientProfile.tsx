import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Phone, Calendar, MapPin, Shield } from 'lucide-react';

interface ClientData {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  country_of_birth: string | null;
  nationality: string | null;
  passport_number: string | null;
  address: any;
  emergency_contact: any;
  immigration_status: string | null;
  user?: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  };
  email?: string;
}

interface ProfileFormData {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  country_of_birth: string;
  nationality: string;
  passport_number: string;
  immigration_status: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  emergency_name: string;
  emergency_phone: string;
  emergency_relationship: string;
}

export const ClientProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    country_of_birth: '',
    nationality: '',
    passport_number: '',
    immigration_status: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    emergency_name: '',
    emergency_phone: '',
    emergency_relationship: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchClientData();
    }
  }, [user?.id]);

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          user:users(first_name, last_name, phone)
        `)
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setClientData(data);
        setFormData({
          first_name: data.user?.first_name || '',
          last_name: data.user?.last_name || '',
          phone: data.user?.phone || '',
          date_of_birth: data.date_of_birth || '',
          country_of_birth: data.country_of_birth || '',
          nationality: data.nationality || '',
          passport_number: data.passport_number || '',
          immigration_status: data.immigration_status || '',
          street: data.address?.street || '',
          city: data.address?.city || '',
          state: data.address?.state || '',
          zipCode: data.address?.zipCode || '',
          country: data.address?.country || '',
          emergency_name: data.emergency_contact?.name || '',
          emergency_phone: data.emergency_contact?.phone || '',
          emergency_relationship: data.emergency_contact?.relationship || ''
        });
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update user profile
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (userError) throw userError;

      // Update or create client record
      const addressData = {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country
      };

      const emergencyContactData = {
        name: formData.emergency_name,
        phone: formData.emergency_phone,
        relationship: formData.emergency_relationship
      };

      if (clientData) {
        // Update existing client record
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            date_of_birth: formData.date_of_birth || null,
            country_of_birth: formData.country_of_birth || null,
            nationality: formData.nationality || null,
            passport_number: formData.passport_number || null,
            immigration_status: formData.immigration_status || null,
            address: addressData,
            emergency_contact: emergencyContactData,
            updated_at: new Date().toISOString()
          })
          .eq('id', clientData.id);

        if (clientError) throw clientError;
      } else {
        // Create new client record
        const { error: clientError } = await supabase
          .from('clients')
          .insert({
            user_id: user?.id,
            agency_id: user?.agency_id,
            date_of_birth: formData.date_of_birth || null,
            country_of_birth: formData.country_of_birth || null,
            nationality: formData.nationality || null,
            passport_number: formData.passport_number || null,
            immigration_status: formData.immigration_status || null,
            address: addressData,
            emergency_contact: emergencyContactData
          });

        if (clientError) throw clientError;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully."
      });

      setIsEditing(false);
      fetchClientData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (clientData) {
      setFormData({
        first_name: clientData.user?.first_name || '',
        last_name: clientData.user?.last_name || '',
        phone: clientData.user?.phone || '',
        date_of_birth: clientData.date_of_birth || '',
        country_of_birth: clientData.country_of_birth || '',
        nationality: clientData.nationality || '',
        passport_number: clientData.passport_number || '',
        immigration_status: clientData.immigration_status || '',
        street: clientData.address?.street || '',
        city: clientData.address?.city || '',
        state: clientData.address?.state || '',
        zipCode: clientData.address?.zipCode || '',
        country: clientData.address?.country || '',
        emergency_name: clientData.emergency_contact?.name || '',
        emergency_phone: clientData.emergency_contact?.phone || '',
        emergency_relationship: clientData.emergency_contact?.relationship || ''
      });
    }
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
          <h2 className="text-2xl font-bold">My Profile</h2>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
        <div className="space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Your basic personal and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              {isEditing ? (
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Enter first name"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.first_name || 'Not provided'}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              {isEditing ? (
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Enter last name"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.last_name || 'Not provided'}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <div className="p-2 bg-muted rounded-md">{user?.email || 'Not provided'}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.phone || 'Not provided'}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Immigration Details
          </CardTitle>
          <CardDescription>
            Your immigration-related information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date of Birth
              </Label>
              {isEditing ? (
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">
                  {formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString() : 'Not provided'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              {isEditing ? (
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="Enter nationality"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.nationality || 'Not provided'}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country_of_birth">Country of Birth</Label>
              {isEditing ? (
                <Input
                  id="country_of_birth"
                  value={formData.country_of_birth}
                  onChange={(e) => setFormData({ ...formData, country_of_birth: e.target.value })}
                  placeholder="Enter country of birth"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.country_of_birth || 'Not provided'}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="passport_number">Passport Number</Label>
              {isEditing ? (
                <Input
                  id="passport_number"
                  value={formData.passport_number}
                  onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                  placeholder="Enter passport number"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.passport_number || 'Not provided'}</div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="immigration_status">Current Immigration Status</Label>
              {isEditing ? (
                <Input
                  id="immigration_status"
                  value={formData.immigration_status}
                  onChange={(e) => setFormData({ ...formData, immigration_status: e.target.value })}
                  placeholder="Enter current immigration status"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.immigration_status || 'Not provided'}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Information
          </CardTitle>
          <CardDescription>
            Your current address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            {isEditing ? (
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Enter street address"
              />
            ) : (
              <div className="p-2 bg-muted rounded-md">{formData.street || 'Not provided'}</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              {isEditing ? (
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Enter city"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.city || 'Not provided'}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              {isEditing ? (
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Enter state"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.state || 'Not provided'}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP/Postal Code</Label>
              {isEditing ? (
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="Enter ZIP code"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.zipCode || 'Not provided'}</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            {isEditing ? (
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Enter country"
              />
            ) : (
              <div className="p-2 bg-muted rounded-md">{formData.country || 'Not provided'}</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Contact
          </CardTitle>
          <CardDescription>
            Emergency contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_name">Contact Name</Label>
              {isEditing ? (
                <Input
                  id="emergency_name"
                  value={formData.emergency_name}
                  onChange={(e) => setFormData({ ...formData, emergency_name: e.target.value })}
                  placeholder="Enter contact name"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.emergency_name || 'Not provided'}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_phone">Contact Phone</Label>
              {isEditing ? (
                <Input
                  id="emergency_phone"
                  value={formData.emergency_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                  placeholder="Enter contact phone"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.emergency_phone || 'Not provided'}</div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="emergency_relationship">Relationship</Label>
              {isEditing ? (
                <Input
                  id="emergency_relationship"
                  value={formData.emergency_relationship}
                  onChange={(e) => setFormData({ ...formData, emergency_relationship: e.target.value })}
                  placeholder="Enter relationship (e.g., spouse, parent)"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.emergency_relationship || 'Not provided'}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};