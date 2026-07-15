import { fetchAuthSession } from 'aws-amplify/auth';
import { authHeaders } from '../../lib/auth';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const TIMEOUT_MS = 30_000;

async function apiRequest<T>(method: string, path: string, body?: unknown, retried = false): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body != null ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  // Attempt a single token refresh on 401
  if (res.status === 401 && !retried) {
    try {
      await fetchAuthSession({ forceRefresh: true });
    } catch {
      // ignore — let the retry fail naturally
    }
    return apiRequest<T>(method, path, body, true);
  }

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
