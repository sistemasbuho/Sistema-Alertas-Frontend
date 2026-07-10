import React, { useState, useEffect, useRef } from 'react';
import Button from '@shared/components/ui/Button';
import { getProyectosList, type Proyecto } from '@shared/services/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface ColaFiltersValues {
  proyecto: string;
  proyecto_nombre: string;
  tipo: string;
  tonalidad: string;
  confianza_max: string;
}

interface ExcepcionesFiltersProps {
  filters: ColaFiltersValues;
  onChange: (filters: Partial<ColaFiltersValues>) => void;
  onClear: () => void;
  totalCount: number;
}

const TONALIDADES = ['positivo', 'neutral', 'negativo'];

const ExcepcionesFilters: React.FC<ExcepcionesFiltersProps> = ({
  filters,
  onChange,
  onClear,
  totalCount,
}) => {
  const [proyectoQuery, setProyectoQuery] = useState(
    filters.proyecto_nombre || ''
  );
  const [suggestions, setSuggestions] = useState<Proyecto[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const query = proyectoQuery.trim();
    if (!query || query === filters.proyecto_nombre) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await getProyectosList({
          nombre: query,
          page_size: 10,
        });
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error buscando proyectos:', error);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [proyectoQuery, filters.proyecto_nombre]);

  const handleSelectProyecto = (proyecto: Proyecto) => {
    setProyectoQuery(proyecto.nombre);
    setShowSuggestions(false);
    setSuggestions([]);
    onChange({ proyecto: proyecto.id, proyecto_nombre: proyecto.nombre });
  };

  const handleClearProyecto = () => {
    setProyectoQuery('');
    onChange({ proyecto: '', proyecto_nombre: '' });
  };

  const hasActive =
    !!filters.proyecto ||
    !!filters.tipo ||
    !!filters.tonalidad ||
    !!filters.confianza_max;

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Proyecto
          </label>
          <div className="relative">
            <input
              type="text"
              value={proyectoQuery}
              onChange={(e) => setProyectoQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Buscar proyecto..."
              className={inputClass}
            />
            {filters.proyecto && (
              <button
                onClick={handleClearProyecto}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Quitar proyecto"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-56 overflow-y-auto">
              {suggestions.map((proyecto) => (
                <li key={proyecto.id}>
                  <button
                    onClick={() => handleSelectProyecto(proyecto)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {proyecto.nombre}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo
          </label>
          <select
            value={filters.tipo}
            onChange={(e) => onChange({ tipo: e.target.value })}
            className={inputClass}
          >
            <option value="">Todos</option>
            <option value="medios">Medios</option>
            <option value="redes">Redes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tonalidad
          </label>
          <select
            value={filters.tonalidad}
            onChange={(e) => onChange({ tonalidad: e.target.value })}
            className={inputClass}
          >
            <option value="">Todas</option>
            {TONALIDADES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confianza máxima:{' '}
            {filters.confianza_max ? `${filters.confianza_max}%` : '—'}
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.confianza_max ? Number(filters.confianza_max) : 100}
            onChange={(e) =>
              onChange({
                confianza_max:
                  e.target.value === '100' ? '' : e.target.value,
              })
            }
            className="w-full mt-2 accent-blue-600"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {totalCount} alerta{totalCount !== 1 ? 's' : ''} en cola
        </span>
        {hasActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setProyectoQuery('');
              onClear();
            }}
            className="inline-flex items-center gap-1"
          >
            <XMarkIcon className="h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExcepcionesFilters;
