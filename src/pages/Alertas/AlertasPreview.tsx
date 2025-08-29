import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '@shared/components/layout/DashboardLayout';
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import { useToast } from '@shared/contexts/ToastContext';
import { enviarAlertas } from '@shared/services/api';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface AlertaItem {
  id: string;
  url: string;
  contenido: string;
  fecha: string;
  titulo?: string; // Para medios
  autor?: string;
  reach?: number;
  engagement?: number;
}

interface LocationState {
  selectedItems: AlertaItem[];
  tipo: 'medios' | 'redes';
  proyectoId: string;
}

const AlertasPreview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const state = location.state as LocationState;
  const [alertas, setAlertas] = useState<AlertaItem[]>(
    state?.selectedItems || []
  );
  const [isEnviando, setIsEnviando] = useState(false);

  if (!state || !state.selectedItems.length) {
    return (
      <DashboardLayout title="Alertas">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No hay elementos seleccionados para enviar alertas.
          </p>
          <Button onClick={() => navigate('/consulta-datos')} className="mt-4">
            Volver a Consulta de Datos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleRemoveAlerta = (id: string) => {
    setAlertas((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEnviarAlertas = async () => {
    try {
      setIsEnviando(true);

      const payload = {
        proyecto_id: state.proyectoId,
        enviar: true,
        alertas: alertas.map((item) => ({
          url: item.url,
          contenido: item.contenido,
          fecha: item.fecha,
        })),
      };

      console.log('📤 Enviando alertas:', payload);

      await enviarAlertas(payload);

      showSuccess(
        'Alertas enviadas',
        `Se han enviado ${alertas.length} alertas correctamente`
      );

      navigate('/consulta-datos');
    } catch (error: any) {
      console.error('Error enviando alertas:', error);
      showError('Error al enviar', 'No se pudieron enviar las alertas');
    } finally {
      setIsEnviando(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIconForUrl = (url: string) => {
    if (url.includes('twitter.com')) return '🐦';
    if (url.includes('facebook.com')) return '📘';
    if (url.includes('instagram.com')) return '📷';
    return '🌐';
  };

  return (
    <DashboardLayout title="Vista Previa de Alertas">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/consulta-datos')}
              variant="outline"
              className="inline-flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Alertas
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {alertas.length} {state.tipo} seleccionados para enviar
              </p>
            </div>
          </div>
          <Button
            onClick={handleEnviarAlertas}
            disabled={alertas.length === 0 || isEnviando}
            isLoading={isEnviando}
            className="inline-flex items-center gap-2"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            {isEnviando ? 'Enviando...' : 'Enviar Alertas'}
          </Button>
        </div>

        {/* Lista de alertas */}
        <div className="space-y-4">
          {alertas.map((item) => (
            <Card key={item.id}>
              <Card.Content className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-2xl">
                        {getIconForUrl(item.url)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {state.tipo === 'medios' ? 'Medio' : 'Red Social'}
                        </span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(item.fecha)}
                        </span>
                      </div>

                      {item.titulo && (
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {item.titulo}
                        </h3>
                      )}

                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {item.contenido}
                      </p>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm break-all"
                      >
                        {item.url}
                      </a>

                      <div className="flex items-center gap-4 mt-3">
                        {item.autor && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            <strong>Autor:</strong> {item.autor}
                          </span>
                        )}
                        {item.reach && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            <strong>Reach:</strong>{' '}
                            {item.reach.toLocaleString()}
                          </span>
                        )}
                        {item.engagement && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            <strong>Engagement:</strong>{' '}
                            {item.engagement.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleRemoveAlerta(item.id)}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 text-red-600 hover:text-red-800 hover:border-red-300"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>

        {alertas.length > 0 && (
          <Card>
            <Card.Content className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Resumen del envío
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {alertas.length} alertas de {state.tipo} serán enviadas
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => setAlertas([])}
                    variant="outline"
                    disabled={isEnviando}
                  >
                    Limpiar todo
                  </Button>
                  <Button
                    onClick={handleEnviarAlertas}
                    disabled={isEnviando}
                    isLoading={isEnviando}
                    className="inline-flex items-center gap-2"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    {isEnviando
                      ? 'Enviando...'
                      : `Enviar ${alertas.length} alertas`}
                  </Button>
                </div>
              </div>
            </Card.Content>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AlertasPreview;
