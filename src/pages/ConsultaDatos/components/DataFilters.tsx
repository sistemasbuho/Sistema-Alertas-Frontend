import React, { useState, useEffect, useRef } from 'react';
import Button from '@shared/components/ui/Button';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getIngestionProjects, Proyecto } from '@shared/services/api';

type TabType = 'medios' | 'redes';

interface FilterState {
  filters: {
    usuario_nombre?: string;
    proyecto_nombre?: string;
    autor?: string;
    url?: string;
    url_coincide?: string;
    estado_enviado?: string;
    estado_revisado?: string;
    red_social_nombre?: string;
    created_at_desde?: string;
    created_at_hasta?: string;
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

const redesSocialesComunes = [
  'Twitter',
  'Facebook',
  'Instagram',
  'LinkedIn',
  'TikTok',
  'YouTube',
  'WhatsApp',
  'Telegram',
  'Reddit',
  'Snapchat',
];

const DataFilters: React.FC<DataFiltersProps> = ({
  activeTab,
  mediosFilters,
  redesFilters,
}) => {
  const [proyectosMedios, setProyectosMedios] = useState<Proyecto[]>([]);
  const [proyectosRedes, setProyectosRedes] = useState<Proyecto[]>([]);
  const [showSuggestionsMedios, setShowSuggestionsMedios] = useState(false);
  const [showSuggestionsRedes, setShowSuggestionsRedes] = useState(false);
  const [redesSocialesFiltradas, setRedesSocialesFiltradas] = useState<string[]>([]);
  const [showSuggestionsRedSocial, setShowSuggestionsRedSocial] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionsRefMedios = useRef<HTMLDivElement>(null);
  const suggestionsRefRedes = useRef<HTMLDivElement>(null);
  const suggestionsRefRedSocial = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRefMedios.current &&
        !suggestionsRefMedios.current.contains(event.target as Node)
      ) {
        setShowSuggestionsMedios(false);
      }
      if (
        suggestionsRefRedes.current &&
        !suggestionsRefRedes.current.contains(event.target as Node)
      ) {
        setShowSuggestionsRedes(false);
      }
      if (
        suggestionsRefRedSocial.current &&
        !suggestionsRefRedSocial.current.contains(event.target as Node)
      ) {
        setShowSuggestionsRedSocial(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchProyectos = async (nombre: string, forTab: 'medios' | 'redes') => {
    if (nombre.trim().length < 2) {
      if (forTab === 'medios') {
        setProyectosMedios([]);
        setShowSuggestionsMedios(false);
      } else {
        setProyectosRedes([]);
        setShowSuggestionsRedes(false);
      }
      return;
    }

    try {
      const data = await getIngestionProjects(nombre);
      if (forTab === 'medios') {
        setProyectosMedios(data);
        setShowSuggestionsMedios(data.length > 0);
      } else {
        setProyectosRedes(data);
        setShowSuggestionsRedes(data.length > 0);
      }
    } catch (error) {
      console.error('Error al buscar proyectos:', error);
    }
  };

  const handleProyectoChange = (value: string, forTab: 'medios' | 'redes') => {
    if (forTab === 'medios') {
      mediosFilters.updateFilters({ proyecto_nombre: value });
    } else {
      redesFilters.updateFilters({ proyecto_nombre: value });
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchProyectos(value, forTab);
    }, 300);
  };

  const handleProyectoSelect = (proyecto: Proyecto, forTab: 'medios' | 'redes') => {
    if (forTab === 'medios') {
      mediosFilters.updateFilters({ proyecto_nombre: proyecto.nombre });
      setShowSuggestionsMedios(false);
    } else {
      redesFilters.updateFilters({ proyecto_nombre: proyecto.nombre });
      setShowSuggestionsRedes(false);
    }
  };

  const handleRedSocialChange = (value: string) => {
    redesFilters.updateFilters({ red_social_nombre: value });

    if (value.trim().length === 0) {
      setRedesSocialesFiltradas([]);
      setShowSuggestionsRedSocial(false);
      return;
    }

    const filtradas = redesSocialesComunes.filter((red) =>
      red.toLowerCase().includes(value.toLowerCase())
    );
    setRedesSocialesFiltradas(filtradas);
    setShowSuggestionsRedSocial(filtradas.length > 0);
  };

  const handleRedSocialSelect = (redSocial: string) => {
    redesFilters.updateFilters({ red_social_nombre: redSocial });
    setShowSuggestionsRedSocial(false);
  };

  const parseCreatedAtRange = (
    value: string
  ): { created_at_desde: string; created_at_hasta: string } => {
    const [desdeRaw = '', hastaRaw = ''] = value.split(' - ').map((part) => part.trim());
    return {
      created_at_desde: desdeRaw,
      created_at_hasta: hastaRaw,
    };
  };

  const normalizeDateTimeUTC = (value: string) => {
    const trimmed = value?.trim();
    if (!trimmed) return '';

    const normalizeWithoutZone = (val: string) => {
      if (!val) return '';
      const [datePart = '', timePartRaw = ''] = val.split('T');
      if (!datePart) return '';

      let timePart: string = timePartRaw ?? '';
      if (!timePart) {
        timePart = '00:00:00';
      } else if (/^\d{2}:\d{2}$/.test(timePart)) {
        timePart = `${timePart}:00`;
      } else if (/^\d{2}:\d{2}:\d{2}\.\d+/.test(timePart)) {
        timePart = timePart.split('.')[0];
      }

      return `${datePart}T${timePart}`;
    };

    if (trimmed.endsWith('Z')) {
      const withoutZ = trimmed.slice(0, -1);
      const normalized = normalizeWithoutZone(withoutZ);
      return normalized ? `${normalized}Z` : trimmed;
    }

    const basicRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?)?$/;
    if (!basicRegex.test(trimmed)) return trimmed;

    const normalized = normalizeWithoutZone(trimmed);
    return normalized ? `${normalized}Z` : trimmed;
  };

  const formatCreatedAtRange = (desde?: string, hasta?: string) => {
    if (!desde && !hasta) return '';
    if (desde && hasta) return `${desde} - ${hasta}`;
    return desde || hasta || '';
  };

  const handleCreatedAtRangeChange = (value: string, forTab: 'medios' | 'redes') => {
    const rangeValues = parseCreatedAtRange(value);
    const normalizedRange = {
      created_at_desde: normalizeDateTimeUTC(rangeValues.created_at_desde),
      created_at_hasta: normalizeDateTimeUTC(rangeValues.created_at_hasta),
    };
    if (forTab === 'medios') {
      mediosFilters.updateFilters(normalizedRange);
    } else {
      redesFilters.updateFilters(normalizedRange);
    }
  };

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
                Usuario
              </label>
              <input
                type="text"
                value={mediosFilters.filters.usuario_nombre || ''}
                onChange={(e) =>
                  mediosFilters.updateFilters({
                    usuario_nombre: e.target.value,
                  })
                }
                placeholder="Ej: tatiana"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="relative" ref={suggestionsRefMedios}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proyecto
              </label>
              <input
                type="text"
                value={mediosFilters.filters.proyecto_nombre || ''}
                onChange={(e) => handleProyectoChange(e.target.value, 'medios')}
                onFocus={() => {
                  if (mediosFilters.filters.proyecto_nombre && proyectosMedios.length > 0) {
                    setShowSuggestionsMedios(true);
                  }
                }}
                placeholder="Buscar proyecto..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {showSuggestionsMedios && proyectosMedios.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {proyectosMedios.map((proyecto) => (
                    <div
                      key={proyecto.id}
                      onClick={() => handleProyectoSelect(proyecto, 'medios')}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white"
                    >
                      {proyecto.nombre}
                    </div>
                  ))}
                </div>
              )}
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
                URL exacta
              </label>
              <input
                type="text"
                value={mediosFilters.filters.url || ''}
                onChange={(e) =>
                  mediosFilters.updateFilters({
                    url: e.target.value,
                  })
                }
                placeholder="https://eltiempo.com/noticia/123 (busca URL completa)"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL coincidencia
              </label>
              <input
                type="text"
                value={mediosFilters.filters.url_coincide || ''}
                onChange={(e) =>
                  mediosFilters.updateFilters({
                    url_coincide: e.target.value,
                  })
                }
                placeholder="ejemplo (busca en cualquier parte de la URL)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rango Fecha Creación
              </label>
              <input
                type="text"
                value={formatCreatedAtRange(
                  mediosFilters.filters.created_at_desde,
                  mediosFilters.filters.created_at_hasta
                )}
                onChange={(e) => handleCreatedAtRangeChange(e.target.value, 'medios')}
                placeholder="2024-05-01T00:00:00Z - 2024-05-31T23:59:59Z"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={redesFilters.filters.usuario_nombre || ''}
                onChange={(e) =>
                  redesFilters.updateFilters({
                    usuario_nombre: e.target.value,
                  })
                }
                placeholder="Ej: tatiana"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="relative" ref={suggestionsRefRedes}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proyecto
              </label>
              <input
                type="text"
                value={redesFilters.filters.proyecto_nombre || ''}
                onChange={(e) => handleProyectoChange(e.target.value, 'redes')}
                onFocus={() => {
                  if (redesFilters.filters.proyecto_nombre && proyectosRedes.length > 0) {
                    setShowSuggestionsRedes(true);
                  }
                }}
                placeholder="Buscar proyecto..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {showSuggestionsRedes && proyectosRedes.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {proyectosRedes.map((proyecto) => (
                    <div
                      key={proyecto.id}
                      onClick={() => handleProyectoSelect(proyecto, 'redes')}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white"
                    >
                      {proyecto.nombre}
                    </div>
                  ))}
                </div>
              )}
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
                URL exacta
              </label>
              <input
                type="text"
                value={redesFilters.filters.url || ''}
                onChange={(e) =>
                  redesFilters.updateFilters({
                    url: e.target.value,
                  })
                }
                placeholder="https://twitter.com/post/123 (busca URL completa)"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL coincidencia
              </label>
              <input
                type="text"
                value={redesFilters.filters.url_coincide || ''}
                onChange={(e) =>
                  redesFilters.updateFilters({
                    url_coincide: e.target.value,
                  })
                }
                placeholder="twitter (busca en cualquier parte de la URL)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="relative" ref={suggestionsRefRedSocial}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Red Social
              </label>
              <input
                type="text"
                value={redesFilters.filters.red_social_nombre || ''}
                onChange={(e) => handleRedSocialChange(e.target.value)}
                onFocus={() => {
                  if (redesFilters.filters.red_social_nombre && redesSocialesFiltradas.length > 0) {
                    setShowSuggestionsRedSocial(true);
                  }
                }}
                placeholder="Twitter, Facebook, Instagram..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {showSuggestionsRedSocial && redesSocialesFiltradas.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {redesSocialesFiltradas.map((redSocial) => (
                    <div
                      key={redSocial}
                      onClick={() => handleRedSocialSelect(redSocial)}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white"
                    >
                      {redSocial}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rango Fecha Creación
              </label>
              <input
                type="text"
                value={formatCreatedAtRange(
                  redesFilters.filters.created_at_desde,
                  redesFilters.filters.created_at_hasta
                )}
                onChange={(e) => handleCreatedAtRangeChange(e.target.value, 'redes')}
                placeholder="2024-05-01T00:00:00Z - 2024-05-31T23:59:59Z"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DataFilters;
