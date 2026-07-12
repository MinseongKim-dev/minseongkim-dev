import { supabase } from '../../lib/supabase';

// ── camelCase ↔ snake_case helpers ─────────────────────────────────────────
function toSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}
function toCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}
function transformKeys<T>(obj: unknown, fn: (k: string) => string): T {
  if (Array.isArray(obj)) return obj.map((v) => transformKeys(v, fn)) as T;
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [fn(k), transformKeys(v, fn)]),
    ) as T;
  }
  return obj as T;
}

// ── path → Supabase table name ──────────────────────────────────────────────
const PATH_TABLE: Record<string, string> = {
  tasks: 'tasks',
  projects: 'projects',
  events: 'events',
  transactions: 'transactions',
  budgets: 'budgets',
  'savings-goals': 'savings_goals',
  contacts: 'contacts',
  meetings: 'meetings',
  learning: 'learning_goals',
  books: 'books',
  study: 'study_logs',
  flashcards: 'flashcards',
  skills: 'skills',
  achievements: 'achievements',
  'career-goals': 'career_goals',
  'job-apps': 'job_applications',
  journals: 'growth_journals',
  certs: 'certifications',
  'work-logs': 'work_logs',
  salary: 'salary_records',
  targets: 'career_targets',
  cpaths: 'career_paths',
  coachlogs: 'coach_logs',
  workouts: 'workouts',
  sleep: 'sleep_logs',
  weight: 'weight_logs',
  water: 'water_logs',
  steps: 'steps_logs',
  mood: 'mood_logs',
};

function parsePath(path: string): { table: string; id: string | null } | null {
  const stripped = path.replace(/^\//, '');
  const [segment, id] = stripped.split('/');
  const table = PATH_TABLE[segment];
  if (!table) return null;
  return { table, id: id ?? null };
}

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('로그인이 필요합니다');
  return data.user.id;
}

// ── AI / coach stubs — replace with Edge Functions later ───────────────────
const AI_STUBS: Record<string, unknown> = {};
function isAiPath(path: string): boolean {
  return path.startsWith('/ai/') || path.startsWith('/career/coach/');
}
async function handleAiPost(path: string, body: unknown): Promise<unknown> {
  // /career/coach/paths/:id/select
  const selectMatch = path.match(/^\/career\/coach\/paths\/([^/]+)\/select$/);
  if (selectMatch) {
    const pathId = selectMatch[1];
    const uid = await getUserId();
    await supabase.from('career_paths').update({ is_selected: false }).eq('user_id', uid);
    await supabase.from('career_paths').update({ is_selected: true }).eq('id', pathId).eq('user_id', uid);
    return {};
  }
  // For real AI calls, throw so the store's catch shows a toast
  void body; void AI_STUBS;
  throw new Error('AI 기능은 백엔드 설정이 필요합니다. Supabase Edge Function을 배포해주세요.');
}

// ── Core CRUD ───────────────────────────────────────────────────────────────
async function apiGet<T>(path: string): Promise<T> {
  const parsed = parsePath(path);
  if (!parsed) throw new Error(`Unknown path: ${path}`);
  const uid = await getUserId();
  const { data, error } = await supabase
    .from(parsed.table)
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return transformKeys<T>(data, toCamel);
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  if (isAiPath(path)) return handleAiPost(path, body) as Promise<T>;
  const parsed = parsePath(path);
  if (!parsed) throw new Error(`Unknown path: ${path}`);
  const uid = await getUserId();
  const payload = { ...transformKeys<Record<string, unknown>>(body, toSnake), user_id: uid };
  const { data, error } = await supabase.from(parsed.table).insert(payload).select().single();
  if (error) throw new Error(error.message);
  return transformKeys<T>(data, toCamel);
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const parsed = parsePath(path);
  if (!parsed?.id) throw new Error(`PUT requires an id: ${path}`);
  const uid = await getUserId();
  const payload = transformKeys<Record<string, unknown>>(body, toSnake);
  const { data, error } = await supabase
    .from(parsed.table)
    .update(payload)
    .eq('id', parsed.id)
    .eq('user_id', uid)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return transformKeys<T>(data, toCamel);
}

async function apiDelete<T>(path: string): Promise<T> {
  const parsed = parsePath(path);
  if (!parsed?.id) throw new Error(`DELETE requires an id: ${path}`);
  const uid = await getUserId();
  const { error } = await supabase
    .from(parsed.table)
    .delete()
    .eq('id', parsed.id)
    .eq('user_id', uid);
  if (error) throw new Error(error.message);
  return undefined as T;
}

export const api = {
  get: <T>(path: string) => apiGet<T>(path),
  post: <T>(path: string, body: unknown) => apiPost<T>(path, body),
  put: <T>(path: string, body: unknown) => apiPut<T>(path, body),
  delete: <T>(path: string) => apiDelete<T>(path),
};
