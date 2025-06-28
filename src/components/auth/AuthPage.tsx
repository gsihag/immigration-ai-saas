import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { ClientSignUpForm } from './ClientSignUpForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const AuthPage: React.FC = () => {
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
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup-agency">Agency Sign Up</TabsTrigger>
            <TabsTrigger value="signup-client">Client Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-6">
            <LoginForm />
          </TabsContent>
          
          <TabsContent value="signup-agency" className="mt-6">
            <SignUpForm />
          </TabsContent>
          
          <TabsContent value="signup-client" className="mt-6">
            <ClientSignUpForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};