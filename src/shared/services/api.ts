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
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU3NjI5OTYzLCJpYXQiOjE3NTcwMjUxNjMsImp0aSI6IjYzNDEwMDQ3MjEwYzRjYjc4ODNkZmY1ZTBiYzliOTRhIiwidXNlcl9pZCI6IjMifQ.I97tLupuf58bH07erfGkcMABuhSHhx1SVSJNTeBbMCI';
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

export const loginWithGoogle = async (
  googleCredential: any
): Promise<AuthResponse> => {
  try {
    const response = await post<AuthResponse>('/api/auth/google/', {
      credential: googleCredential.credential,
    });

    if (response.success && response.data.token) {
      setToken(response.data.token);
      return response.data;
    }

    throw new Error('Respuesta inválida del servidor');
  } catch (error) {
    console.error('❌ Error procesando login de Google:', error);
    throw new Error('Error al procesar la información de Google');
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
    console.log('💾 Guardando campos de plantilla:', plantillaId, campos);

    const payload = {
      campos: campos.map((campo) => ({
        campo: campo.campo,
        orden: campo.orden,
        estilo: campo.estilo,
      })),
    };

    console.log('📤 Payload enviado:', payload);

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
  // setTempToken,
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
  capturaAlertaMedios,
  enviarAlertas,
  createAlerta,
  updateAlerta,
  getPlantillaCampos,
  guardarCamposPlantilla,
};

export default apiService;
