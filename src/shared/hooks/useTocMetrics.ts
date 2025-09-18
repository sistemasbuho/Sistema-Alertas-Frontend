import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  initializeTocMetrics,
  shutdownTocMetrics,
  trackPageNavigation,
} from '@shared/services/tocMetrics';

const useTocMetrics = (): void => {
  const location = useLocation();
  const fullPath = `${location.pathname}${location.search}`;
  const initialPathRef = useRef<string | null>(null);

  useEffect(() => {
    const resolvedInitialPath =
      initialPathRef.current ??
      (typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : '/');

    initialPathRef.current = resolvedInitialPath;
    initializeTocMetrics(resolvedInitialPath);

    return () => {
      shutdownTocMetrics({ flush: false });
    };
  }, []);

  useEffect(() => {
    trackPageNavigation(fullPath);
  }, [fullPath]);
};

export default useTocMetrics;
