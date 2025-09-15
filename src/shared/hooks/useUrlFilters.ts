import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface MediosFilters {
  proyecto?: string;
  autor?: string;
  url?: string;
  estado_enviado?: string;
}

interface RedesFilters {
  proyecto?: string;
  autor?: string;
  url?: string;
  estado_enviado?: string;
}

interface ProyectoFilters {
  nombre?: string;
}

export type Filters = MediosFilters | RedesFilters | ProyectoFilters;

export const useUrlFilters = <T extends Filters>(initialFilters: T) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<T>(initialFilters);

  useEffect(() => {
    const urlFilters = {} as T;

    for (const [key, value] of searchParams.entries()) {
      if (value) {
        (urlFilters as Record<string, string>)[key] = value;
      }
    }

    const combinedFilters = { ...initialFilters, ...urlFilters };
    setFilters(combinedFilters);
  }, []);

  const updateFilters = (newFilters: Partial<T>) => {
    const updatedFilters = { ...filters, ...newFilters };

    const cleanFilters = Object.fromEntries(
      Object.entries(updatedFilters).filter(([key, value]) => {
        if (key === 'estado_enviado') {
          return value !== undefined;
        }
        return typeof value === 'string' && value.trim() !== '';
      })
    ) as unknown as T;

    setFilters(cleanFilters);

    const newSearchParams = new URLSearchParams();
    Object.entries(cleanFilters).forEach(([key, value]) => {
      if (key === 'estado_enviado' || (value && value.trim() !== '')) {
        newSearchParams.set(key, value);
      }
    });

    setSearchParams(newSearchParams);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setSearchParams({});
  };

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'estado_enviado') {
        return value !== 'true';
      }
      return value && value.trim() !== '';
    });
  };

  return {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  };
};

export default useUrlFilters;
