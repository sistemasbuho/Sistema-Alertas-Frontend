import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import Card from '@shared/components/ui/Card';
import ThemeToggle from '@shared/components/ui/ThemeToggle';
import { useAuth } from '@shared/contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/consulta-datos');
    }
  }, [isAuthenticated, navigate]);

  const goToProyecto = () => {
    navigate('/proyecto');
  };

  const handleGoogleSuccess = async () => {
    try {
      setError('');

      await login();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google');
    }
  };

  const handleGoogleError = () => {
    setError('Error al iniciar sesión con Google');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full">
        <Card className="shadow-xl">
          <Card.Content className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Iniciar Sesión
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Accede a tu cuenta para continuar
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={goToProyecto}
                  className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  🔧 Ir directamente a Proyecto (Debug)
                </button>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
