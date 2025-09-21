
import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Cookies from 'js-cookie';

const queryClient = new QueryClient();

const App = () => {
  const [auth, setAuth] = useState<{userId: number, username: string, token: string} | null>(null);

  useEffect(() => {
    const savedAuth = Cookies.get('auth_session');
    if (savedAuth) {
      try {
        setAuth(JSON.parse(savedAuth));
      } catch (e) {
        Cookies.remove('auth_session');
      }
    }
  }, []);

  const handleLogin = (userId: number, username: string, token: string) => {
    const authData = { userId, username, token };
    setAuth(authData);
    Cookies.set('auth_session', JSON.stringify(authData), { 
      expires: 7,
      sameSite: 'strict'
    });
  };

  const handleLogout = () => {
    setAuth(null);
    Cookies.remove('auth_session');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={<Index auth={auth} onLogin={handleLogin} onLogout={handleLogout} />} 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;