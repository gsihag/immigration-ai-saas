import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Building, User, Mail, Lock, Phone } from 'lucide-react';

interface SignUpFormProps {
  userType: 'admin' | 'client';
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ userType }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: userType === 'admin' ? 'agency_admin' : 'client',
    agencyName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { signUp } = useAuth();
  const { toast } = useToast();

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (userType === 'admin' && !formData.agencyName) {
      setError('Agency name is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const userData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        phone: formData.phone,
        ...(userType === 'admin' && { agency_name: formData.agencyName })
      };

      const { error } = await signUp(formData.email, formData.password, userData);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        toast({
          title: "Account Created Successfully",
          description: userType === 'admin' 
            ? "Welcome! You can now access your agency dashboard."
            : "Welcome! You can now access your client portal.",
        });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  if (success) {
    return (
      <Card className="w-[450px]">
        <CardHeader className="text-center">
          <CardTitle className="text-green-600 flex items-center justify-center gap-2">
            {userType === 'admin' ? <Building className="h-5 w-5" /> : <User className="h-5 w-5" />}
            Welcome to Immigration AI!
          </CardTitle>
          <CardDescription>
            Your account has been created successfully. You can now access your {userType === 'admin' ? 'agency dashboard' : 'client portal'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              You are now logged in and can start {userType === 'admin' ? 'managing your agency' : 'managing your immigration information'}.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-[450px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {userType === 'admin' ? <Building className="h-5 w-5" /> : <User className="h-5 w-5" />}
          Create {userType === 'admin' ? 'Agency' : 'Client'} Account
        </CardTitle>
        <CardDescription>
          {userType === 'admin' 
            ? 'Set up your immigration agency on our platform'
            : 'Join Immigration AI to manage your immigration journey'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {userType === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="agencyName" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Agency Name *
              </Label>
              <Input
                id="agencyName"
                value={formData.agencyName}
                onChange={(e) => updateFormData('agencyName', e.target.value)}
                placeholder="Enter your agency name"
                required
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => updateFormData('firstName', e.target.value)}
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => updateFormData('lastName', e.target.value)}
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData('phone', e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          {userType === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => updateFormData('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agency_admin">Agency Administrator</SelectItem>
                  <SelectItem value="agency_staff">Agency Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Password *
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => updateFormData('password', e.target.value)}
              placeholder="Create a secure password"
              required
            />
            <p className="text-xs text-muted-foreground">
              Password must be at least 6 characters long
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => updateFormData('confirmPassword', e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              'Creating Account...'
            ) : (
              `Create ${userType === 'admin' ? 'Agency' : 'Client'} Account`
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              By creating an account, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};