import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import Button from '@shared/components/ui/Button';
import { FunnelIcon } from '@heroicons/react/24/outline';
import {
  exportarHistorial,
  getIngestionProjects,
  type HistorialPaginationParams,
  type Proyecto,
} from '@shared/services/api';
import { useEffect, useRef, useState } from 'react';

interface FiltrosHistorialProps {
  filters: {
    filters: {
      search: string;
      usuario_nombre: string;
      proyecto_nombre: string;
      estado_enviado: string;
      medio_url: string;
      medio_url_coincide: string;
      red_social_nombre: string;
      created_at_desde: string;
      created_at_hasta: string;
      inicio_envio_desde: string;
      fin_envio_hasta: string;
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
  const [proyectosSugeridos, setProyectosSugeridos] = useState<Proyecto[]>([]);
  const [showProyectoSuggestions, setShowProyectoSuggestions] = useState(false);
  const proyectoSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const proyectoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        proyectoContainerRef.current &&
        !proyectoContainerRef.current.contains(event.target as Node)
      ) {
        setShowProyectoSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProyectoChange = (value: string) => {
    filters.updateFilters({ proyecto_nombre: value });

    if (proyectoSearchTimeout.current) {
      clearTimeout(proyectoSearchTimeout.current);
    }

    if (!value.trim()) {
      setProyectosSugeridos([]);
      setShowProyectoSuggestions(false);
      return;
    }

    proyectoSearchTimeout.current = setTimeout(async () => {
      try {
        const proyectos = await getIngestionProjects(value);
        setProyectosSugeridos(proyectos);
        setShowProyectoSuggestions(proyectos.length > 0);
      } catch (error) {
        console.error('Error al buscar proyectos:', error);
      }
    }, 300);
  };

  const handleProyectoSelect = (proyecto: Proyecto) => {
    filters.updateFilters({ proyecto_nombre: proyecto.nombre });
    setShowProyectoSuggestions(false);
  };

  const formatToLocalDateTimeInput = (value?: string) => {
    if (!value) return '';
    // Si el valor termina en Z, remover la Z y los milisegundos para mostrarlo tal cual
    // Esto mantiene la fecha/hora sin conversión de zona horaria
    return value.replace(/:\d{2}\.\d{3}Z$/, '').replace(/Z$/, '');
  };

  const normalizeFromLocalInput = (value: string) => {
    if (!value) return '';
    // Mantener la fecha/hora tal como el usuario la seleccionó, sin conversión de zona horaria
    // El input datetime-local devuelve formato "YYYY-MM-DDTHH:mm"
    // Solo agregamos los segundos y la Z para formato ISO sin cambiar la hora
    return value + ':00.000Z';
  };

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);

      const exportParams: HistorialPaginationParams = {};

      if (filters.filters.search) exportParams.search = filters.filters.search;
      if (filters.filters.usuario_nombre)
        exportParams.usuario_nombre = filters.filters.usuario_nombre;
      if (filters.filters.proyecto_nombre)
        exportParams.proyecto_nombre = filters.filters.proyecto_nombre;
      if (filters.filters.estado_enviado) {
        exportParams.estado_enviado = filters.filters.estado_enviado;
      }
      if (filters.filters.medio_url)
        exportParams.medio_url = filters.filters.medio_url;
      if (filters.filters.medio_url_coincide)
        exportParams.medio_url_coincide = filters.filters.medio_url_coincide;
      if (filters.filters.red_social_nombre) {
        exportParams.red_social_nombre = filters.filters.red_social_nombre;
      }
      if (filters.filters.created_at_desde)
        exportParams.created_at_desde = filters.filters.created_at_desde;
      if (filters.filters.created_at_hasta)
        exportParams.created_at_hasta = filters.filters.created_at_hasta;
      if (filters.filters.inicio_envio_desde)
        exportParams.inicio_envio_desde = filters.filters.inicio_envio_desde;
      if (filters.filters.fin_envio_hasta)
        exportParams.fin_envio_hasta = filters.filters.fin_envio_hasta;

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
                value={filters.filters.usuario_nombre || ''}
                onChange={(e) =>
                  filters.updateFilters({ usuario_nombre: e.target.value })
                }
                placeholder="Ej: tatiana"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="relative" ref={proyectoContainerRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proyecto
              </label>
              <input
                type="text"
                value={filters.filters.proyecto_nombre || ''}
                onChange={(e) => handleProyectoChange(e.target.value)}
                onFocus={() => {
                  if (
                    filters.filters.proyecto_nombre &&
                    proyectosSugeridos.length > 0
                  ) {
                    setShowProyectoSuggestions(true);
                  }
                }}
                placeholder="Buscar proyecto..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {showProyectoSuggestions && proyectosSugeridos.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {proyectosSugeridos.map((proyecto) => (
                    <button
                      key={proyecto.id}
                      type="button"
                      onClick={() => handleProyectoSelect(proyecto)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-700"
                    >
                      {proyecto.nombre}
                    </button>
                  ))}
                </div>
              )}
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
                <option value="ENVIADO">Enviado</option>
                <option value="FALLIDO">Fallido</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL exacta
              </label>
              <input
                type="text"
                value={filters.filters.medio_url || ''}
                onChange={(e) =>
                  filters.updateFilters({ medio_url: e.target.value })
                }
                placeholder="https://ejemplo.com/articulo/123 (URL completa)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL coincidencia
              </label>
              <input
                type="text"
                value={filters.filters.medio_url_coincide || ''}
                onChange={(e) =>
                  filters.updateFilters({
                    medio_url_coincide: e.target.value,
                  })
                }
                placeholder="ejemplo (busca en cualquier parte de la URL)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Red Social
              </label>
              <input
                type="text"
                value={filters.filters.red_social_nombre || ''}
                onChange={(e) =>
                  filters.updateFilters({
                    red_social_nombre: e.target.value,
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
                type="datetime-local"
                value={formatToLocalDateTimeInput(filters.filters.created_at_desde)}
                onChange={(e) =>
                  filters.updateFilters({
                    created_at_desde: normalizeFromLocalInput(e.target.value),
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
                type="datetime-local"
                value={formatToLocalDateTimeInput(filters.filters.created_at_hasta)}
                onChange={(e) =>
                  filters.updateFilters({
                    created_at_hasta: normalizeFromLocalInput(e.target.value),
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
                value={formatToLocalDateTimeInput(filters.filters.inicio_envio_desde)}
                onChange={(e) =>
                  filters.updateFilters({
                    inicio_envio_desde: normalizeFromLocalInput(e.target.value),
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
                value={formatToLocalDateTimeInput(filters.filters.fin_envio_hasta)}
                onChange={(e) =>
                  filters.updateFilters({
                    fin_envio_hasta: normalizeFromLocalInput(e.target.value),
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
