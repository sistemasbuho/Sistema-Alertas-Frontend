import React from 'react';
import Button from '@shared/components/ui/Button';
import { XMarkIcon } from '@heroicons/react/24/outline';

type TabType = 'medios' | 'redes';

interface FilterState {
  filters: {
    proyecto_nombre?: string;
    autor?: string;
    url?: string;
    estado_enviado?: string;
    estado_revisado?: string;
  };
  updateFilters: (newFilters: any) => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
}

interface DataFiltersProps {
  activeTab: TabType;
  mediosFilters: FilterState;
  redesFilters: FilterState;
}

const DataFilters: React.FC<DataFiltersProps> = ({
  activeTab,
  mediosFilters,
  redesFilters,
}) => {
  const getCurrentFilters = () => {
    return activeTab === 'medios' ? mediosFilters : redesFilters;
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Filtros de {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h3>
        {getCurrentFilters().hasActiveFilters() && (
          <Button
            onClick={getCurrentFilters().clearFilters}
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
        {activeTab === 'medios' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proyecto
              </label>
              <input
                type="text"
                value={mediosFilters.filters.proyecto_nombre || ''}
                onChange={(e) =>
                  mediosFilters.updateFilters({
                    proyecto_nombre: e.target.value,
                  })
                }
                placeholder="Nombre del proyecto"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Autor
              </label>
              <input
                type="text"
                value={mediosFilters.filters.autor || ''}
                onChange={(e) =>
                  mediosFilters.updateFilters({
                    autor: e.target.value,
                  })
                }
                placeholder="Ej: Juan Pérez"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL
              </label>
              <input
                type="text"
                value={mediosFilters.filters.url || ''}
                onChange={(e) =>
                  mediosFilters.updateFilters({
                    url: e.target.value,
                  })
                }
                placeholder="Ej: https://eltiempo.com/noticia/123"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado Enviado
              </label>
              <select
                value={mediosFilters.filters.estado_enviado || ''}
                onChange={(e) =>
                  mediosFilters.updateFilters({
                    estado_enviado: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="true">Enviado</option>
                <option value="false">No Enviado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado Revisado
              </label>
              <select
                value={mediosFilters.filters.estado_revisado || ''}
                onChange={(e) =>
                  mediosFilters.updateFilters({
                    estado_revisado: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="true">Revisado</option>
                <option value="false">Pendiente</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proyecto
              </label>
              <input
                type="text"
                value={redesFilters.filters.proyecto_nombre || ''}
                onChange={(e) =>
                  redesFilters.updateFilters({
                    proyecto_nombre: e.target.value,
                  })
                }
                placeholder="Nombre del proyecto"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Autor
              </label>
              <input
                type="text"
                value={redesFilters.filters.autor || ''}
                onChange={(e) =>
                  redesFilters.updateFilters({
                    autor: e.target.value,
                  })
                }
                placeholder="Ej: Juan"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL
              </label>
              <input
                type="text"
                value={redesFilters.filters.url || ''}
                onChange={(e) =>
                  redesFilters.updateFilters({
                    url: e.target.value,
                  })
                }
                placeholder="Ej: https://twitter.com/post/123"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado Enviado
              </label>
              <select
                value={redesFilters.filters.estado_enviado || ''}
                onChange={(e) =>
                  redesFilters.updateFilters({
                    estado_enviado: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="true">Enviado</option>
                <option value="false">No Enviado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado Revisado
              </label>
              <select
                value={redesFilters.filters.estado_revisado || ''}
                onChange={(e) =>
                  redesFilters.updateFilters({
                    estado_revisado: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="true">Revisado</option>
                <option value="false">Pendiente</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DataFilters;
