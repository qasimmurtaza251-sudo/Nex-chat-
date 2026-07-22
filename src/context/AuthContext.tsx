import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  switchUserByEmail: (email: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updated: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('emailchat_auth_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      } catch (e) {
        console.error('Failed to parse saved auth session:', e);
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('emailchat_auth_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('emailchat_auth_session');
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, isSignup: false }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setIsLoading(false);
        return { success: false, error: data.error || 'Invalid credentials' };
      }
      if (data.user) {
        setUser(data.user);
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: 'User data not returned' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const signup = async (email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, isSignup: true }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setIsLoading(false);
        return { success: false, error: data.error || 'Failed to sign up' };
      }
      if (data.user) {
        setUser(data.user);
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: 'User data not returned' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Network error during signup' };
    }
  };

  const switchUserByEmail = async (targetEmail: string): Promise<boolean> => {
    const clean = targetEmail.trim().toLowerCase();
    if (!clean) return false;
    setIsLoading(true);
    try {
      let res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean, password: '123456', isSignup: false }),
      });
      let data = await res.json();

      if (!res.ok && data.error && (data.error.toLowerCase().includes('not found') || data.error.toLowerCase().includes('sign up'))) {
        res = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: clean, password: '123456', name: clean.split('@')[0], isSignup: true }),
        });
        data = await res.json();
      }

      if (data.user) {
        setUser(data.user);
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('emailchat_auth_session');
  };

  const updateUser = async (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      localStorage.setItem('emailchat_auth_session', JSON.stringify(next));
      return next;
    });

    if (user?.email) {
      try {
        await fetch('/api/users/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            ...updated,
          }),
        });
      } catch (err) {
        console.error('Failed to sync profile update to backend:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        switchUserByEmail,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
