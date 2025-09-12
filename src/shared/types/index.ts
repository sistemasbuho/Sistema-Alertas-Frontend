export interface LoginCredentials {
  email: string;
  password: string;
}

export type { 
  ApiResponse, 
  AuthResponse, 
  Proyecto, 
  PaginatedResponse, 
  PaginationParams,
  HistorialEnvio,
  HistorialPaginationParams,
  MediosPaginationParams,
  RedesPaginationParams,
  WhatsAppAlerta,
  WhatsAppEnvioRequest,
  WhatsAppEnvioResponse,
} from '../services/api';
