import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loginWithGoogle,
  isAuthenticated as checkAuth,
  getUserData,
  clearTokens,
  setNavigationFunction,
  type AuthResponse,
} from '@shared/services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_superuser: boolean;
  is_staff: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (googleCredential: any) => Promise<void>;
  logout: () => void;
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
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  useEffect(() => {
    setNavigationFunction(navigate);
  }, [navigate]);

  const logout = useCallback((): void => {
    clearTokens();
    setUser(null);
    setIsLoading(false);

    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_access_token' && e.newValue === null && user) {
        setUser(null);
        setIsLoading(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (checkAuth()) {
          const savedUser = getUserData();
          if (savedUser) {
            setUser(savedUser as User);
          }
        }
      } catch (error) {
        console.error('Error inicializando auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (googleCredential: any): Promise<void> => {
    try {
      setIsLoading(true);
      const authResponse: AuthResponse = await loginWithGoogle(
        googleCredential
      );

      const user: User = {
        id: authResponse.id,
        email: authResponse.email,
        first_name: authResponse.first_name,
        last_name: authResponse.last_name,
        is_superuser: authResponse.is_superuser,
        is_staff: authResponse.is_staff,
      };

      setUser(user);
    } catch (error) {
      console.error('Error durante el login:', error);
      throw new Error('Error al iniciar sesión. Por favor, intenta de nuevo.');
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
