import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface MediosFilters {
  proyecto?: string;
  nombre?: string;
  tipo?: string;
}

interface RedesFilters {
  proyecto?: string;
  autor?: string;
  url?: string;
}

export type Filters = MediosFilters | RedesFilters;

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
      Object.entries(updatedFilters).filter(
        ([_, value]) => typeof value === 'string' && value.trim() !== ''
      )
    ) as unknown as T;

    setFilters(cleanFilters);

    const newSearchParams = new URLSearchParams();
    Object.entries(cleanFilters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
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
    return Object.values(filters).some((value) => value && value.trim() !== '');
  };

  return {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  };
};

export default useUrlFilters;
