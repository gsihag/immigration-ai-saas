
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import { AuthPage } from "./components/auth/AuthPage";
import { Dashboard } from "./components/dashboard/Dashboard";
import { GeminiChatContainer } from "./components/chat/GeminiChatContainer";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/*" element={<Dashboard />} />
            </Routes>
            <GeminiChatContainer />
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
