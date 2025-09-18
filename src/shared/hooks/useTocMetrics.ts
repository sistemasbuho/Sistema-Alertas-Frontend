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
  const initialPathRef = useRef(fullPath);

  useEffect(() => {
    initializeTocMetrics(initialPathRef.current);

    return () => {
      shutdownTocMetrics({ flush: false });
    };
  }, []);

  useEffect(() => {
    trackPageNavigation(fullPath);
  }, [fullPath]);
};

export default useTocMetrics;
