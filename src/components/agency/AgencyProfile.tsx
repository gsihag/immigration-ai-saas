import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, Mail, Phone, Globe, MapPin } from 'lucide-react';

interface AddressData {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface AgencyData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: AddressData | null;
}

export const AgencyProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  useEffect(() => {
    if (user?.agency_id) {
      fetchAgencyData();
    }
  }, [user?.agency_id]);

  const fetchAgencyData = async () => {
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', user?.agency_id)
        .single();

      if (error) throw error;

      const addressData = data.address as AddressData | null;
      
      setAgency(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        street: addressData?.street || '',
        city: addressData?.city || '',
        state: addressData?.state || '',
        zipCode: addressData?.zipCode || '',
        country: addressData?.country || ''
      });
    } catch (error) {
      console.error('Error fetching agency data:', error);
      toast({
        title: "Error",
        description: "Failed to load agency information.",
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

      const { error } = await supabase
        .from('agencies')
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          website: formData.website || null,
          address: addressData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.agency_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Agency profile updated successfully."
      });

      setIsEditing(false);
      fetchAgencyData();
    } catch (error) {
      console.error('Error updating agency:', error);
      toast({
        title: "Error",
        description: "Failed to update agency profile.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (agency) {
      const addressData = agency.address as AddressData | null;
      setFormData({
        name: agency.name || '',
        email: agency.email || '',
        phone: agency.phone || '',
        website: agency.website || '',
        street: addressData?.street || '',
        city: addressData?.city || '',
        state: addressData?.state || '',
        zipCode: addressData?.zipCode || '',
        country: addressData?.country || ''
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

  if (!agency) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No agency information found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agency Profile</h2>
          <p className="text-muted-foreground">Manage your agency information</p>
        </div>
        {user?.role === 'agency_admin' && (
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
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Your agency's basic contact and identification information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agency Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter agency name"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{agency.name}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">{agency.email || 'Not provided'}</div>
              )}
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
                <div className="p-2 bg-muted rounded-md">{agency.phone || 'Not provided'}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </Label>
              {isEditing ? (
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="Enter website URL"
                />
              ) : (
                <div className="p-2 bg-muted rounded-md">
                  {agency.website ? (
                    <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {agency.website}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </div>
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
            Your agency's physical address
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
    </div>
  );
};
