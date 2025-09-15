import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import Button from '@shared/components/ui/Button';
import { FunnelIcon } from '@heroicons/react/24/outline';
import {
  exportarHistorial,
  type HistorialPaginationParams,
} from '@shared/services/api';
import { useState } from 'react';

interface FiltrosHistorialProps {
  filters: {
    filters: {
      search: string;
      usuario: string;
      proyecto: string;
      estado_enviado: string;
      medio__url: string;
      medio__url__icontains: string;
      red_social__red_social__nombre__icontains: string;
      created_at__gte: string;
      created_at__lte: string;
      inicio_envio__gte: string;
      fin_envio__lte: string;
    };
    updateFilters: (filters: any) => void;
    clearFilters: () => void;
    hasActiveFilters: () => boolean;
  };
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  totalCount: number;
}

export const FiltrosHistorial = ({
  filters,
  showFilters,
  setShowFilters,
  totalCount,
}: FiltrosHistorialProps) => {
  const [downloadLoading, setDownloadLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);

      const exportParams: HistorialPaginationParams = {};

      if (filters.filters.search) exportParams.search = filters.filters.search;
      if (filters.filters.usuario)
        exportParams.usuario = filters.filters.usuario;
      if (filters.filters.proyecto)
        exportParams.proyecto = filters.filters.proyecto;
      if (filters.filters.estado_enviado) {
        exportParams.estado_enviado = filters.filters.estado_enviado === 'true';
      }
      if (filters.filters.medio__url)
        exportParams.medio__url = filters.filters.medio__url;
      if (filters.filters.medio__url__icontains)
        exportParams.medio__url__icontains =
          filters.filters.medio__url__icontains;
      if (filters.filters.red_social__red_social__nombre__icontains) {
        exportParams.red_social__red_social__nombre__icontains =
          filters.filters.red_social__red_social__nombre__icontains;
      }
      if (filters.filters.created_at__gte)
        exportParams.created_at__gte = filters.filters.created_at__gte;
      if (filters.filters.created_at__lte)
        exportParams.created_at__lte = filters.filters.created_at__lte;
      if (filters.filters.inicio_envio__gte)
        exportParams.inicio_envio__gte = filters.filters.inicio_envio__gte;
      if (filters.filters.fin_envio__lte)
        exportParams.fin_envio__lte = filters.filters.fin_envio__lte;

      const blob = await exportarHistorial(exportParams);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const now = new Date();
      const timestamp = now.toISOString().split('T')[0];
      link.download = `historial-envios-${timestamp}.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar historial:', error);
      alert('Error al descargar el archivo. Por favor, intenta nuevamente.');
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en historial..."
            value={filters.filters.search || ''}
            onChange={(e) => filters.updateFilters({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="inline-flex items-center gap-2"
          >
            <FunnelIcon className="h-4 w-4" />
            Filtros
            {filters.hasActiveFilters() && (
              <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                {
                  Object.values(filters.filters).filter(
                    (v) => v && v.trim() !== ''
                  ).length
                }
              </span>
            )}
          </Button>

          <Button
            onClick={handleDownload}
            disabled={downloadLoading}
            variant="outline"
            className="inline-flex items-center gap-2"
            title="Descargar historial (Excel)"
          >
            {downloadLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <ArrowDownTrayIcon className="h-4 w-4" />
            )}
            {downloadLoading ? 'Descargando...' : 'Descargar'}
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center gap-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {totalCount} envío{totalCount !== 1 ? 's' : ''} total
            {totalCount !== 1 ? 'es' : ''}
          </span>
        </div>
      </div>
      {showFilters && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div className="flex items-center justify-between">
            {filters.hasActiveFilters() && (
              <Button
                onClick={filters.clearFilters}
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-2"
              >
                <XMarkIcon className="h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={filters.filters.usuario || ''}
                onChange={(e) =>
                  filters.updateFilters({ usuario: e.target.value })
                }
                placeholder="Ej: karen.lopez"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proyecto (UUID)
              </label>
              <input
                type="text"
                value={filters.filters.proyecto || ''}
                onChange={(e) =>
                  filters.updateFilters({ proyecto: e.target.value })
                }
                placeholder="UUID del proyecto"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado de Envío
              </label>
              <select
                value={filters.filters.estado_enviado || ''}
                onChange={(e) =>
                  filters.updateFilters({
                    estado_enviado: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos los estados</option>
                <option value="true">Enviado</option>
                <option value="false">Fallido</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL exacta
              </label>
              <input
                type="text"
                value={filters.filters.medio__url || ''}
                onChange={(e) =>
                  filters.updateFilters({ medio__url: e.target.value })
                }
                placeholder="https://ejemplo.com/articulo/123"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL contiene
              </label>
              <input
                type="text"
                value={filters.filters.medio__url__icontains || ''}
                onChange={(e) =>
                  filters.updateFilters({
                    medio__url__icontains: e.target.value,
                  })
                }
                placeholder="ejemplo.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Red Social
              </label>
              <input
                type="text"
                value={
                  filters.filters.red_social__red_social__nombre__icontains ||
                  ''
                }
                onChange={(e) =>
                  filters.updateFilters({
                    red_social__red_social__nombre__icontains: e.target.value,
                  })
                }
                placeholder="twitter, facebook, instagram"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Creación (desde)
              </label>
              <input
                type="date"
                value={filters.filters.created_at__gte || ''}
                onChange={(e) =>
                  filters.updateFilters({
                    created_at__gte: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Creación (hasta)
              </label>
              <input
                type="date"
                value={filters.filters.created_at__lte || ''}
                onChange={(e) =>
                  filters.updateFilters({
                    created_at__lte: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Inicio Envío (desde)
              </label>
              <input
                type="datetime-local"
                value={filters.filters.inicio_envio__gte || ''}
                onChange={(e) =>
                  filters.updateFilters({
                    inicio_envio__gte: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fin Envío (hasta)
              </label>
              <input
                type="datetime-local"
                value={filters.filters.fin_envio__lte || ''}
                onChange={(e) =>
                  filters.updateFilters({
                    fin_envio__lte: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
