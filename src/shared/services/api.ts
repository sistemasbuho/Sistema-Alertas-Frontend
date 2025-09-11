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
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

export interface Proyecto {
  id: string;
  nombre: string;
  proveedor: string;
  codigo_acceso: string;
  estado: 'activo' | 'inactivo' | 'completado';
  tipo_envio: 'manual' | 'automatico' | 'medios';
  tipo_alerta: string;
  formato_mensaje: string;
  keywords: string | null;
  created_at: string;
  modified_at: string;
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
  search?: string;
  ordering?: string;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request: inyectar token y renovar si es necesario
apiClient.interceptors.request.use(
  async (config) => {
    let token = getAccessToken();

    if (token && isTokenExpired()) {
      try {
        await refreshTokens();
        token = getAccessToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await refreshTokens();
        const newToken = getAccessToken();

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearTokens();

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
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

export const setUserData = (user: AuthResponse['user']): void => {
  localStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(user));
};

export const getUserData = (): AuthResponse['user'] | null => {
  const userData = localStorage.getItem(AUTH_KEYS.USER_DATA);
  return userData ? JSON.parse(userData) : null;
};

export const isAuthenticated = (): boolean => {
  const accessToken = getAccessToken();
  return !!accessToken && !isTokenExpired();
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

export const fetchUserProfile = async (): Promise<AuthResponse['user']> => {
  try {
    const response = await get<AuthResponse['user']>('/api/auth/me/');
    const user = response.data;
    setUserData(user);
    return user;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
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

    const user: AuthResponse['user'] = {
      id: authData.id || authData.user_id || String(authData.user?.id || ''),
      email: authData.email || email,
      name: authData.first_name
        ? `${authData.first_name} ${authData.last_name || ''}`.trim()
        : authData.name || email,
      picture: authData.picture,
    };

    setUserData(user);

    const authResponse: AuthResponse = {
      access: tokens.access,
      refresh: tokens.refresh,
      user: user,
    };

    return authResponse;
  } catch (error) {
    console.error('❌ Error procesando login de Google:', error);
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
    if (params?.search) {
      queryParams.append('search', params.search);
    }
    if (params?.ordering) {
      queryParams.append('ordering', params.ordering);
    }

    const url = `/api/proyectos/${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo proyectos:', error);
    throw error;
  }
};

export const getProyectosList = async (
  params?: PaginationParams
): Promise<Proyecto[]> => {
  const response = await getProyectos(params);
  return response.results;
};

export const createProyecto = async (
  proyecto: Omit<Proyecto, 'id' | 'created_at' | 'modified_at'>
): Promise<Proyecto> => {
  try {
    const response = await apiClient.post('/api/proyectos/crear/', proyecto);
    return response.data.data || response.data;
  } catch (error) {
    console.error('❌ Error creando proyecto:', error);
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
    console.error('❌ Error actualizando proyecto:', error);
    throw error;
  }
};

export const deleteProyecto = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/proyectos/${id}/`);
  } catch (error) {
    console.error('❌ Error eliminando proyecto:', error);
    throw error;
  }
};

export const getMedios = async (filters?: {
  proyecto?: string;
  nombre?: string;
  tipo?: string;
}) => {
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
    console.error('❌ Error obteniendo medios:', error);
    throw error;
  }
};

export const getRedes = async (filters?: {
  proyecto?: string;
  autor?: string;
  url?: string;
}) => {
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
    console.error('❌ Error obteniendo redes:', error);
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
    console.error('❌ Error capturando alerta de medios:', error);
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
    console.error('❌ Error capturando alerta de redes:', error);
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
    console.error('❌ Error enviando alertas:', error);
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
    console.error('❌ Error creando alerta:', error);
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
    console.error('❌ Error actualizando alerta:', error);
    throw error;
  }
};

export interface Campo {
  id?: string | null;
  campo: string;
  orden: number;
  estilo: Record<string, any>;
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
    console.error('❌ Error obteniendo campos de plantilla:', error);
    throw error;
  }
};

export const guardarCamposPlantilla = async (
  plantillaId: string,
  campos: Campo[]
) => {
  try {
    const payload = {
      campos: campos.map((campo) => ({
        campo: campo.campo,
        orden: campo.orden,
        estilo: campo.estilo,
      })),
    };

    const response = await apiClient.put(
      `/api/plantillas/${plantillaId}/campos/`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error('❌ Error guardando campos de plantilla:', error);
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
  fetchUserProfile,

  get,
  post,
  put,
  delete: del,

  loginWithGoogle,
  logout,

  getProyectos,
  getProyectosList,
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

export default apiService;
