import { Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from '@shared/contexts/ThemeContext';
import { AuthProvider } from '@shared/contexts/AuthContext';
import { ToastProvider } from '@shared/contexts/ToastContext';
import ProtectedRoute from '@shared/components/auth/ProtectedRoute';
import useTocMetrics from '@shared/hooks/useTocMetrics';
import ConsultaDatos from '@/pages/ConsultaDatos/ConsultaDatos';
import Historial from '@/pages/Historial/Historial';
import Proyecto from './pages/Proyecto/Proyecto';
import LoginPage from './pages/auth/LoginPage';
import Ingestion from './pages/Ingestion/Ingestion';
import IngestionResultado from './pages/Ingestion/IngestionResultado';

function App() {
  useTocMetrics();

  return (
    <GoogleOAuthProvider
      clientId={
        import.meta.env.VITE_GOOGLE_CLIENT_ID ||
        '976472882522-jfcok79uuii12i78tv4nkvs52g2ismuc.apps.googleusercontent.com'
      }
    >
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/proyecto" element={<Proyecto />} />
                <Route
                  path="/consulta-datos"
                  element={
                    <ProtectedRoute>
                      <ConsultaDatos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ingestion"
                  element={
                    <ProtectedRoute>
                      <Ingestion />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ingestion/resultados"
                  element={
                    <ProtectedRoute>
                      <IngestionResultado />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/historial"
                  element={
                    <ProtectedRoute>
                      <Historial />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={<Navigate to="/consulta-datos" replace />}
                />
              </Routes>
            </div>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
