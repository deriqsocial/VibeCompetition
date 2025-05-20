import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Create an AuthProvider component to handle authentication
function AuthProvider() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Function to parse session from hash
    const parseSessionFromHash = async () => {
      const hash = location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set session using tokens
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }
      setLoading(false);
    };

    // Initial load - check existing session and parse from hash if present
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session && location.hash) {
        parseSessionFromHash();
      } else {
        setLoading(false);
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Clean up subscription
    return () => subscription.unsubscribe();
  }, [location.hash]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          !session ? (
            <Login />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          session ? (
            <Dashboard />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider />
    </Router>
  );
}

export default App;