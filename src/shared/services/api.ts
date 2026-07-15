import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://api.alertas.buho.media';

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  expires_at?: number;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_superuser: boolean;
  is_staff: boolean;
}

export interface Proyecto {
  id: string;
  nombre: string;
  proveedor?: string;
  codigo_acceso: string;
  nombre_grupo?: string;
  estado: 'activo' | 'inactivo' | 'completado';
  tipo_envio: 'manual' | 'automatico' | 'medios';
  tipo_alerta: string;
  formato_mensaje: string;
  keywords: string | null;
  criterios_aceptacion?: string | null;
  created_at: string;
  modified_at: string;
}

export interface HistorialEnvio {
  id: string;
  usuario?: string;
  proyecto: string;
  mensaje: string | null;
  created_at: string;
  inicio_envio: string | null;
  fin_envio: string | null;
  tiempo_envio: number | null;
  estado_enviado: boolean;
  red_social: any | null;
  estado_pipeline?: string | null;
  proveedor_envio?: string | null;
  origen_envio?: 'auto_ia' | 'humano' | null;
  evaluacion_ia_id?: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  ordering?: string;
  nombre?: string;
}

export interface HistorialPaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  usuario_nombre?: string;
  proyecto_nombre?: string;
  estado_enviado?: string;
  medio_url?: string;
  medio_url_coincide?: string;
  red_social_nombre?: string;
  created_at_desde?: string;
  created_at_hasta?: string;
  inicio_envio_desde?: string;
  fin_envio_hasta?: string;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  async (config) => {
    config.headers = config.headers ?? {};
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let navigationFunction: ((path: string) => void) | null = null;
let isRedirecting = false;

export const setNavigationFunction = (navigate: (path: string) => void) => {
  navigationFunction = navigate;
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login')
      ) {
        if (!isRedirecting) {
          isRedirecting = true;
          console.warn('🔒 Sesión expirada. Redirigiendo al login...');

          clearTokens();
          localStorage.removeItem(AUTH_KEYS.USER_DATA);

          if (navigationFunction) {
            try {
              navigationFunction('/login');
            } catch {
              console.log('React navigation failed, using window.location');
              window.location.href = '/login';
            }
          } else {
            window.location.href = '/login';
          }

          setTimeout(() => {
            isRedirecting = false;
          }, 500);
        }
      }
    }

    return Promise.reject(error);
  }
);

const AUTH_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER_DATA: 'auth_user_data',
  EXPIRES_AT: 'auth_expires_at',
} as const;

export const setTokens = (tokens: AuthTokens): void => {
  const expiresAt = tokens.expires_at || Date.now() + 60 * 60 * 1000;

  localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, tokens.access);
  localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, tokens.refresh);
  localStorage.setItem(AUTH_KEYS.EXPIRES_AT, expiresAt.toString());

  Cookies.set(AUTH_KEYS.ACCESS_TOKEN, tokens.access, {
    expires: 7,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
  });
  Cookies.set(AUTH_KEYS.REFRESH_TOKEN, tokens.refresh, {
    expires: 30,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
  });
};

export const getAccessToken = (): string | null => {
  return (
    localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN) ||
    Cookies.get(AUTH_KEYS.ACCESS_TOKEN) ||
    null
  );
};

export const getRefreshToken = (): string | null => {
  return (
    localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN) ||
    Cookies.get(AUTH_KEYS.REFRESH_TOKEN) ||
    null
  );
};

export const getTokenExpirationTime = (): number | null => {
  const expiresAt = localStorage.getItem(AUTH_KEYS.EXPIRES_AT);
  return expiresAt ? parseInt(expiresAt, 10) : null;
};

export const isTokenExpired = (): boolean => {
  const expiresAt = getTokenExpirationTime();
  if (!expiresAt) return true;
  return Date.now() >= expiresAt - 5 * 60 * 1000;
};

export const clearTokens = (): void => {
  Object.values(AUTH_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });

  Object.values(AUTH_KEYS).forEach((key) => {
    Cookies.remove(key);
  });
};

export const setUserData = (
  user: Omit<AuthResponse, 'access' | 'refresh'>
): void => {
  localStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(user));
};

export const getUserData = (): Omit<
  AuthResponse,
  'access' | 'refresh'
> | null => {
  const userData = localStorage.getItem(AUTH_KEYS.USER_DATA);
  return userData ? JSON.parse(userData) : null;
};

export const isAuthenticated = (): boolean => {
  const accessToken = getAccessToken();
  return !!accessToken;
};

export const setToken = (token: string): void => {
  setTokens({ access: token, refresh: token });
};

export const getToken = (): string | undefined => {
  return getAccessToken() || undefined;
};

export const removeToken = (): void => {
  clearTokens();
};

let refreshPromise: Promise<void> | null = null;

export const refreshTokens = async (): Promise<void> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, {
        refresh: refreshToken,
      });

      if (response.data.access) {
        const newTokens: AuthTokens = {
          access: response.data.access,
          refresh: response.data.refresh || refreshToken,
          expires_at: Date.now() + 60 * 60 * 1000,
        };

        setTokens(newTokens);
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const get = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await apiClient.get(url, config);
  return response.data;
};

export const post = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await apiClient.post(url, data, config);
  return response.data;
};

export const put = async <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await apiClient.put(url, data, config);
  return response.data;
};

export const del = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await apiClient.delete(url, config);
  return response.data;
};

export const loginWithGoogle = async (
  googleCredential: any
): Promise<AuthResponse> => {
  try {
    const decodedToken = JSON.parse(
      atob(googleCredential.credential.split('.')[1])
    );
    const email = decodedToken.email;

    const response = await post<any>('/api/auth/google/', {
      jwt_google: googleCredential.credential,
      email: email,
    });

    let authData;
    if (response.success && response.data) {
      authData = response.data;
    } else if ((response as any).access) {
      authData = response;
    } else {
      throw new Error('Respuesta inválida del servidor');
    }

    const token = authData.access || authData.token || authData.access_token;
    if (!token) {
      throw new Error('No se recibió token de autenticación');
    }

    const tokens: AuthTokens = {
      access: authData.access || token,
      refresh: authData.refresh || token,
      expires_at: Date.now() + 60 * 60 * 1000,
    };

    setTokens(tokens);

    const userData = {
      id: authData.id,
      email: authData.email,
      first_name: authData.first_name,
      last_name: authData.last_name,
      is_superuser: authData.is_superuser,
      is_staff: authData.is_staff,
    };

    setUserData(userData);

    const authResponse: AuthResponse = {
      access: authData.access,
      refresh: authData.refresh,
      id: authData.id,
      email: authData.email,
      first_name: authData.first_name,
      last_name: authData.last_name,
      is_superuser: authData.is_superuser,
      is_staff: authData.is_staff,
    };

    return authResponse;
  } catch (error) {
    console.error('Error procesando login de Google:', error);
    throw new Error('Error al procesar la información de Google');
  }
};

export const logout = async (): Promise<void> => {
  try {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await post('/api/auth/logout/', { refresh: refreshToken });
    }
  } catch (error) {
    console.error('Error en logout:', error);
  } finally {
    clearTokens();
  }
};

export const getProyectos = async (
  params?: PaginationParams
): Promise<PaginatedResponse<Proyecto>> => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.page_size) {
      queryParams.append('page_size', params.page_size.toString());
    }
    if (params?.ordering) {
      queryParams.append('ordering', params.ordering);
    }
    if (params?.nombre) {
      queryParams.append('nombre', params.nombre);
    }

    const url = `/api/proyectos/${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo proyectos:', error);
    throw error;
  }
};

export const getProyectosList = async (
  params?: PaginationParams
): Promise<Proyecto[]> => {
  const response = await getProyectos(params);
  return response.results;
};

export const getIngestionProjects = async (
  nombre: string,
  pageSize = 20
): Promise<Proyecto[]> => {
  const trimmedName = nombre.trim();

  if (!trimmedName) {
    return [];
  }

  try {
    const response = await getProyectos({
      nombre: trimmedName,
      page_size: pageSize,
    });
    return response.results;
  } catch (error) {
    console.error('Error obteniendo proyectos para ingestión:', error);
    throw error;
  }
};

const buildIngestionEndpoint = (proyectoId: string) =>
  `/api/ingestion/?proyecto=${encodeURIComponent(proyectoId)}`;

export const uploadIngestionDocument = async (
  proyectoId: string,
  file: File
): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('proyecto_id', proyectoId);

  const defaultHeaders = apiClient.defaults.headers.common;
  const hadContentType =
    !!defaultHeaders &&
    Object.prototype.hasOwnProperty.call(defaultHeaders, 'Content-Type');
  const previousContentType = hadContentType
    ? defaultHeaders['Content-Type']
    : undefined;

  try {
    if (hadContentType) {
      delete defaultHeaders['Content-Type'];
    }

    const response = await apiClient.post(
      buildIngestionEndpoint(proyectoId),
      formData
    );

    return response.data;
  } catch (error) {
    console.error('Error subiendo documento de ingestión:', error);
    throw error;
  } finally {
    if (hadContentType) {
      defaultHeaders['Content-Type'] = previousContentType;
    }
  }
};

export const uploadMultipleIngestionDocuments = async (
  proyectoId: string,
  files: File[]
): Promise<any> => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });
  formData.append('proyecto_id', proyectoId);

  const defaultHeaders = apiClient.defaults.headers.common;
  const hadContentType =
    !!defaultHeaders &&
    Object.prototype.hasOwnProperty.call(defaultHeaders, 'Content-Type');
  const previousContentType = hadContentType
    ? defaultHeaders['Content-Type']
    : undefined;

  try {
    if (hadContentType) {
      delete defaultHeaders['Content-Type'];
    }

    const response = await apiClient.post(
      buildIngestionEndpoint(proyectoId),
      formData
    );

    return response.data;
  } catch (error) {
    console.error('Error subiendo múltiples documentos de ingestión:', error);
    throw error;
  } finally {
    if (hadContentType) {
      defaultHeaders['Content-Type'] = previousContentType;
    }
  }
};

export const uploadIngestionDocumentsInParallel = async (
  proyectoId: string,
  files: File[]
): Promise<
  Array<{ file: string; response?: any; error?: any; success: boolean }>
> => {
  const uploadPromises = files.map(async (file) => {
    try {
      const response = await uploadIngestionDocument(proyectoId, file);
      return { file: file.name, response, success: true };
    } catch (error) {
      return { file: file.name, error, success: false };
    }
  });

  return Promise.all(uploadPromises);
};

export const triggerManualIngestion = async (
  proyectoId: string,
  url: string
): Promise<any> => {
  try {
    const payload = {
      proyecto_id: proyectoId,
      url,
    };

    const response = await apiClient.post(
      buildIngestionEndpoint(proyectoId),
      payload
    );

    return response.data;
  } catch (error) {
    console.error('Error iniciando ingestión manual:', error);
    throw error;
  }
};

export interface IngestionResultItem {
  id: string;
  tipo?: string | null;
  titulo?: string | null;
  contenido: string;
  fecha?: string | null;
  fecha_creacion?: string | null;
  autor?: string | null;
  reach?: number | null;
  engagement?: number | null;
  url?: string | null;
  red_social?: string | null;
  proyecto?: string | null;
  proyecto_nombre?: string | null;
  proyecto_keywords?: string[];
  emojis?: string[];
  mensaje?: string | null;
  mensaje_formateado?: string | null;
  estado_enviado?: boolean | string;
  estado_revisado?: boolean | string;
  ubicacion?: string | null;
}

export const getIngestionResults = async (
  proyectoId: string
): Promise<IngestionResultItem[]> => {
  if (!proyectoId.trim()) {
    return [];
  }

  try {
    const response = await apiClient.get(
      `/api/ingestion/?proyecto=${encodeURIComponent(proyectoId)}`
    );

    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }

    return data ? [data] : [];
  } catch (error) {
    console.error('Error obteniendo resultados de ingestión:', error);
    throw error;
  }
};

export const createProyecto = async (
  proyecto: Omit<Proyecto, 'id' | 'created_at' | 'modified_at'>
): Promise<Proyecto> => {
  try {
    const response = await apiClient.post('/api/proyectos/crear/', proyecto);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error creando proyecto:', error);
    throw error;
  }
};

export const updateProyecto = async (
  id: string,
  proyecto: Omit<Proyecto, 'id' | 'created_at' | 'modified_at'>
): Promise<Proyecto> => {
  try {
    const response = await apiClient.patch(`/api/proyectos/${id}/`, proyecto);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error actualizando proyecto:', error);
    throw error;
  }
};

export const deleteProyecto = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/proyectos/${id}/`);
  } catch (error) {
    console.error('Error eliminando proyecto:', error);
    throw error;
  }
};

export interface MediosPaginationParams {
  page?: number;
  page_size?: number;
  usuario_nombre?: string;
  proyecto?: string;
  proyecto_nombre?: string;
  autor?: string;
  url?: string;
  url_coincide?: string;
  estado_enviado?: boolean;
  estado_revisado?: boolean;
  medio_url?: string;
  medio_url_coincide?: string;
  created_at_desde?: string;
  created_at_hasta?: string;
}

export const getMedios = async (
  params?: MediosPaginationParams
): Promise<PaginatedResponse<any>> => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size)
      queryParams.append('page_size', params.page_size.toString());
    if (params?.usuario_nombre) queryParams.append('usuario_nombre', params.usuario_nombre);
    if (params?.proyecto) queryParams.append('proyecto', params.proyecto);
    if (params?.autor) queryParams.append('autor', params.autor);
    if (params?.url) queryParams.append('url', params.url);
    if (params?.url_coincide) queryParams.append('url_coincide', params.url_coincide);
    if (params?.estado_enviado !== undefined)
      queryParams.append('estado_enviado', params.estado_enviado.toString());
    if (params?.estado_revisado !== undefined)
      queryParams.append('estado_revisado', params.estado_revisado.toString());
    if (params?.created_at_desde) {
      queryParams.append('created_at_desde', params.created_at_desde);
    }
    if (params?.created_at_hasta) {
      queryParams.append('created_at_hasta', params.created_at_hasta);
    }

    const url = `/api/medios/${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo medios:', error);
    throw error;
  }
};

export const getMediosList = async (filters?: {
  proyecto?: string;
  nombre?: string;
  tipo?: string;
}): Promise<any[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.proyecto) params.append('proyecto', filters.proyecto);
    if (filters?.nombre) params.append('nombre', filters.nombre);
    if (filters?.tipo) params.append('tipo', filters.tipo);

    const queryString = params.toString();
    const url = queryString ? `/api/medios/?${queryString}` : '/api/medios/';

    const response = await apiClient.get(url);

    let data = response.data;
    if (data.data) data = data.data;
    if (data.results) data = data.results;

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error obteniendo medios:', error);
    throw error;
  }
};

export interface RedesPaginationParams {
  page?: number;
  page_size?: number;
  usuario_nombre?: string;
  proyecto?: string;
  proyecto_nombre?: string;
  autor?: string;
  url?: string;
  url_coincide?: string;
  estado_enviado?: boolean;
  estado_revisado?: boolean;
  medio_url?: string;
  medio_url_coincide?: string;
  red_social_nombre?: string;
  created_at_desde?: string;
  created_at_hasta?: string;
}

export const getRedes = async (
  params?: RedesPaginationParams
): Promise<PaginatedResponse<any>> => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size)
      queryParams.append('page_size', params.page_size.toString());
    if (params?.usuario_nombre) queryParams.append('usuario_nombre', params.usuario_nombre);
    if (params?.proyecto) queryParams.append('proyecto', params.proyecto);
    if (params?.autor) queryParams.append('autor', params.autor);
    if (params?.url) queryParams.append('url', params.url);
    if (params?.url_coincide) queryParams.append('url_coincide', params.url_coincide);
    if (params?.estado_enviado !== undefined)
      queryParams.append('estado_enviado', params.estado_enviado.toString());
    if (params?.estado_revisado !== undefined)
      queryParams.append('estado_revisado', params.estado_revisado.toString());
    if (params?.red_social_nombre) queryParams.append('red_social_nombre', params.red_social_nombre);
    if (params?.created_at_desde) {
      queryParams.append('created_at_desde', params.created_at_desde);
    }
    if (params?.created_at_hasta) {
      queryParams.append('created_at_hasta', params.created_at_hasta);
    }

    const url = `/api/redes/${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo redes:', error);
    throw error;
  }
};

export const getRedesList = async (filters?: {
  proyecto?: string;
  autor?: string;
  url?: string;
}): Promise<any[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.proyecto) params.append('proyecto', filters.proyecto);
    if (filters?.autor) params.append('autor', filters.autor);
    if (filters?.url) params.append('url', filters.url);

    const queryString = params.toString();
    const url = queryString ? `/api/redes/?${queryString}` : '/api/redes/';

    const response = await apiClient.get(url);

    let data = response.data;
    if (data.data) data = data.data;
    if (data.results) data = data.results;

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error obteniendo redes:', error);
    throw error;
  }
};

export const capturaAlertaMedios = async (payload: {
  proyecto_id: string;
  enviar: boolean;
  alertas: Array<{
    id: string;
    url: string;
    contenido: string;
    fecha: string;
    titulo?: string;
    autor?: string;
    reach?: number;
    engagement?: number;
  }>;
}) => {
  try {
    const response = await apiClient.post(
      '/api/whatsapp/captura_alerta_medios/',
      payload
    );
    return response.data;
  } catch (error) {
    console.error('Error capturando alerta de medios:', error);
    throw error;
  }
};

export const capturaAlertaRedes = async (payload: {
  proyecto_id: string;
  enviar: boolean;
  alertas: Array<{
    id: string;
    titulo: string;
    url: string;
    contenido: string;
    fecha: string;
    autor: string;
    reach: string;
  }>;
}) => {
  try {
    const response = await apiClient.post(
      '/api/whatsapp/captura_alerta_redes/',
      payload
    );
    return response.data;
  } catch (error) {
    console.error('Error capturando alerta de redes:', error);
    throw error;
  }
};

export const enviarAlertas = async (payload: {
  proyecto_id: string;
  enviar: boolean;
  alertas: Array<{
    url: string;
    contenido: string;
    fecha: string;
    grupo_id?: string;
  }>;
}) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockResponse = {
      success: true,
      message: 'Alertas enviadas correctamente',
      alertas_enviadas: payload.alertas.length,
    };

    return mockResponse;
  } catch (error) {
    console.error('Error enviando alertas:', error);
    throw error;
  }
};

export const createAlerta = async (
  alerta: {
    url: string;
    contenido: string;
    fecha: string;
    titulo?: string;
    autor?: string;
    reach?: number;
    proyecto_id?: string;
  },
  tipo: 'medios' | 'redes' = 'medios'
) => {
  try {
    const endpoint = tipo === 'medios' ? '/api/medios/' : '/api/redes/';

    const payload = {
      proyecto: alerta.proyecto_id,
      titulo: alerta.titulo || '',
      contenido: alerta.contenido,
      url: alerta.url,
      fecha_publicacion: alerta.fecha,
      autor: alerta.autor || '',
      reach: alerta.reach || 0,
    };

    const response = await apiClient.post(endpoint, payload);
    return response.data;
  } catch (error) {
    console.error('Error creando alerta:', error);
    throw error;
  }
};

export const updateAlerta = async (
  alertaId: string,
  alerta: {
    url: string;
    contenido: string;
    fecha: string;
    titulo?: string;
    autor?: string;
    reach?: number;
  },
  tipo: 'medios' | 'redes',
  proyectoId: string
) => {
  try {
    const endpoint =
      tipo === 'medios'
        ? `/api/medios/${alertaId}/`
        : `/api/redes/${alertaId}/`;

    const payload = {
      proyecto: proyectoId,
      titulo: alerta.titulo || '',
      contenido: alerta.contenido,
      url: alerta.url,
      fecha_publicacion: alerta.fecha,
      autor: alerta.autor || '',
      reach: alerta.reach || 0,
    };

    const response = await apiClient.patch(endpoint, payload);
    return response.data;
  } catch (error) {
    console.error('Error actualizando alerta:', error);
    throw error;
  }
};

export interface Campo {
  id?: string | null;
  campo: string;
  orden: number;
  estilo: Record<string, any>; // includes salto_linea, negrita, inclinado, etc.
  label?: string;
}

export interface Plantilla {
  id: string;
  nombre: string;
  app_label: string;
  model_name: string;
  proyecto: string;
  campos: Campo[];
  config_campos?: {
    [fieldName: string]: {
      orden?: number;
      estilo?: {
        [key: string]: any;
      };
      label?: string;
    };
  };
}

export const getPlantillaCampos = async (
  proyectoId: string
): Promise<Plantilla[]> => {
  try {
    const response = await apiClient.get(
      `/api/plantillas/?proyecto_id=${proyectoId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo campos de plantilla:', error);
    throw error;
  }
};

export const guardarCamposPlantilla = async (
  plantillaId: string,
  campos: Campo[],
  eliminar: string[] = []
) => {
  try {
    const payload = {
      campos: campos.map((campo) => ({
        campo: campo.campo,
        orden: campo.orden,
        estilo: campo.estilo,
        label: campo.label,
      })),
      ...(eliminar.length > 0 ? { eliminar } : {}),
    };

    const response = await apiClient.put(
      `/api/plantillas/${plantillaId}/campos/`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error('Error guardando campos de plantilla:', error);
    throw error;
  }
};

export const apiService = {
  setToken,
  getToken,
  removeToken,
  isAuthenticated,

  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  setUserData,
  getUserData,
  isTokenExpired,
  refreshTokens,

  get,
  post,
  put,
  delete: del,

  loginWithGoogle,
  logout,

  getProyectos,
  getProyectosList,
  getIngestionProjects,
  uploadIngestionDocument,
  createProyecto,
  updateProyecto,
  deleteProyecto,
  getMedios,
  getRedes,
  capturaAlertaMedios,
  capturaAlertaRedes,
  enviarAlertas,
  createAlerta,
  updateAlerta,
  getPlantillaCampos,
  guardarCamposPlantilla,
};

export const getHistorialEnvios = async (
  params?: HistorialPaginationParams
): Promise<PaginatedResponse<HistorialEnvio>> => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.page_size) {
      queryParams.append('page_size', params.page_size.toString());
    }
    if (params?.search) {
      queryParams.append('search', params.search);
    }
    if (params?.ordering) {
      queryParams.append('ordering', params.ordering);
    }
    if (params?.usuario_nombre) {
      queryParams.append('usuario_nombre', params.usuario_nombre);
    }
    if (params?.proyecto_nombre) {
      queryParams.append('proyecto_nombre', params.proyecto_nombre);
    }
    if (params?.estado_enviado) {
      queryParams.append('estado_enviado', params.estado_enviado);
    }
    if (params?.medio_url) {
      queryParams.append('medio_url', params.medio_url);
    }
    if (params?.medio_url_coincide) {
      queryParams.append('medio_url_coincide', params.medio_url_coincide);
    }
    if (params?.red_social_nombre) {
      queryParams.append('red_social_nombre', params.red_social_nombre);
    }
    if (params?.created_at_desde) {
      queryParams.append('created_at_desde', params.created_at_desde);
    }
    if (params?.created_at_hasta) {
      queryParams.append('created_at_hasta', params.created_at_hasta);
    }
    if (params?.inicio_envio_desde) {
      queryParams.append('inicio_envio_desde', params.inicio_envio_desde);
    }
    if (params?.fin_envio_hasta) {
      queryParams.append('fin_envio_hasta', params.fin_envio_hasta);
    }

    const url = `/api/historial-envios/${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo historial de envíos:', error);
    throw error;
  }
};

export const getHistorialEnvioDetalle = async (
  id: string
): Promise<HistorialEnvio> => {
  try {
    const response = await apiClient.get(`/api/historial-envios/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo detalle del historial:', error);
    throw error;
  }
};

export const exportarHistorial = async (
  params?: HistorialPaginationParams
): Promise<Blob> => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.search) {
      queryParams.append('search', params.search);
    }
    if (params?.usuario_nombre) {
      queryParams.append('usuario_nombre', params.usuario_nombre);
    }
    if (params?.proyecto_nombre) {
      queryParams.append('proyecto_nombre', params.proyecto_nombre);
    }
    if (params?.estado_enviado) {
      queryParams.append('estado_enviado', params.estado_enviado);
    }
    if (params?.medio_url) {
      queryParams.append('medio_url', params.medio_url);
    }
    if (params?.medio_url_coincide) {
      queryParams.append('medio_url_coincide', params.medio_url_coincide);
    }
    if (params?.red_social_nombre) {
      queryParams.append('red_social_nombre', params.red_social_nombre);
    }
    if (params?.created_at_desde) {
      queryParams.append('created_at_desde', params.created_at_desde);
    }
    if (params?.created_at_hasta) {
      queryParams.append('created_at_hasta', params.created_at_hasta);
    }
    if (params?.inicio_envio_desde) {
      queryParams.append('inicio_envio_desde', params.inicio_envio_desde);
    }
    if (params?.fin_envio_hasta) {
      queryParams.append('fin_envio_hasta', params.fin_envio_hasta);
    }

    const url = `/api/exportar-historial/${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    return response.data;
  } catch (error) {
    console.error('Error exportando historial:', error);
    throw error;
  }
};

export const exportarMedios = async (
  params?: MediosPaginationParams
): Promise<Blob> => {
  try {
    const queryParams = new URLSearchParams();

    queryParams.append('tipo', 'medios');

    if (params?.usuario_nombre) {
      queryParams.append('usuario_nombre', params.usuario_nombre);
    }
    if (params?.proyecto) {
      queryParams.append('proyecto', params.proyecto);
    }
    if (params?.autor) {
      queryParams.append('autor', params.autor);
    }
    if (params?.url) {
      queryParams.append('url', params.url);
    }
    if (params?.url_coincide) {
      queryParams.append('url_coincide', params.url_coincide);
    }
    if (params?.estado_enviado !== undefined) {
      queryParams.append('estado_enviado', String(params.estado_enviado));
    }
    if (params?.estado_revisado !== undefined) {
      queryParams.append('estado_revisado', String(params.estado_revisado));
    }
    if (params?.created_at_desde) {
      queryParams.append('created_at_desde', params.created_at_desde);
    }
    if (params?.created_at_hasta) {
      queryParams.append('created_at_hasta', params.created_at_hasta);
    }

    const url = `/api/exportar-historial/${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    return response.data;
  } catch (error) {
    console.error('Error exportando medios:', error);
    throw error;
  }
};

export const exportarRedes = async (
  params?: RedesPaginationParams
): Promise<Blob> => {
  try {
    const queryParams = new URLSearchParams();

    queryParams.append('tipo', 'redes');

    if (params?.usuario_nombre) {
      queryParams.append('usuario_nombre', params.usuario_nombre);
    }
    if (params?.proyecto) {
      queryParams.append('proyecto', params.proyecto);
    }
    if (params?.autor) {
      queryParams.append('autor', params.autor);
    }
    if (params?.url) {
      queryParams.append('url', params.url);
    }
    if (params?.url_coincide) {
      queryParams.append('url_coincide', params.url_coincide);
    }
    if (params?.estado_enviado !== undefined) {
      queryParams.append('estado_enviado', String(params.estado_enviado));
    }
    if (params?.estado_revisado !== undefined) {
      queryParams.append('estado_revisado', String(params.estado_revisado));
    }
    if (params?.red_social_nombre) {
      queryParams.append('red_social_nombre', params.red_social_nombre);
    }
    if (params?.created_at_desde) {
      queryParams.append('created_at_desde', params.created_at_desde);
    }
    if (params?.created_at_hasta) {
      queryParams.append('created_at_hasta', params.created_at_hasta);
    }

    const url = `/api/exportar-historial/${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    return response.data;
  } catch (error) {
    console.error('Error exportando redes:', error);
    throw error;
  }
};

export interface WhatsAppAlerta {
  publicacion_id: string;
  mensaje: string;
}

export interface WhatsAppEnvioRequest {
  proyecto_id: string;
  grupo_id: string;
  tipo_alerta: 'medio' | 'redes';
  alertas: WhatsAppAlerta[];
}

export interface WhatsAppEnvioResponse {
  success: string;
  enviados: string[];
  no_enviados: string[];
}

export const enviarAlertasWhatsApp = async (
  data: WhatsAppEnvioRequest
): Promise<WhatsAppEnvioResponse> => {
  try {
    console.log('📤 Enviando alertas a WhatsApp API:', data);

    const response = await apiClient.post('/api/whatsapp/envio_alerta/', data);

    console.log('Respuesta del servidor WhatsApp:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error enviando alertas a WhatsApp:', error);
    throw error;
  }
};

export interface EnvioAlertaRequest {
  proyecto_id: string;
  tipo_alerta: 'medios' | 'redes';
  enviar: boolean;
  keywords?: string[];
  alertas: Array<{
    id: string;
    url: string;
    contenido: string;
    fecha: string;
    titulo?: string;
    autor?: string;
    reach?: number | string | null;
    engagement?: number | string | null;
    emojis?: string;
  }>;
}

export interface EnvioAlertaResponse {
  success: boolean;
  message: string;
  procesadas: any[];
  duplicadas: any[];
}

export interface MarcarRevisadoRequest {
  tipo_alerta: 'medios' | 'redes';
  alertas: Array<{
    id: string;
  }>;
}

export interface MarcarRevisadoResponse {
  message: string;
  success: boolean;
}

export const enviarAlertasAPI = async (
  data: EnvioAlertaRequest
): Promise<EnvioAlertaResponse> => {
  try {
    console.log('📤 Enviando alertas a API de envío:', data);

    const response = await apiClient.post('/api/whatsapp/envio_alerta/', data);

    console.log('Respuesta del servidor:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error enviando alertas:', error);
    throw error;
  }
};

export const marcarRevisadoAPI = async (
  data: MarcarRevisadoRequest
): Promise<MarcarRevisadoResponse> => {
  try {
    const response = await apiClient.post('/api/detalle-envio/revisado/', data);
    return response.data;
  } catch (error) {
    console.error('Error marcando como revisado:', error);
    throw error;
  }
};

export interface EnviarAlertasIngestionRequest {
  proyecto_id: string;
  tipo_alerta: 'medios' | 'redes';
  alertas: Array<{
    id?: string;
    url: string;
    contenido: string;
    fecha: string;
    titulo?: string;
    autor?: string;
    reach?: number | null;
    engagement?: number | null;
    red_social?: string;
  }>;
}

export interface EnviarAlertasIngestionResponse {
  success: boolean;
  message: string;
  procesadas?: any[];
  duplicadas?: any[];
}

export const enviarAlertasIngestion = async (
  data: EnviarAlertasIngestionRequest
): Promise<EnviarAlertasIngestionResponse> => {
  try {
    console.log('📤 Enviando alertas a procesar-alerta-existente:', data);

    // Enviar cada alerta individualmente con el formato correcto
    const resultados = {
      procesadas: [] as any[],
      duplicadas: [] as any[],
      errores: [] as any[],
    };

    for (const alerta of data.alertas) {
      try {
        const payload = {
          proyecto_id: data.proyecto_id,
          tipo: data.tipo_alerta === 'medios' ? 'medio' : 'red',
          alerta_id: alerta.id,
        };

        const response = await apiClient.post('/api/procesar-alerta-existente/', payload);

        if (response.data && response.data.listado) {
          resultados.procesadas.push(...response.data.listado);
        }

        // Agregar duplicados si existen
        if (response.data && response.data.duplicados > 0) {
          resultados.duplicadas.push(alerta);
        }
      } catch (error: any) {
        // Si es un error de duplicado, agregar a duplicadas
        if (error.response?.status === 409 || error.response?.data?.message?.includes('duplicad')) {
          resultados.duplicadas.push(alerta);
        } else {
          resultados.errores.push({ alerta, error: error.message });
        }
      }
    }

    const response = {
      success: resultados.procesadas.length > 0,
      message: `Procesadas: ${resultados.procesadas.length}, Duplicadas: ${resultados.duplicadas.length}, Errores: ${resultados.errores.length}`,
      procesadas: resultados.procesadas,
      duplicadas: resultados.duplicadas,
    };

    console.log('Respuesta del servidor procesar-alerta-existente:', response);
    return response;
  } catch (error) {
    console.error('Error enviando alertas a procesar-alerta-existente:', error);
    throw error;
  }
};

export interface UpdateMedioRequest {
  titulo?: string;
  contenido?: string;
  url?: string;
  autor?: string;
  reach?: number | null;
  engagement?: number | null;
  fecha_publicacion?: string;
}

export interface UpdateRedRequest {
  contenido?: string;
  url?: string;
  autor?: string;
  reach?: number | null;
  engagement?: number | null;
  fecha_publicacion?: string;
}

export const updateMedio = async (
  id: string,
  data: UpdateMedioRequest
): Promise<any> => {
  try {
    console.log(`📝 Actualizando medio ${id}:`, data);
    const response = await apiClient.patch(`/api/medios/${id}/`, data);
    console.log('Respuesta del servidor:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error actualizando medio:', error);
    throw error;
  }
};

export const updateRed = async (
  id: string,
  data: UpdateRedRequest
): Promise<any> => {
  try {
    console.log(`📝 Actualizando red ${id}:`, data);
    const response = await apiClient.patch(`/api/redes/${id}/`, data);
    console.log('Respuesta del servidor:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error actualizando red:', error);
    throw error;
  }
};

export interface BrightDataSnapshotRequest {
  red_social: string;
  urls: string[];
}

export interface BrightDataSnapshotResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const sendToBrightData = async (
  payload: BrightDataSnapshotRequest
): Promise<BrightDataSnapshotResponse> => {
  try {
    const response = await apiClient.post('/api/base/brightdata/snapshot/', payload);
    return {
      success: true,
      message: response.data?.message || 'Solicitud enviada a BrightData correctamente',
      data: response.data,
    };
  } catch (error: any) {
    console.error('Error enviando a BrightData:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error al enviar a BrightData',
    };
  }
};

// ===== IA: Cola de Excepciones / Evaluaciones / Matriz de Cliente =====

export type EstadoIa =
  | 'pendiente_ia'
  | 'clasificando'
  | 'enriqueciendo'
  | 'auto_aprobada'
  | 'cola_excepciones'
  | 'aprobada_humana'
  | 'descartada_ia'
  | 'descartada_humana'
  | 'enviada'
  | 'error_envio'
  | 'manual';

export interface EvaluacionIaResumen {
  id: string;
  estado_ia?: string;
  estado?: string;
  decision?: string | null;
  decision_por?: string | null;
  relevante?: boolean | null;
  relevancia_score?: number | null;
  tonalidad?: string | null;
  tonalidad_score?: number | null;
  categoria_sector?: string | null;
  pais_detectado?: string | null;
  confianza_global?: number | null;
  riesgo?: 'bajo' | 'medio' | 'alto' | null;
  razones?: string[];
  datos_faltantes?: string[];
  datos_completados?: any[];
  revision_humana?: boolean;
  created_at?: string;
}

export interface EvaluacionIaDetalle extends EvaluacionIaResumen {
  reglas_aplicadas?: any[];
  riesgo_detalle?: any;
  modelo?: string | null;
  version_prompt?: string | null;
  latencia_ms?: number | null;
  respuesta_cruda?: any;
  snapshot_matriz?: any;
  correccion?: any;
  revisado_por?: string | null;
  revisado_en?: string | null;
  comentario_revision?: string | null;
}

export interface AlertaExcepcion {
  id: string;
  alerta_id: string;
  tipo: 'redes' | 'medios';
  proyecto: string;
  proyecto_nombre: string;
  proyecto_keywords: string[];
  titulo: string | null;
  contenido: string | null;
  url: string | null;
  autor: string | null;
  ubicacion: string | null;
  fecha_publicacion: string | null;
  reach: number | null;
  engagement: number | null;
  red_social_nombre: string | null;
  estado_pipeline: EstadoIa;
  mensaje_formateado: string | null;
  evaluacion_ia: EvaluacionIaResumen | null;
  created_at: string;
}

export interface ColaExcepcionesParams {
  page?: number;
  page_size?: number;
  proyecto?: string;
  tipo?: string;
  tonalidad?: string;
  decision_por?: string;
  confianza_min?: number;
  confianza_max?: number;
}

export interface ColaResumen {
  pendientes: number;
  por_proyecto: Array<{
    proyecto: string;
    proyecto_nombre: string;
    pendientes: number;
  }>;
}

export interface ResolverExcepcionRequest {
  accion: 'confirmar' | 'corregir' | 'descartar';
  enviar: boolean;
  correccion?: {
    relevante?: boolean;
    tonalidad?: string;
    categoria_sector?: string;
    pais?: string;
    semaforo?: string;
  };
  campos?: {
    titulo?: string;
    contenido?: string;
    url?: string;
    autor?: string;
    ubicacion?: string;
    fecha_publicacion?: string;
    reach?: number | null;
    engagement?: number | null;
  };
  motivo?: string;
}

export interface ResolverExcepcionResponse {
  success: boolean;
  estado_pipeline: EstadoIa;
  envio?: any;
}

export interface BulkExcepcionRequest {
  ids: string[];
  accion: 'confirmar' | 'descartar';
  enviar?: boolean;
  motivo?: string;
}

export interface BulkExcepcionResponse {
  success: boolean;
  message: string;
  procesadas: string[];
  fallidas: Array<{ id: string; error: string }>;
}

export interface VoceroMatriz {
  nombre: string;
  notas: string;
}

export interface ReglaNoAlertar {
  tipo: string;
  valor?: string;
  clave?: string;
  descripcion: string;
  ejecutor: 'codigo' | 'llm';
}

export interface CriterioSector {
  clave: string;
  emoji: string;
  descripcion: string;
}

export interface EsquemaTonalidad {
  escala: string[];
  foco: string;
  definiciones: Record<string, string>;
}

export interface ConfigSemaforo {
  tipo: string;
  engagement_alto: Record<string, number>;
  reach_niveles: {
    bajo: [number, number];
    medio: [number, number];
    alto: number;
  };
  emojis: Record<string, string>;
}

export interface UmbralConfianza {
  redes?: { auto_envio: number; descarte: number };
  medios?: { auto_envio: number; descarte: number };
}

export interface MatrizCliente {
  id?: string | null;
  proyecto: string;
  activo: boolean;
  modo: 'sombra' | 'activo';
  descripcion_cliente: string;
  voceros: VoceroMatriz[];
  marcas: string[];
  menciones_criterio: string;
  paises: string[];
  reglas_no_alertar: ReglaNoAlertar[];
  criterios_sector: CriterioSector[];
  esquema_tonalidad: EsquemaTonalidad;
  config_semaforo: ConfigSemaforo;
  umbral_confianza: UmbralConfianza;
  reglas_nunca_autoenviar: any[];
  incluir_bandera: boolean;
  incluir_semaforo: boolean;
  campos_requeridos_envio: Record<string, string[]> | string[] | null;
  prompt_adicional: string;
  observaciones: string;
  created_at?: string;
  modified_at?: string;
}

export const getColaExcepciones = async (
  params?: ColaExcepcionesParams
): Promise<PaginatedResponse<AlertaExcepcion>> => {
  try {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size)
      queryParams.append('page_size', params.page_size.toString());
    if (params?.proyecto) queryParams.append('proyecto', params.proyecto);
    if (params?.tipo) queryParams.append('tipo', params.tipo);
    if (params?.tonalidad) queryParams.append('tonalidad', params.tonalidad);
    if (params?.decision_por)
      queryParams.append('decision_por', params.decision_por);
    if (params?.confianza_min !== undefined)
      queryParams.append('confianza_min', params.confianza_min.toString());
    if (params?.confianza_max !== undefined)
      queryParams.append('confianza_max', params.confianza_max.toString());

    const url = `/api/ia/cola-excepciones/${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo cola de excepciones:', error);
    throw error;
  }
};

export const getColaExcepcionesResumen = async (): Promise<ColaResumen> => {
  try {
    const response = await apiClient.get('/api/ia/cola-excepciones/resumen/');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo resumen de cola de excepciones:', error);
    throw error;
  }
};

export const resolverExcepcion = async (
  detalleId: string,
  data: ResolverExcepcionRequest
): Promise<ResolverExcepcionResponse> => {
  try {
    const response = await apiClient.post(
      `/api/ia/cola-excepciones/${detalleId}/resolver/`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error resolviendo excepción:', error);
    throw error;
  }
};

export const resolverExcepcionesBulk = async (
  data: BulkExcepcionRequest
): Promise<BulkExcepcionResponse> => {
  try {
    const response = await apiClient.post(
      '/api/ia/cola-excepciones/resolver-bulk/',
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error resolviendo excepciones en bloque:', error);
    throw error;
  }
};

export const getMatrizCliente = async (
  proyectoId: string
): Promise<MatrizCliente> => {
  try {
    const response = await apiClient.get(`/api/ia/matriz/${proyectoId}/`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo matriz de cliente:', error);
    throw error;
  }
};

export const updateMatrizCliente = async (
  proyectoId: string,
  data: Partial<MatrizCliente>
): Promise<MatrizCliente> => {
  try {
    const response = await apiClient.put(`/api/ia/matriz/${proyectoId}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error actualizando matriz de cliente:', error);
    throw error;
  }
};

export const getEvaluacionIa = async (
  id: string
): Promise<EvaluacionIaDetalle> => {
  try {
    const response = await apiClient.get(`/api/ia/evaluaciones/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo evaluación de IA:', error);
    throw error;
  }
};

export default apiService;
