import { createClient } from 'jsr:@supabase/supabase-js@2'

const ENTITY_TYPES: Record<string, string> = {
  events: 'EVENT',
  tasks: 'TASK',
  projects: 'PROJECT',
  transactions: 'TXN',
  budgets: 'BUDGET',
  'savings-goals': 'SAVING',
  workouts: 'WORKOUT',
  sleep: 'SLEEP',
  health: 'HEALTH',
  weight: 'WEIGHT',
  water: 'WATER',
  steps: 'STEPS',
  mood: 'MOOD',
  learning: 'LGOAL',
  study: 'STUDY',
  books: 'BOOK',
  flashcards: 'FLASH',
  contacts: 'CONTACT',
  meetings: 'MEETING',
  'career-goals': 'CGOAL',
  skills: 'SKILL',
  achievements: 'ACHIEVE',
  'job-apps': 'JOBAPP',
  journals: 'JOURNAL',
  certs: 'CERT',
  salary: 'SALARY',
  'work-logs': 'WLOG',
  'career-targets': 'TARGET',
  targets: 'TARGET',
  'career-paths': 'CPATH',
  cpaths: 'CPATH',
  coaching: 'COACH',
  coachlogs: 'CLOG',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() })
  }

  const url = new URL(req.url)
  // Path: /functions/v1/crud/{domain}[/{id}]
  const segments = url.pathname.replace(/.*\/crud\/?/, '').split('/').filter(Boolean)
  const domain = segments[0]
  const itemId = segments[1]

  const entityType = ENTITY_TYPES[domain]
  if (!entityType) {
    return json({ error: `Unknown domain: ${domain}` }, 404)
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return json({ error: 'Unauthorized' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return json({ error: 'Unauthorized' }, 401)

  const method = req.method

  // ── GET ──────────────────────────────────────────────────────────────────
  if (method === 'GET') {
    if (itemId) {
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('entity_type', entityType)
        .eq('id', itemId)
        .single()
      if (error || !data) return json({ error: 'Not found' }, 404)
      return json(toItem(data))
    }

    const beginsWithParam = url.searchParams.get('begins_with')
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100'), 500)

    let query = supabase
      .from('records')
      .select('*')
      .eq('entity_type', entityType)
      .order('sort_key', { ascending: false })
      .limit(limit)

    if (beginsWithParam) {
      query = query
        .gte('sort_key', beginsWithParam)
        .lt('sort_key', beginsWithParam + '￿')
    }

    const { data, error } = await query
    if (error) return json({ error: error.message }, 500)
    return json((data ?? []).map(toItem))
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (method === 'POST') {
    const body = await req.json()
    const { sort_key, custom_sort_key, id, ...rest } = body
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('records')
      .insert({
        ...(id ? { id } : {}),
        user_id: user.id,
        entity_type: entityType,
        sort_key: sort_key ?? now,
        custom_sort_key: custom_sort_key ?? now,
        data: rest,
      })
      .select()
      .single()

    if (error) return json({ error: error.message }, 500)
    return json(toItem(data), 201)
  }

  // ── PUT ──────────────────────────────────────────────────────────────────
  if (method === 'PUT') {
    if (!itemId) return json({ error: 'id is required' }, 400)

    const body = await req.json()
    const { sort_key, custom_sort_key, ...rest } = body
    const update: Record<string, unknown> = { data: rest }
    if (sort_key != null) update.sort_key = sort_key
    if (custom_sort_key != null) update.custom_sort_key = custom_sort_key

    const { data, error } = await supabase
      .from('records')
      .update(update)
      .eq('id', itemId)
      .eq('entity_type', entityType)
      .select()
      .single()

    if (error) return json({ error: error.message }, 500)
    return json(toItem(data))
  }

  // ── DELETE ───────────────────────────────────────────────────────────────
  if (method === 'DELETE') {
    if (!itemId) return json({ error: 'id is required' }, 400)

    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', itemId)
      .eq('entity_type', entityType)

    if (error) return json({ error: error.message }, 500)
    return json({ deleted: itemId })
  }

  return json({ error: 'Method not allowed' }, 405)
})

function toItem(record: Record<string, unknown>) {
  return {
    id: record.id,
    userId: record.user_id,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    sort_key: record.sort_key,
    ...(record.data as Record<string, unknown>),
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  }
}
