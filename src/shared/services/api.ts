import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://api.alertas.buho.media';

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface AuthResponse {
  token: string;
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
  tipo_envio: 'manual' | 'automatico';
  tipo_alerta: string;
  formato_mensaje: string;
  keywords: string;
  created_at: string;
  modified_at: string;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export const setToken = (token: string): void => {
  Cookies.set('auth_token', token, {
    expires: 7,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
  });
};

export const getToken = (): string | undefined => {
  return Cookies.get('auth_token');
};

export const setTempToken = () => {
  const tempToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU2NTA0OTUwLCJpYXQiOjE3NTY0NzI1NTAsImp0aSI6IjU4NTJiODZiNjQzNjQyNWFhOGI0YjNlZjZkZmU2ZjRkIiwidXNlcl9pZCI6IjEifQ.Eo9BXNqj2D8Yu-j4NFN_OSb9v0JUsTcbzlSnD8Glevo';
  setToken(tempToken);
};

export const removeToken = (): void => {
  Cookies.remove('auth_token');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
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

export const loginWithGoogle = async (): Promise<AuthResponse> => {
  try {
    const response = await post<AuthResponse>('/api/auth/google/');

    if (response.success && response.data.token) {
      setToken(response.data.token);
      return response.data;
    }

    throw new Error('Respuesta inválida del servidor');
  } catch (error) {
    console.error('❌ Error en login:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await post('/api/auth/logout/');
  } catch (error) {
    console.error('Error en logout:', error);
  } finally {
    removeToken();
  }
};

export const getProyectos = async (): Promise<Proyecto[]> => {
  try {
    const response = await apiClient.get('/api/proyectos/');
    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo proyectos:', error);
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

export const apiService = {
  setToken,
  getToken,
  removeToken,
  setTempToken,
  isAuthenticated,
  get,
  post,
  put,
  delete: del,
  loginWithGoogle,
  logout,
  getProyectos,
  createProyecto,
  updateProyecto,
  deleteProyecto,
  getMedios,
  getRedes,
  enviarAlertas,
};

export default apiService;
