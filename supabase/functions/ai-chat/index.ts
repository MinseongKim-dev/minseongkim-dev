import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
const MODEL = 'claude-haiku-4-5-20251001'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() })
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

  const body = await req.json()
  const userInput: string = (body.message ?? '').trim()
  const history: Array<{ role: string; content: string }> = (body.history ?? []).slice(-10)
  const domain: string | undefined = body.domain

  if (!userInput) return json({ error: 'message is required' }, 400)

  const ctx = await buildContext(supabase, user.id)
  const systemPrompt = buildSystemPrompt(domain)

  const contextNote = `\n\n[현재 컨텍스트: 오늘=${ctx.today}, 오늘 일정=${ctx.eventCount}개, 미완료 태스크=${ctx.taskCount}개]`
  const messages = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userInput + contextNote },
  ]

  let raw: string
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    })
    raw = (response.content[0] as { text: string }).text
  } catch (err) {
    return json({ error: `AI service error: ${err}` }, 502)
  }

  const parsed = parseResponse(raw)

  await supabase.from('messages').insert([
    { user_id: user.id, role: 'user', content: userInput },
    { user_id: user.id, role: 'assistant', content: parsed.response ?? raw },
  ])

  return json({
    message: parsed.response ?? raw,
    followUp: parsed.followUp,
    visualizations: parsed.visualizations ?? [],
    domain: parsed.domain,
    intent: parsed.intent,
  })
})

async function buildContext(supabase: ReturnType<typeof createClient>, userId: string) {
  const today = new Date().toISOString().slice(0, 10)

  const [eventsRes, tasksRes] = await Promise.all([
    supabase
      .from('records')
      .select('data')
      .eq('user_id', userId)
      .eq('entity_type', 'EVENT')
      .gte('sort_key', `${today}T00:00:00`)
      .lte('sort_key', `${today}T23:59:59`)
      .limit(5),
    supabase
      .from('records')
      .select('id')
      .eq('user_id', userId)
      .eq('entity_type', 'TASK')
      .gte('sort_key', 'todo#')
      .lt('sort_key', 'todo#￿')
      .limit(10),
  ])

  return {
    today,
    eventCount: eventsRes.data?.length ?? 0,
    taskCount: tasksRes.data?.length ?? 0,
  }
}

function buildSystemPrompt(domain?: string): string {
  const base = `당신은 Node AI Life Manager의 개인 AI 어시스턴트입니다.
사용자의 일정, 할 일, 재무, 건강, 학습, 커리어, 관계 데이터를 기반으로
맞춤형 조언과 실행 가능한 인사이트를 제공합니다.

필요 시 다음 JSON 구조로 응답하세요:
{
  "response": "사용자에게 보여줄 텍스트",
  "followUp": "후속 질문 (선택)",
  "domain": "관련 도메인",
  "intent": "intent 분류",
  "actions": [
    {"type": "db_operation", "operation": "create|update|delete", "domain": "...", "data": {...}}
  ]
}`

  const domainHints: Record<string, string> = {
    schedule: '현재 일정 관리 화면입니다. 일정 최적화와 시간 관리에 집중하세요.',
    tasks: '현재 할 일 화면입니다. 태스크 우선순위와 실행 계획에 집중하세요.',
    finance: '현재 재무 화면입니다. 예산 관리와 재정 목표에 집중하세요.',
    health: '현재 건강 화면입니다. 운동, 수면, 회복에 집중하세요.',
    learning: '현재 학습 화면입니다. 학습 목표와 진행 상황에 집중하세요.',
    career: '현재 커리어 화면입니다. 성장 계획과 목표 달성에 집중하세요.',
    relationships: '현재 관계 화면입니다. 인맥 관리와 소통에 집중하세요.',
  }

  const hint = domain ? (domainHints[domain] ?? '') : ''
  return hint ? `${base}\n\n[현재 화면 컨텍스트]: ${hint}` : base
}

function parseResponse(raw: string): Record<string, unknown> {
  try {
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}') + 1
    if (start !== -1 && end > start) return JSON.parse(raw.slice(start, end))
  } catch {
    // fall through
  }
  return { response: raw }
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
