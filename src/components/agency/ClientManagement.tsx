import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Edit, UserX, Users, Mail, Phone, Calendar, MapPin } from 'lucide-react';

interface Client {
  id: string;
  user_id: string | null;
  date_of_birth: string | null;
  country_of_birth: string | null;
  nationality: string | null;
  passport_number: string | null;
  address: any;
  emergency_contact: any;
  immigration_status: string | null;
  created_at: string | null;
  user?: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    is_active: boolean | null;
  };
  email?: string;
}

interface ClientFormData {
  email: string;
  password: string;
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

export const ClientManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    email: '',
    password: '',
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
    if (user?.agency_id) {
      fetchClients();
    }
  }, [user?.agency_id]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          user:users(first_name, last_name, phone, is_active)
        `)
        .eq('agency_id', user?.agency_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch email addresses from auth.users for display
      const clientsWithEmails = await Promise.all(
        data.map(async (clientData) => {
          if (clientData.user_id) {
            try {
              const { data: authUser } = await supabase.auth.admin.getUserById(clientData.user_id);
              return {
                ...clientData,
                email: authUser.user?.email || 'N/A'
              };
            } catch {
              return {
                ...clientData,
                email: 'N/A'
              };
            }
          }
          return {
            ...clientData,
            email: 'N/A'
          };
        })
      );

      setClients(clientsWithEmails);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
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
  };

  const handleAddClient = async () => {
    setSubmitting(true);
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: 'client',
            agency_id: user?.agency_id
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the user profile with agency_id and phone
        const { error: updateError } = await supabase
          .from('users')
          .update({
            agency_id: user?.agency_id,
            phone: formData.phone || null
          })
          .eq('id', authData.user.id);

        if (updateError) throw updateError;

        // Create client record
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

        const { error: clientError } = await supabase
          .from('clients')
          .insert({
            user_id: authData.user.id,
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
        description: "Client added successfully."
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchClients();
    } catch (error: any) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add client.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClient = async () => {
    if (!editingClient) return;

    setSubmitting(true);
    try {
      // Update user profile
      if (editingClient.user_id) {
        const { error: userError } = await supabase
          .from('users')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingClient.user_id);

        if (userError) throw userError;
      }

      // Update client record
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
        .eq('id', editingClient.id);

      if (clientError) throw clientError;

      toast({
        title: "Success",
        description: "Client updated successfully."
      });

      setIsEditDialogOpen(false);
      setEditingClient(null);
      resetForm();
      fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "Failed to update client.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateClient = async (clientData: Client) => {
    if (!clientData.user_id) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientData.user_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client deactivated successfully."
      });

      fetchClients();
    } catch (error) {
      console.error('Error deactivating client:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate client.",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (clientData: Client) => {
    setEditingClient(clientData);
    setFormData({
      email: clientData.email || '',
      password: '',
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
    setIsEditDialogOpen(true);
  };

  if (!['agency_admin', 'agency_staff'].includes(user?.role || '')) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">You don't have permission to manage clients.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Client Management</h2>
          <p className="text-muted-foreground">Manage your agency's clients</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new client account and profile.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      placeholder="Enter nationality"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country_of_birth">Country of Birth</Label>
                    <Input
                      id="country_of_birth"
                      value={formData.country_of_birth}
                      onChange={(e) => setFormData({ ...formData, country_of_birth: e.target.value })}
                      placeholder="Enter country of birth"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passport_number">Passport Number</Label>
                    <Input
                      id="passport_number"
                      value={formData.passport_number}
                      onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                      placeholder="Enter passport number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="immigration_status">Immigration Status</Label>
                  <Input
                    id="immigration_status"
                    value={formData.immigration_status}
                    onChange={(e) => setFormData({ ...formData, immigration_status: e.target.value })}
                    placeholder="Enter current immigration status"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Address</h3>
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Enter state"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="Enter ZIP code"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Enter country"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_name">Contact Name</Label>
                    <Input
                      id="emergency_name"
                      value={formData.emergency_name}
                      onChange={(e) => setFormData({ ...formData, emergency_name: e.target.value })}
                      placeholder="Enter contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_phone">Contact Phone</Label>
                    <Input
                      id="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                      placeholder="Enter contact phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_relationship">Relationship</Label>
                  <Input
                    id="emergency_relationship"
                    value={formData.emergency_relationship}
                    onChange={(e) => setFormData({ ...formData, emergency_relationship: e.target.value })}
                    placeholder="Enter relationship (e.g., spouse, parent)"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddClient} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clients
          </CardTitle>
          <CardDescription>
            Manage your agency's clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground">No clients found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((clientData) => (
                  <TableRow key={clientData.id}>
                    <TableCell>
                      <div className="font-medium">
                        {clientData.user?.first_name} {clientData.user?.last_name}
                      </div>
                      {clientData.date_of_birth && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(clientData.date_of_birth).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {clientData.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {clientData.user?.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {clientData.user.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {clientData.nationality || 'Not provided'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={clientData.user?.is_active ? 'default' : 'secondary'}>
                        {clientData.user?.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(clientData)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {clientData.user?.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateClient(clientData)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name">First Name</Label>
                  <Input
                    id="edit_first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_last_name">Last Name</Label>
                  <Input
                    id="edit_last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_date_of_birth">Date of Birth</Label>
                  <Input
                    id="edit_date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_nationality">Nationality</Label>
                  <Input
                    id="edit_nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    placeholder="Enter nationality"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_country_of_birth">Country of Birth</Label>
                  <Input
                    id="edit_country_of_birth"
                    value={formData.country_of_birth}
                    onChange={(e) => setFormData({ ...formData, country_of_birth: e.target.value })}
                    placeholder="Enter country of birth"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_passport_number">Passport Number</Label>
                  <Input
                    id="edit_passport_number"
                    value={formData.passport_number}
                    onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                    placeholder="Enter passport number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_immigration_status">Immigration Status</Label>
                <Input
                  id="edit_immigration_status"
                  value={formData.immigration_status}
                  onChange={(e) => setFormData({ ...formData, immigration_status: e.target.value })}
                  placeholder="Enter current immigration status"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address</h3>
              <div className="space-y-2">
                <Label htmlFor="edit_street">Street Address</Label>
                <Input
                  id="edit_street"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Enter street address"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_city">City</Label>
                  <Input
                    id="edit_city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Enter city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_state">State</Label>
                  <Input
                    id="edit_state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Enter state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_zipCode">ZIP Code</Label>
                  <Input
                    id="edit_zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_country">Country</Label>
                <Input
                  id="edit_country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Enter country"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_emergency_name">Contact Name</Label>
                  <Input
                    id="edit_emergency_name"
                    value={formData.emergency_name}
                    onChange={(e) => setFormData({ ...formData, emergency_name: e.target.value })}
                    placeholder="Enter contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_emergency_phone">Contact Phone</Label>
                  <Input
                    id="edit_emergency_phone"
                    value={formData.emergency_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                    placeholder="Enter contact phone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_emergency_relationship">Relationship</Label>
                <Input
                  id="edit_emergency_relationship"
                  value={formData.emergency_relationship}
                  onChange={(e) => setFormData({ ...formData, emergency_relationship: e.target.value })}
                  placeholder="Enter relationship (e.g., spouse, parent)"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditClient} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};