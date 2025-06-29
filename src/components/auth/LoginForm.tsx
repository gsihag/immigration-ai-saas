import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useAuth();
  const { toast } = useToast();

  const getErrorMessage = (errorMessage: string) => {
    // Check for specific Supabase error messages
    if (errorMessage.includes('Invalid login credentials') || 
        errorMessage.includes('Email not confirmed') ||
        errorMessage.includes('User not found')) {
      return 'User does not exist. Please check your email address or sign up for a new account.';
    }
    
    if (errorMessage.includes('Email not confirmed')) {
      return 'Please check your email and confirm your account before logging in.';
    }
    
    if (errorMessage.includes('Too many requests')) {
      return 'Too many login attempts. Please wait a few minutes before trying again.';
    }
    
    if (errorMessage.includes('Invalid email')) {
      return 'Please enter a valid email address.';
    }
    
    // Default error message
    return 'Login failed. Please check your credentials and try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signIn(email, password);
      if (error) {
        const userFriendlyError = getErrorMessage(error.message);
        setError(userFriendlyError);
      } else {
        toast({
          title: "Success",
          description: "You have been logged in successfully.",
        });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Sign In
        </CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(''); // Clear error when user starts typing
              }}
              placeholder="Enter your email address"
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(''); // Clear error when user starts typing
              }}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Don't have an account? Switch to the Sign Up tab above.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};