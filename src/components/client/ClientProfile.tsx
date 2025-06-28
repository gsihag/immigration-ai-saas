
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, MapPin, Phone, Heart } from 'lucide-react';

interface AddressData {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface EmergencyContactData {
  name?: string;
  phone?: string;
  relationship?: string;
}

interface ClientData {
  id: string;
  user_id: string;
  agency_id: string;
  date_of_birth: string | null;
  country_of_birth: string | null;
  nationality: string | null;
  passport_number: string | null;
  immigration_status: string | null;
  address: AddressData | null;
  emergency_contact: EmergencyContactData | null;
  created_at: string;
  updated_at: string;
}

export const ClientProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
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
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: ''
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
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const addressData = data.address as AddressData | null;
        const emergencyContactData = data.emergency_contact as EmergencyContactData | null;

        setClient(data);
        setFormData({
          date_of_birth: data.date_of_birth || '',
          country_of_birth: data.country_of_birth || '',
          nationality: data.nationality || '',
          passport_number: data.passport_number || '',
          immigration_status: data.immigration_status || '',
          street: addressData?.street || '',
          city: addressData?.city || '',
          state: addressData?.state || '',
          zipCode: addressData?.zipCode || '',
          country: addressData?.country || '',
          emergency_contact_name: emergencyContactData?.name || '',
          emergency_contact_phone: emergencyContactData?.phone || '',
          emergency_contact_relationship: emergencyContactData?.relationship || ''
        });
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast({
        title: "Error",
        description: "Failed to load client information.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const addressData: AddressData = {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country
      };

      const emergencyContactData: EmergencyContactData = {
        name: formData.emergency_contact_name,
        phone: formData.emergency_contact_phone,
        relationship: formData.emergency_contact_relationship
      };

      const updateData = {
        date_of_birth: formData.date_of_birth || null,
        country_of_birth: formData.country_of_birth || null,
        nationality: formData.nationality || null,
        passport_number: formData.passport_number || null,
        immigration_status: formData.immigration_status || null,
        address: addressData,
        emergency_contact: emergencyContactData,
        updated_at: new Date().toISOString()
      };

      if (client) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update(updateData)
          .eq('user_id', user?.id);

        if (error) throw error;
      } else {
        // Create new client record
        const { error } = await supabase
          .from('clients')
          .insert({
            user_id: user?.id,
            agency_id: user?.agency_id,
            ...updateData
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully."
      });

      setIsEditing(false);
      fetchClientData();
    } catch (error) {
      console.error('Error updating client:', error);
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
    if (client) {
      const addressData = client.address as AddressData | null;
      const emergencyContactData = client.emergency_contact as EmergencyContactData | null;

      setFormData({
        date_of_birth: client.date_of_birth || '',
        country_of_birth: client.country_of_birth || '',
        nationality: client.nationality || '',
        passport_number: client.passport_number || '',
        immigration_status: client.immigration_status || '',
        street: addressData?.street || '',
        city: addressData?.city || '',
        state: addressData?.state || '',
        zipCode: addressData?.zipCode || '',
        country: addressData?.country || '',
        emergency_contact_name: emergencyContactData?.name || '',
        emergency_contact_phone: emergencyContactData?.phone || '',
        emergency_contact_relationship: emergencyContactData?.relationship || ''
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
          <p className="text-muted-foreground">Manage your personal and immigration information</p>
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

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Your basic personal and immigration details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <div className="p-2 bg-muted rounded-md">{user?.first_name || 'Not provided'}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <div className="p-2 bg-muted rounded-md">{user?.last_name || 'Not provided'}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
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

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Information
          </CardTitle>
          <CardDescription>
            Your current residential address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Emergency Contact
          </CardTitle>
          <CardDescription>
            Person to contact in case of emergency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  placeholder="Enter contact name"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.emergency_contact_name || 'Not provided'}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              {isEditing ? (
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.emergency_contact_phone || 'Not provided'}</div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="emergency_contact_relationship">Relationship</Label>
              {isEditing ? (
                <Input
                  id="emergency_contact_relationship"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                  placeholder="e.g., Spouse, Parent, Sibling, Friend"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{formData.emergency_contact_relationship || 'Not provided'}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
