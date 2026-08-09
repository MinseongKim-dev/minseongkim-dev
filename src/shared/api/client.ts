import { supabase } from '../../lib/supabase';

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : '';

const TIMEOUT_MS = 30_000;

async function apiRequest<T>(method: string, path: string, body?: unknown, retried = false): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Map legacy /api/{domain} paths to Supabase Edge Function paths
  const fnPath = path.startsWith('/api/')
    ? path.replace('/api/', '/crud/')
    : path.startsWith('/career/')
      ? path.replace('/career/', '/career-coach/')
      : path.startsWith('/ai/')
      ? path.replace('/ai/', '/ai-chat/')
      : path;

  const res = await fetch(`${FUNCTIONS_URL}${fnPath}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (res.status === 401 && !retried) {
    await supabase.auth.refreshSession();
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
