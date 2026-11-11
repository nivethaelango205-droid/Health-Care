// Centralized API client for RuralCare 360

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const IS_DEMO_MODE_DEFAULT = import.meta.env.VITE_DEMO_MODE === 'true';

// Token storage key
const TOKEN_KEY = 'ruralcare_token';
const USER_KEY = 'ruralcare_user';
const DEMO_MODE_KEY = 'ruralcare_demo_mode';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getStoredUser(): any | null {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function setStoredUser(user: any | null): void {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function isDemoModeActive(): boolean {
  // If explicitly configured to false in environment, enforce false
  if (import.meta.env.VITE_DEMO_MODE === 'false') {
    return false;
  }
  const saved = localStorage.getItem(DEMO_MODE_KEY);
  if (saved !== null) {
    return saved === 'true';
  }
  return IS_DEMO_MODE_DEFAULT;
}

export function setDemoModeActive(enabled: boolean): void {
  localStorage.setItem(DEMO_MODE_KEY, enabled ? 'true' : 'false');
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Array<{ path: string; message: string }>;

  constructor(message: string, code = 'API_ERROR', status = 500, details?: Array<{ path: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    if (!response.ok) {
      let errData: any = {};
      try {
        errData = await response.json();
      } catch {
        // non-json error body
      }
      const message =
        errData.message ||
        (typeof errData.error === 'string' ? errData.error : errData.error?.message) ||
        `Request failed with status ${response.status}`;
      const code =
        (typeof errData.error === 'string' ? errData.error : errData.error?.code) ||
        errData.code ||
        'UNKNOWN_ERROR';

      throw new ApiError(message, code, response.status, errData.details || errData.error?.details);
    }

    // Handle PDF or blob downloads
    const contentType = response.headers.get('content-type');
    if (contentType && (contentType.includes('application/pdf') || contentType.includes('application/octet-stream'))) {
      return (await response.blob()) as unknown as T;
    }

    const data = await response.json();
    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network connection failed', 'NETWORK_ERROR', 0);
  }
}

