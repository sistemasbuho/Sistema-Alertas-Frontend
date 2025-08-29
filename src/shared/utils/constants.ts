export const APP_NAME = 'Alertas'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
  },
} as const

export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
} as const
