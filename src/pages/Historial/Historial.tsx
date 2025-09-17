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
    usuario: '',
    proyecto: '',
    estado_enviado: '',
    medio__url: '',
    medio__url__icontains: '',
    red_social__red_social__nombre__icontains: '',
    created_at__gte: '',
    created_at__lte: '',
    inicio_envio__gte: '',
    fin_envio__lte: '',
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

        if (params?.usuario !== undefined) {
          apiParams.usuario = params.usuario;
        } else if (filters.filters.usuario) {
          apiParams.usuario = filters.filters.usuario;
        }

        if (params?.proyecto !== undefined) {
          apiParams.proyecto = params.proyecto;
        } else if (filters.filters.proyecto) {
          apiParams.proyecto = filters.filters.proyecto;
        }

        if (params?.estado_enviado !== undefined) {
          apiParams.estado_enviado = params.estado_enviado;
        } else if (filters.filters.estado_enviado) {
          if (filters.filters.estado_enviado === 'true') {
            apiParams.estado_enviado = true;
          } else if (filters.filters.estado_enviado === 'false') {
            apiParams.estado_enviado = false;
          }
        }

        if (params?.medio__url !== undefined) {
          apiParams.medio__url = params.medio__url;
        } else if (filters.filters.medio__url) {
          apiParams.medio__url = filters.filters.medio__url;
        }

        if (params?.medio__url__icontains !== undefined) {
          apiParams.medio__url__icontains = params.medio__url__icontains;
        } else if (filters.filters.medio__url__icontains) {
          apiParams.medio__url__icontains =
            filters.filters.medio__url__icontains;
        }

        if (params?.red_social__red_social__nombre__icontains !== undefined) {
          apiParams.red_social__red_social__nombre__icontains =
            params.red_social__red_social__nombre__icontains;
        } else if (filters.filters.red_social__red_social__nombre__icontains) {
          apiParams.red_social__red_social__nombre__icontains =
            filters.filters.red_social__red_social__nombre__icontains;
        }

        if (params?.created_at__gte !== undefined) {
          apiParams.created_at__gte = params.created_at__gte;
        } else if (filters.filters.created_at__gte) {
          apiParams.created_at__gte = filters.filters.created_at__gte;
        }

        if (params?.created_at__lte !== undefined) {
          apiParams.created_at__lte = params.created_at__lte;
        } else if (filters.filters.created_at__lte) {
          apiParams.created_at__lte = filters.filters.created_at__lte;
        }

        if (params?.inicio_envio__gte !== undefined) {
          apiParams.inicio_envio__gte = params.inicio_envio__gte;
        } else if (filters.filters.inicio_envio__gte) {
          apiParams.inicio_envio__gte = filters.filters.inicio_envio__gte;
        }

        if (params?.fin_envio__lte !== undefined) {
          apiParams.fin_envio__lte = params.fin_envio__lte;
        } else if (filters.filters.fin_envio__lte) {
          apiParams.fin_envio__lte = filters.filters.fin_envio__lte;
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
