import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface AuthUser extends User {
  role?: UserRole;
  agency_id?: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        if (mounted) {
          setSession(session);
          if (session?.user) {
            await fetchUserProfile(session.user);
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (!mounted) return;
      
      setSession(session);
      if (session?.user) {
        // Set user immediately for faster loading, then fetch profile in background
        setUser({
          ...session.user,
          role: 'client' as UserRole,
          agency_id: 'default-agency',
          first_name: session.user.user_metadata?.first_name || 'User',
          last_name: session.user.user_metadata?.last_name || 'Name',
        });
        setLoading(false);
        
        // Fetch full profile in background
        setTimeout(() => {
          fetchUserProfile(session.user);
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (authUser: User) => {
    try {
      console.log('Fetching user profile for:', authUser.email);
      
      // Try to fetch user profile, but don't fail if table doesn't exist
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.warn('Could not fetch user profile (this is normal if users table does not exist):', error.message);
        // Set user without profile data
        setUser({
          ...authUser,
          role: 'client' as UserRole, // Default role for testing
          agency_id: 'default-agency',
          first_name: authUser.user_metadata?.first_name || 'User',
          last_name: authUser.user_metadata?.last_name || 'Name',
        });
      } else {
        console.log('User profile fetched:', userProfile);
        setUser({
          ...authUser,
          role: userProfile.role,
          agency_id: userProfile.agency_id,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set user with basic info to prevent infinite loading
      setUser({
        ...authUser,
        role: 'client' as UserRole, // Default role for testing
        agency_id: 'default-agency',
        first_name: authUser.user_metadata?.first_name || 'User',
        last_name: authUser.user_metadata?.last_name || 'Name',
      });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};