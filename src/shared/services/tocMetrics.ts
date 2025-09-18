declare global {
  interface Window {
    __REQ_ID__?: string;
  }
}

const DEFAULT_PING_INTERVAL = 30_000;

const rawBaseUrl = (
  (import.meta.env.VITE_TOC_BASE_URL as string | undefined) ??
  (import.meta.env.VITE_TOC_PROXY_URL as string | undefined) ??
  ''
).trim();

const rawPlatformId = (
  (import.meta.env.VITE_TOC_PLATFORM_ID as string | undefined) ??
  (import.meta.env.VITE_TOC_PLATAFORMA_ID as string | undefined) ??
  (import.meta.env.VITE_PLATAFORMA_ID as string | undefined)
)?.trim();

const rawPingInterval = (
  import.meta.env.VITE_TOC_PING_INTERVAL_MS as string | undefined
)?.trim();

const sanitizeBaseUrl = (base: string): string => {
  if (!base) {
    return '';
  }
  return base.replace(/\/+$/, '');
};

const joinUrl = (base: string, path: string): string => {
  const normalizedBase = sanitizeBaseUrl(base);
  const normalizedPath = path.replace(/^\/+/, '');

  if (!normalizedBase) {
    return `/${normalizedPath}`;
  }

  return `${normalizedBase}/${normalizedPath}`;
};

const parseNumericEnv = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const TOC_BASE_URL = sanitizeBaseUrl(rawBaseUrl);
const FRONTEND_PINGS_ENDPOINT = joinUrl(TOC_BASE_URL, 'metricas/frontend-pings');
const PAGE_VIEWS_ENDPOINT = joinUrl(TOC_BASE_URL, 'metricas/page-views');

const PLATFORM_ID = parseNumericEnv(rawPlatformId, 1);
const PING_INTERVAL_MS = parseNumericEnv(rawPingInterval, DEFAULT_PING_INTERVAL);

type VisibilityState = 'visible' | 'hidden';

type PingPayload = {
  user_email: string | null;
  plataforma_id: number;
  timestamp: string;
  visibility_state: VisibilityState;
  activity_state: 'active';
  correlation_id: string;
  properties: {
    path: string;
  };
};

type PageViewPayload = {
  user_email: string | null;
  plataforma_id: number;
  page: string;
  referrer: string | null;
  started_at: string;
  ended_at: string;
  correlation_id: string;
  viewport: {
    w: number;
    h: number;
    dpr: number;
  };
  user_agent: string;
};

type MetricsState = {
  initialized: boolean;
  pingTimerId: number | null;
  currentPage: string | null;
  startedAt: string | null;
  hiddenPingSent: boolean;
};

const metricsState: MetricsState = {
  initialized: false,
  pingTimerId: null,
  currentPage: null,
  startedAt: null,
  hiddenPingSent: false,
};

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

const ensureCorrelationId = (): string => {
  if (!isBrowser) {
    return '';
  }

  if (!window.__REQ_ID__) {
    const hasRandomUUID = typeof crypto !== 'undefined' && 'randomUUID' in crypto;
    window.__REQ_ID__ = hasRandomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  return window.__REQ_ID__ as string;
};

const getUserEmail = (): string | null => {
  if (!isBrowser) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem('auth_user_data');
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === 'string') {
      return parsed.email;
    }
  } catch (error) {
    console.warn('No fue posible obtener el email del usuario para métricas.', error);
  }

  return null;
};

const getCurrentPath = (): string => {
  if (!isBrowser) {
    return '';
  }

  return `${window.location.pathname}${window.location.search}`;
};

const sendNonBlocking = (endpoint: string, payload: PingPayload | PageViewPayload): void => {
  if (!isBrowser || !endpoint) {
    return;
  }

  const body = JSON.stringify(payload);
  let beaconSent = false;

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([body], { type: 'application/json' });
      beaconSent = navigator.sendBeacon(endpoint, blob);
    } catch (error) {
      console.warn('Error enviando métrica con sendBeacon, se intentará con fetch.', error);
    }
  }

  if (!beaconSent) {
    try {
      void fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
        keepalive: true,
      });
    } catch (error) {
      console.warn('Error enviando métrica con fetch.', error);
    }
  }
};

const sendPing = (visibility: VisibilityState): void => {
  if (!isBrowser || !FRONTEND_PINGS_ENDPOINT) {
    return;
  }

  const payload: PingPayload = {
    user_email: getUserEmail(),
    plataforma_id: PLATFORM_ID,
    timestamp: new Date().toISOString(),
    visibility_state: visibility,
    activity_state: 'active',
    correlation_id: ensureCorrelationId(),
    properties: {
      path: metricsState.currentPage ?? getCurrentPath(),
    },
  };

  sendNonBlocking(FRONTEND_PINGS_ENDPOINT, payload);
  metricsState.hiddenPingSent = visibility === 'hidden';
};

const sendPageView = (
  page: string,
  startedAt: string,
  endedAt: string
): void => {
  if (!isBrowser || !PAGE_VIEWS_ENDPOINT) {
    return;
  }

  const payload: PageViewPayload = {
    user_email: getUserEmail(),
    plataforma_id: PLATFORM_ID,
    page,
    referrer: document.referrer || null,
    started_at: startedAt,
    ended_at: endedAt,
    correlation_id: ensureCorrelationId(),
    viewport: {
      w: window.innerWidth,
      h: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    },
    user_agent: navigator.userAgent,
  };

  sendNonBlocking(PAGE_VIEWS_ENDPOINT, payload);
};

const completeCurrentPageView = (endedAt: string, resetAfterSend: boolean): void => {
  if (!metricsState.currentPage || !metricsState.startedAt) {
    return;
  }

  sendPageView(metricsState.currentPage, metricsState.startedAt, endedAt);

  if (resetAfterSend) {
    metricsState.currentPage = null;
    metricsState.startedAt = null;
  }
};

const startPageView = (path: string, startedAt?: string): void => {
  metricsState.currentPage = path;
  metricsState.startedAt = startedAt ?? new Date().toISOString();
};

const handleHiddenEvent = (): void => {
  if (!metricsState.initialized || !isBrowser || metricsState.hiddenPingSent) {
    return;
  }

  sendPing('hidden');
  completeCurrentPageView(new Date().toISOString(), true);
  metricsState.hiddenPingSent = true;
};

const handleVisibilityChange = (): void => {
  if (!metricsState.initialized || !isBrowser) {
    return;
  }

  if (document.visibilityState === 'hidden') {
    handleHiddenEvent();
    return;
  }

  metricsState.hiddenPingSent = false;
  startPageView(getCurrentPath());
  sendPing('visible');
};

const handlePageHide = (): void => {
  handleHiddenEvent();
};

const startPingTimer = (): void => {
  if (!isBrowser || metricsState.pingTimerId !== null) {
    return;
  }

  metricsState.pingTimerId = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      sendPing('visible');
    }
  }, Number.isFinite(PING_INTERVAL_MS) && PING_INTERVAL_MS > 0 ? PING_INTERVAL_MS : DEFAULT_PING_INTERVAL);
};

const stopPingTimer = (): void => {
  if (!isBrowser || metricsState.pingTimerId === null) {
    return;
  }

  window.clearInterval(metricsState.pingTimerId);
  metricsState.pingTimerId = null;
};

export const initializeTocMetrics = (initialPath: string): void => {
  if (!isBrowser || metricsState.initialized) {
    return;
  }

  ensureCorrelationId();

  startPageView(initialPath, new Date().toISOString());
  metricsState.hiddenPingSent = document.visibilityState !== 'visible';

  window.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);

  startPingTimer();
  metricsState.initialized = true;
};

export const trackPageNavigation = (path: string): void => {
  if (!isBrowser) {
    return;
  }

  if (!metricsState.initialized) {
    startPageView(path, new Date().toISOString());
    return;
  }

  if (!metricsState.currentPage) {
    startPageView(path, new Date().toISOString());
    return;
  }

  if (metricsState.currentPage === path) {
    return;
  }

  const now = new Date().toISOString();
  completeCurrentPageView(now, false);
  startPageView(path, now);
};

export const shutdownTocMetrics = (options?: { flush?: boolean }): void => {
  if (!isBrowser || !metricsState.initialized) {
    return;
  }

  const shouldFlush = options?.flush ?? true;

  window.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('pagehide', handlePageHide);

  stopPingTimer();

  if (shouldFlush) {
    completeCurrentPageView(new Date().toISOString(), true);
  } else {
    metricsState.currentPage = null;
    metricsState.startedAt = null;
  }

  metricsState.initialized = false;
  metricsState.hiddenPingSent = false;
};
