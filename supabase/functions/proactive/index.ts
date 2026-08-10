/**
 * Proactive briefing function — triggered daily at 07:00 KST (22:00 UTC) via GitHub Actions.
 * Uses SUPABASE_SERVICE_ROLE_KEY so it can query all users.
 * No JWT verification required (verify_jwt = false in config.toml).
 */
import Groq from 'npm:groq-sdk'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const groq = new Groq({ apiKey: Deno.env.get('GROQ_API_KEY')! })
const MODEL = 'llama-3.3-70b-versatile'

const OVERALL_PROMPT = `당신은 Node 앱의 AI 어시스턴트입니다.
아침 브리핑을 아래 JSON 형식으로만 응답하세요:
{
  "greeting": "안녕하세요! 오늘의 브리핑입니다.",
  "summary": "오늘의 핵심 3줄 요약",
  "highlights": [{"type":"schedule|task|finance|health|career","message":"...","priority":"high|medium|low"}],
  "suggestions": ["제안1","제안2"],
  "motivationalNote": "응원 메시지"
}`

const SPECIALIST_PROMPT = `{systemPrompt}

위의 스페셜리스트 역할로 오늘의 선제적 한마디를 작성하세요.
2-3문장, 구체적 수치 포함, 즉시 실행 가능한 제안.
triggerAlerts가 있으면 가장 중요한 것을 먼저 언급하세요.
반드시 아래 JSON만 반환하세요:
{"insight":"2-3문장","alertLevel":"none|low|medium|high","primaryAlert":"중요 알림 또는 null"}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() })

  // Verify secret header from GitHub Actions
  const secret = req.headers.get('x-cron-secret')
  if (secret !== Deno.env.get('CRON_SECRET')) return json({ error: 'Forbidden' }, 403)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const today = new Date().toISOString().slice(0, 10)
  const { data: users } = await supabase.auth.admin.listUsers()
  const results = { processed: 0, errors: 0 }

  for (const user of (users?.users ?? [])) {
    try {
      await runForUser(supabase, user.id, today)
      results.processed++
    } catch {
      results.errors++
    }
  }

  return json(results)
})

async function runForUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  today: string,
) {
  const ctx = await buildContext(supabase, userId, today)
  const signals = computeSignals(ctx, today)

  // Store trigger signals
  await supabase.from('records').insert({
    user_id: userId,
    entity_type: 'COACH',
    sort_key: `${today}#signals`,
    data: { type: 'trigger_signals', date: today, signals },
  })

  // Overall morning briefing
  await generateOverallBriefing(supabase, userId, today, ctx)

  // Per-domain specialist insights
  const domainContexts: Record<string, Record<string, unknown>> = {
    schedule: { todayEvents: ctx.todayEvents, pendingTasks: ctx.pendingTasks, triggerAlerts: signals.schedule },
    tasks: { pendingTasks: ctx.pendingTasks, triggerAlerts: signals.tasks },
    finance: { recentTransactions: ctx.recentTransactions, triggerAlerts: signals.finance },
    health: { recentWorkouts: ctx.recentWorkouts, recentSleep: ctx.recentSleep, recoveryScore: signals.recoveryScore, sleepDebt: signals.sleepDebt, triggerAlerts: signals.health },
    learning: { recentBooks: ctx.recentBooks, triggerAlerts: signals.learning },
    career: { skills: ctx.skills, triggerAlerts: signals.career },
    relationships: { contacts: ctx.contacts, triggerAlerts: signals.relationships },
  }

  for (const [domain, dCtx] of Object.entries(domainContexts)) {
    await generateSpecialistInsight(supabase, userId, today, domain, dCtx).catch(() => {})
  }
}

async function buildContext(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  today: string,
) {
  const [events, tasks, txns, workouts, sleep, books, contacts, skills] = await Promise.all([
    supabase.from('records').select('data').eq('user_id', userId).eq('entity_type', 'EVENT').gte('sort_key', `${today}T00:00:00`).lte('sort_key', `${today}T23:59:59`).limit(5),
    supabase.from('records').select('data').eq('user_id', userId).eq('entity_type', 'TASK').gte('sort_key', 'todo#').lt('sort_key', 'todo#￿').limit(10),
    supabase.from('records').select('data').eq('user_id', userId).eq('entity_type', 'TXN').order('created_at', { ascending: false }).limit(10),
    supabase.from('records').select('data').eq('user_id', userId).eq('entity_type', 'WORKOUT').order('created_at', { ascending: false }).limit(7),
    supabase.from('records').select('data').eq('user_id', userId).eq('entity_type', 'SLEEP').order('created_at', { ascending: false }).limit(7),
    supabase.from('records').select('data').eq('user_id', userId).eq('entity_type', 'BOOK').order('created_at', { ascending: false }).limit(5),
    supabase.from('records').select('data').eq('user_id', userId).eq('entity_type', 'CONTACT').limit(20),
    supabase.from('records').select('data').eq('user_id', userId).eq('entity_type', 'SKILL').limit(20),
  ])

  const extract = (res: { data: Array<{ data: unknown }> | null }) =>
    (res.data ?? []).map((r) => r.data as Record<string, unknown>)

  return {
    today,
    todayEvents: extract(events),
    pendingTasks: extract(tasks),
    recentTransactions: extract(txns),
    recentWorkouts: extract(workouts),
    recentSleep: extract(sleep),
    recentBooks: extract(books),
    contacts: extract(contacts),
    skills: extract(skills),
  }
}

function computeSignals(ctx: ReturnType<typeof buildContext> extends Promise<infer T> ? T : never, today: string) {
  const todayDt = new Date(today)

  // Task procrastination
  const tasks: Array<Record<string, unknown>> = []
  for (const task of (ctx as Record<string, unknown[]>).pendingTasks as Array<Record<string, unknown>>) {
    const createdStr = String(task.createdAt ?? task.created_at ?? task.date ?? '')
    if (!createdStr) continue
    const daysPending = Math.floor((todayDt.getTime() - new Date(createdStr.slice(0, 10)).getTime()) / 86400000)
    const title = String(task.title ?? task.name ?? '작업')
    if (daysPending >= 7) tasks.push({ type: 'procrastination', level: 'high', days: daysPending, task: title, message: `'${title}' ${daysPending}일째 대기 중. 지금 작은 단계로 분해하세요.` })
    else if (daysPending >= 5) tasks.push({ type: 'procrastination', level: 'medium', days: daysPending, task: title, message: `'${title}' ${daysPending}일째 멈춰 있습니다. 무엇이 막고 있나요?` })
    else if (daysPending >= 3) tasks.push({ type: 'procrastination', level: 'low', days: daysPending, task: title, message: `'${title}' ${daysPending}일이 지났습니다. 오늘 시작해볼까요?` })
  }

  // Recovery score
  const recentSleep = (ctx as Record<string, unknown[]>).recentSleep as Array<Record<string, unknown>>
  const avgSleep = recentSleep.length
    ? recentSleep.reduce((s, l) => s + parseFloat(String(l.duration ?? l.hours ?? 0)), 0) / recentSleep.length
    : 4
  const sleepScore = Math.min(50, Math.round((avgSleep / 8) * 50))
  const recoveryScore = sleepScore + 25
  const sleepDebt = Math.max(0, Math.round((56 - recentSleep.reduce((s, l) => s + parseFloat(String(l.duration ?? l.hours ?? 0)), 0)) * 10) / 10)

  const health: Array<Record<string, unknown>> = []
  if (recoveryScore < 40) health.push({ type: 'recovery', level: 'high', score: recoveryScore, message: `회복도 ${recoveryScore}/100 — 오늘은 충분한 휴식을 취하세요.` })
  if (sleepDebt >= 5) health.push({ type: 'sleep_debt', level: sleepDebt >= 10 ? 'high' : 'medium', debt_hours: sleepDebt, message: `주간 수면 부채 ${sleepDebt}시간.` })

  // Budget burn (simplified)
  const finance: Array<Record<string, unknown>> = []
  const txns = (ctx as Record<string, unknown[]>).recentTransactions as Array<Record<string, unknown>>
  const byCat: Record<string, { spent: number; budget: number }> = {}
  for (const t of txns) {
    const cat = String(t.category ?? '기타')
    if (!byCat[cat]) byCat[cat] = { spent: 0, budget: parseFloat(String(t.budget ?? 0)) }
    byCat[cat].spent += parseFloat(String(t.amount ?? 0))
  }
  for (const [cat, { spent, budget }] of Object.entries(byCat)) {
    if (!budget) continue
    const pct = spent / budget * 100
    if (pct >= 90) finance.push({ type: 'budget_burn', level: 'high', category: cat, burn_pct: Math.round(pct), message: `${cat} 예산 ${Math.round(pct)}% 소진.` })
    else if (pct >= 70) finance.push({ type: 'budget_burn', level: 'medium', category: cat, burn_pct: Math.round(pct), message: `${cat} 예산 ${Math.round(pct)}% 소진.` })
  }

  return { tasks: tasks.slice(0, 3), health, finance: finance.slice(0, 5), schedule: [], learning: [], career: [], relationships: [], recoveryScore, sleepDebt }
}

async function generateOverallBriefing(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  today: string,
  ctx: Record<string, unknown>,
) {
  const response = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: OVERALL_PROMPT },
      { role: 'user', content: JSON.stringify({ today, todayEvents: ctx.todayEvents, pendingTasks: ctx.pendingTasks, recentWorkouts: ctx.recentWorkouts }) },
    ],
  })
  const raw = response.choices[0].message.content ?? ''
  const briefing = parseJson(raw) ?? { summary: raw }

  await supabase.from('records').insert({
    user_id: userId,
    entity_type: 'COACH',
    sort_key: today,
    data: { type: 'daily_briefing', date: today, briefing },
  })
}

async function generateSpecialistInsight(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  today: string,
  domain: string,
  dCtx: Record<string, unknown>,
) {
  const specialistPrompts: Record<string, string> = {
    schedule: '당신은 시간 설계사입니다. 일정 최적화와 시간 관리 전문가로서 조언하세요.',
    tasks: '당신은 실행 코치입니다. 목표 달성과 생산성 전문가로서 조언하세요.',
    finance: '당신은 재무 어드바이저입니다. 예산 관리와 재정 목표 전문가로서 조언하세요.',
    health: '당신은 회복 코치입니다. 운동, 수면, 회복 전문가로서 조언하세요.',
    learning: '당신은 학습 코치입니다. 지식 습득과 성장 전문가로서 조언하세요.',
    career: '당신은 커리어 전략가입니다. 성장 계획과 목표 달성 전문가로서 조언하세요.',
    relationships: '당신은 관계 매니저입니다. 인맥 관리와 소통 전문가로서 조언하세요.',
  }

  const sysPrompt = specialistPrompts[domain]
  if (!sysPrompt) return

  const system = SPECIALIST_PROMPT.replace('{systemPrompt}', sysPrompt)
  const response = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify({ today, ...dCtx }) },
    ],
  })
  const raw = response.choices[0].message.content ?? ''
  const parsed = parseJson(raw) as Record<string, unknown> | null ?? {}

  await supabase.from('records').insert({
    user_id: userId,
    entity_type: 'COACH',
    sort_key: `${today}#${domain}`,
    data: {
      type: 'specialist_brief',
      domain,
      date: today,
      insight: String(parsed.insight ?? raw),
      alertLevel: String(parsed.alertLevel ?? 'none'),
      primaryAlert: parsed.primaryAlert ?? null,
    },
  })
}

function parseJson(raw: string): unknown {
  try {
    const s = raw.indexOf('{'), e = raw.lastIndexOf('}') + 1
    if (s !== -1 && e > s) return JSON.parse(raw.slice(s, e))
  } catch { /* ignore */ }
  return null
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
    'Access-Control-Allow-Headers': 'authorization, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
