import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building, User } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [userType, setUserType] = useState<'admin' | 'client'>('client');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Immigration AI SaaS
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Streamline your immigration case management
          </p>
        </div>

        {/* User Type Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
            I am a...
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={userType === 'client' ? 'default' : 'outline'}
              onClick={() => setUserType('client')}
              className="flex flex-col items-center gap-2 h-20"
            >
              <User className="h-6 w-6" />
              <span>Client</span>
            </Button>
            <Button
              variant={userType === 'admin' ? 'default' : 'outline'}
              onClick={() => setUserType('admin')}
              className="flex flex-col items-center gap-2 h-20"
            >
              <Building className="h-6 w-6" />
              <span>Agency</span>
            </Button>
          </div>
          <div className="mt-3 text-center">
            <Badge variant="outline" className="text-xs">
              {userType === 'client' ? 'Immigration Client Portal' : 'Agency Management Dashboard'}
            </Badge>
          </div>
        </div>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-6">
            <LoginForm />
          </TabsContent>
          
          <TabsContent value="signup" className="mt-6">
            <SignUpForm userType={userType} />
          </TabsContent>
        </Tabs>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-500">
          {userType === 'client' ? (
            <p>
              New to our platform? Sign up to track your immigration case progress and manage your documents.
            </p>
          ) : (
            <p>
              Immigration agency? Sign up to manage your clients, staff, and cases efficiently.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};