import { useAuthStore } from '@/stores/authStore';
import type { ApiError } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface RequestOptions {
  body?: Record<string, unknown> | unknown[];
  params?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeader(): Record<string, string> {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  private buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) return false;

        const res = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) return false;

        const data = await res.json();
        useAuthStore.getState().setTokens(data.access_token, data.refresh_token);

        // Update cookie too
        if (typeof document !== 'undefined') {
          document.cookie = `pkm-auth-token=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }
        return true;
      } catch {
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          statusCode: response.status,
          message: response.statusText || 'An error occurred',
        };
      }

      // Handle 401 - clear auth state (skip for auth endpoints)
      if (response.status === 401 && !response.url.includes('/auth/')) {
        useAuthStore.getState().logout();
      }

      throw errorData;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private async fetchWithRefresh<T>(
    url: string,
    init: RequestInit,
  ): Promise<T> {
    const response = await fetch(url, init);

    // If 401 and not an auth endpoint, try refresh
    if (response.status === 401 && !url.includes('/auth/')) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        // Retry with new token
        const newInit = {
          ...init,
          headers: {
            ...init.headers,
            ...this.getAuthHeader(),
          },
        };
        const retryResponse = await fetch(url, newInit);
        return this.handleResponse<T>(retryResponse);
      }
    }

    return this.handleResponse<T>(response);
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    return this.fetchWithRefresh<T>(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options?.headers,
      },
      signal: options?.signal,
    });
  }

  async post<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    return this.fetchWithRefresh<T>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options?.headers,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: options?.signal,
    });
  }

  async put<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    return this.fetchWithRefresh<T>(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options?.headers,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: options?.signal,
    });
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params);
    return this.fetchWithRefresh<T>(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options?.headers,
      },
      signal: options?.signal,
    });
  }

  async upload<T>(path: string, file: File, fieldName = 'file'): Promise<T> {
    const url = this.buildUrl(path);
    const formData = new FormData();
    formData.append(fieldName, file);

    return this.fetchWithRefresh<T>(url, {
      method: 'POST',
      headers: {
        ...this.getAuthHeader(),
      },
      body: formData,
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
