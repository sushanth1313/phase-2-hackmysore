import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

export interface User {
  id: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN' | 'EXPERT';
  track?: 'TECHNICAL' | 'NON_TECHNICAL';
  careerArea?: string;
  targetRole?: string;
  bio?: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  authLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('proofhire_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.token) {
            // Verify with backend GET /api/auth/me
            try {
              const res = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${parsedUser.token}` }
              });
              if (res.data && res.data.success && res.data.data) {
                const refreshedUser: User = {
                  ...res.data.data,
                  token: res.data.data.token || parsedUser.token
                };
                setUser(refreshedUser);
                localStorage.setItem('proofhire_user', JSON.stringify(refreshedUser));
              } else {
                localStorage.removeItem('proofhire_user');
                setUser(null);
              }
            } catch (err: any) {
              if (err.response?.status === 401) {
                // Token is explicitly rejected by backend
                localStorage.removeItem('proofhire_user');
                setUser(null);
              } else {
                // In case of transient network failure, retain local credentials to avoid harsh kickouts
                setUser(parsedUser);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('proofhire_user');
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('proofhire_user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Continue cleanup on frontend
    } finally {
      setUser(null);
      localStorage.removeItem('proofhire_user');
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.data) {
        setUser((prev) => {
          if (!prev) return null;
          return {
            ...res.data.data,
            token: prev.token
          };
        });
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated: !!user, 
        authLoading, 
        refreshUser 
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
