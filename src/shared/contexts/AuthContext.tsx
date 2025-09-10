import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  loginWithGoogle,
  logout as apiLogout,
  isAuthenticated as checkAuth,
  getUserData,
  fetchUserProfile,
  clearTokens,
  isTokenExpired,
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
  login: (googleCredential: any) => Promise<void>;
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

  const handleTokenExpiration = useCallback(async () => {
    console.log('⏰ Token expirado, realizando logout automático...');
    clearTokens();
    setUser(null);

    if (typeof window !== 'undefined') {
      alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkTokenExpiration = () => {
      if (isTokenExpired()) {
        handleTokenExpiration();
      }
    };

    const interval = setInterval(checkTokenExpiration, 60 * 1000);

    return () => clearInterval(interval);
  }, [user, handleTokenExpiration]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (checkAuth()) {
          const savedUser = getUserData();
          if (savedUser) {
            setUser(savedUser);
          } else {
            try {
              const userProfile = await fetchUserProfile();
              setUser(userProfile);
              console.log('✅ Perfil de usuario obtenido exitosamente');
            } catch (profileError) {
              console.error(
                '❌ Error obteniendo perfil, limpiando sesión:',
                profileError
              );
              clearTokens();
            }
          }
        } else {
        }
      } catch (error) {
        console.error('❌ Error inicializando auth:', error);
        clearTokens();
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
      console.log('🚪 Iniciando logout...');
      await apiLogout();
      setUser(null);
      console.log('✅ Logout completado exitosamente');
    } catch (error) {
      console.error('❌ Error durante el logout:', error);
      // Aún así limpiar el estado local
      clearTokens();
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
