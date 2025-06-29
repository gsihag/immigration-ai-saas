
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { AuthPage } from "@/components/auth/AuthPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { AgencyDashboard } from "@/components/agency/AgencyDashboard";
import { ClientPortal } from "@/components/client/ClientPortal";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  console.log('App loading state:', loading);
  console.log('Current user:', user?.email, user?.role);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route 
          path="/" 
          element={
            // Redirect admin users to agency dashboard by default
            user.role === 'agency_admin' || user.role === 'agency_staff' ? 
              <Navigate to="/agency" replace /> : 
              <Dashboard />
          } 
        />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agency" element={<AgencyDashboard />} />
        <Route path="/client" element={<ClientPortal />} />
      </Routes>
    </DashboardLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
