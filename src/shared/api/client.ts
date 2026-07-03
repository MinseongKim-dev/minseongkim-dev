import { authHeaders } from '../../lib/auth';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>('GET', path),
  post: <T>(path: string, body: unknown) => apiRequest<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => apiRequest<T>('PUT', path, body),
  delete: <T>(path: string) => apiRequest<T>('DELETE', path),
};
