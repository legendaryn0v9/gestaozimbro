import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, User } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (phone: string, password: string) => Promise<{ error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário logado
    const checkAuth = async () => {
      try {
        const userData = await auth.getUser();
        setUser(userData);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (phone: string, password: string) => {
    const result = await auth.signIn(phone, password);
    if (result.error) {
      return { error: result.error };
    }
    if (result.data) {
      setUser(result.data.user);
    }
    return {};
  };

  const signInWithEmail = async (email: string, password: string) => {
    const result = await auth.signInWithEmail(email, password);
    if (result.error) {
      return { error: result.error };
    }
    if (result.data) {
      setUser(result.data.user);
    }
    return {};
  };

  const signOut = () => {
    auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
