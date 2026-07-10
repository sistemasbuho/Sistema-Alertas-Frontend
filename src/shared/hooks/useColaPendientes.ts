import { useState, useEffect, useCallback } from 'react';
import { getColaExcepcionesResumen } from '@shared/services/api';

const REFRESH_INTERVAL_MS = 60_000;

export const useColaPendientes = () => {
  const [pendientes, setPendientes] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchResumen = useCallback(async () => {
    try {
      const resumen = await getColaExcepcionesResumen();
      setPendientes(resumen.pendientes || 0);
    } catch (error) {
      console.error('Error obteniendo pendientes de la cola:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumen();
    const interval = setInterval(fetchResumen, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchResumen]);

  return { pendientes, loading, refetch: fetchResumen };
};

export default useColaPendientes;
