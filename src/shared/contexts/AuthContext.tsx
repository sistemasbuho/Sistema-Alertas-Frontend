import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  loginWithGoogle,
  logout as apiLogout,
  isAuthenticated as checkAuth,
  type AuthResponse,
} from '@shared/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && checkAuth();

  console.log('🔍 AuthContext Debug:', {
    hasUser: !!user,
    hasToken: checkAuth(),
    isAuthenticated,
    isLoading,
    user: user?.name,
  });

  const login = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const authResponse: AuthResponse = await loginWithGoogle();
      setUser(authResponse.user);
    } catch (error) {
      console.error('Error durante el login:', error);
      throw new Error('Error al iniciar sesión. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await apiLogout();
      setUser(null);
    } catch (error) {
      console.error('Error durante el logout:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
