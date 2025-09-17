import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@shared/components/layout/DashboardLayout';
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import { useToast } from '@shared/contexts/ToastContext';
import useUrlFilters from '@shared/hooks/useUrlFilters';
import {
  getHistorialEnvios,
  type HistorialEnvio,
  type HistorialPaginationParams,
  type PaginatedResponse,
} from '../../shared/services/api';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { FiltrosHistorial } from './components/FiltrosHistorial';
import { TablaHistorial } from './components/TablaHistorial';

const Historial = () => {
  const { showError } = useToast();

  const [historial, setHistorial] = useState<HistorialEnvio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
    pageSize: 20,
  });

  const filters = useUrlFilters({
    search: '',
    usuario_nombre: '',
    proyecto_nombre: '',
    estado_enviado: '',
    medio_url: '',
    medio_url_coincide: '',
    red_social_nombre: '',
    created_at_desde: '',
    created_at_hasta: '',
    inicio_envio_desde: '',
    fin_envio_hasta: '',
  });

  const loadData = useCallback(
    async (params?: HistorialPaginationParams) => {
      try {
        setLoading(true);

        const apiParams: HistorialPaginationParams = {
          page: params?.page || 1,
          page_size: 20,
        };

        if (params?.search !== undefined) {
          apiParams.search = params.search;
        } else if (filters.filters.search) {
          apiParams.search = filters.filters.search;
        }

        if (params?.usuario_nombre !== undefined) {
          apiParams.usuario_nombre = params.usuario_nombre;
        } else if (filters.filters.usuario_nombre) {
          apiParams.usuario_nombre = filters.filters.usuario_nombre;
        }

        if (params?.proyecto_nombre !== undefined) {
          apiParams.proyecto_nombre = params.proyecto_nombre;
        } else if (filters.filters.proyecto_nombre) {
          apiParams.proyecto_nombre = filters.filters.proyecto_nombre;
        }

        if (params?.estado_enviado !== undefined) {
          apiParams.estado_enviado = params.estado_enviado;
        } else if (filters.filters.estado_enviado) {
          apiParams.estado_enviado = filters.filters.estado_enviado;
        }

        if (params?.medio_url !== undefined) {
          apiParams.medio_url = params.medio_url;
        } else if (filters.filters.medio_url) {
          apiParams.medio_url = filters.filters.medio_url;
        }

        if (params?.medio_url_coincide !== undefined) {
          apiParams.medio_url_coincide = params.medio_url_coincide;
        } else if (filters.filters.medio_url_coincide) {
          apiParams.medio_url_coincide = filters.filters.medio_url_coincide;
        }

        if (params?.red_social_nombre !== undefined) {
          apiParams.red_social_nombre = params.red_social_nombre;
        } else if (filters.filters.red_social_nombre) {
          apiParams.red_social_nombre = filters.filters.red_social_nombre;
        }

        if (params?.created_at_desde !== undefined) {
          apiParams.created_at_desde = params.created_at_desde;
        } else if (filters.filters.created_at_desde) {
          apiParams.created_at_desde = filters.filters.created_at_desde;
        }

        if (params?.created_at_hasta !== undefined) {
          apiParams.created_at_hasta = params.created_at_hasta;
        } else if (filters.filters.created_at_hasta) {
          apiParams.created_at_hasta = filters.filters.created_at_hasta;
        }

        if (params?.inicio_envio_desde !== undefined) {
          apiParams.inicio_envio_desde = params.inicio_envio_desde;
        } else if (filters.filters.inicio_envio_desde) {
          apiParams.inicio_envio_desde = filters.filters.inicio_envio_desde;
        }

        if (params?.fin_envio_hasta !== undefined) {
          apiParams.fin_envio_hasta = params.fin_envio_hasta;
        } else if (filters.filters.fin_envio_hasta) {
          apiParams.fin_envio_hasta = filters.filters.fin_envio_hasta;
        }

        const response: PaginatedResponse<HistorialEnvio> =
          await getHistorialEnvios(apiParams);

        setHistorial(response.results);
        setPagination((prev) => ({
          ...prev,
          count: response.count,
          next: response.next,
          previous: response.previous,
          currentPage: params?.page || 1,
        }));
      } catch (error) {
        console.error('Error cargando historial:', error);
        showError('Error al cargar el historial de envíos');
      } finally {
        setLoading(false);
      }
    },
    [filters.filters]
  );

  useEffect(() => {
    loadData({ page: 1 });
  }, [loadData]);

  const handlePageChange = (newPage: number) => {
    loadData({ page: newPage });
  };

  const handleNextPage = () => {
    if (pagination.next) {
      handlePageChange(pagination.currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pagination.previous) {
      handlePageChange(pagination.currentPage - 1);
    }
  };

  return (
    <DashboardLayout title="Historial de Envíos">
      <div className="w-full mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Historial
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Revisa el historial completo de todos los envíos de alertas
          </p>
        </div>

        <Card className="mt-6">
          <Card.Content className="p-4">
            <FiltrosHistorial
              filters={filters}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              totalCount={pagination.count}
            />
          </Card.Content>
        </Card>

        <TablaHistorial
          historial={historial}
          loading={loading}
          filters={filters}
        />

        {historial.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {historial.length} de {pagination.count} envíos
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePreviousPage}
                disabled={!pagination.previous}
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-1"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300 px-3">
                Página {pagination.currentPage}
              </span>
              <Button
                onClick={handleNextPage}
                disabled={!pagination.next}
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-1"
              >
                Siguiente
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Historial;
