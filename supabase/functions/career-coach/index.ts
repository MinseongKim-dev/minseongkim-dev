import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `당신은 전문 커리어 전략가 AI입니다.
사용자의 현재 상태와 목표를 분석하여 실용적이고 단계적인 커리어 로드맵을 제시합니다.
데이터 기반의 갭 분석과 구체적인 실행 계획을 제공하세요.
항상 JSON 형식으로 응답하세요.`

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

  const url = new URL(req.url)
  const path = url.pathname

  const body = await req.json().catch(() => ({}))

  if (path.endsWith('/profile')) return profileTarget(supabase, user.id, body)
  if (path.endsWith('/assess')) return assessState(supabase, user.id, body)
  if (path.endsWith('/paths') && !path.includes('/paths/')) return generatePaths(supabase, user.id, body)
  if (path.includes('/paths/') && path.endsWith('/select')) {
    const pathId = path.split('/paths/')[1]?.replace('/select', '')
    return activatePath(supabase, user.id, pathId)
  }
  if (path.includes('/coaching/')) {
    const targetId = path.split('/coaching/')[1]
    return runCoaching(supabase, user.id, targetId)
  }

  return json({ error: 'Unknown route' }, 404)
})

async function profileTarget(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: Record<string, unknown>,
) {
  const title = String(body.title ?? '')
  const context = String(body.context ?? '')

  const prompt = `사용자가 "${title}" 포지션을 목표로 설정했습니다.${context ? `\n추가 맥락: ${context}` : ''}

이 포지션의 요구 조건을 다음 6가지 차원으로 분석하세요:
1. 핵심 기술 역량 (must/preferred/nice_to_have)
2. 소프트 스킬
3. 교육/자격 요건
4. 경험/포트폴리오 요건
5. 네트워크/커뮤니티 기대치
6. 시장 현황 (수요, 연봉, 경쟁)

JSON 응답. 필드: coreSkills, softSkills, education, experience, network, marketData`

  const profile = await callAI(prompt)
  const { data, error } = await supabase.from('records').insert({
    user_id: userId,
    entity_type: 'TARGET',
    sort_key: 'exploring',
    data: {
      title,
      description: context,
      status: 'exploring',
      profile,
      currentAssessment: [],
      alternativePaths: [],
      overallReadiness: 0,
      estimatedMonths: 0,
      lastAssessedAt: new Date().toISOString(),
    },
  }).select().single()

  if (error) return json({ error: error.message }, 500)
  return json(toItem(data), 201)
}

async function assessState(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: Record<string, unknown>,
) {
  const targetId = String(body.targetId ?? '')
  const answers = body.answers ?? {}

  const [targetRes, skillsRes, achieveRes, certsRes] = await Promise.all([
    supabase.from('records').select('*').eq('id', targetId).eq('entity_type', 'TARGET').single(),
    supabase.from('records').select('data').eq('user_id', userId).eq('entity_type', 'SKILL').limit(50),
    supabase.from('records').select('data').eq('user_id', userId).eq('entity_type', 'ACHIEVE').limit(20),
    supabase.from('records').select('data').eq('user_id', userId).eq('entity_type', 'CERT').limit(20),
  ])

  if (targetRes.error || !targetRes.data) return json({ error: 'Career target not found' }, 404)
  const target = toItem(targetRes.data)

  const prompt = `목표 포지션 프로필: ${JSON.stringify(target.profile)}

현재 상태 데이터:
- 보유 스킬: ${JSON.stringify((skillsRes.data ?? []).map((r) => r.data))}
- 성과 기록: ${JSON.stringify((achieveRes.data ?? []).map((r) => r.data))}
- 자격증: ${JSON.stringify((certsRes.data ?? []).map((r) => r.data))}
- 인터뷰 답변: ${JSON.stringify(answers)}

6개 차원(core_skills, soft_skills, education, experience, network, market_fit)에 대해 갭 분석을 수행하세요.
각 차원별: score(0~100), currentState, targetState, gaps 배열(id, name, currentLevel, requiredLevel 0~5, priority), aiDiagnosis.
JSON 배열로 응답하세요.`

  const assessments = await callAI(prompt, true)
  const arr = Array.isArray(assessments) ? assessments : (assessments as Record<string, unknown>).assessments ?? []
  const readiness = arr.length
    ? Math.round(arr.reduce((s: number, a: Record<string, unknown>) => s + (Number(a.score) || 0), 0) / arr.length)
    : 0

  await supabase.from('records').update({
    data: { ...(target as Record<string, unknown>), currentAssessment: arr, overallReadiness: readiness, status: 'active', lastAssessedAt: new Date().toISOString() },
  }).eq('id', targetId).eq('entity_type', 'TARGET')

  return json({ assessments: arr, overallReadiness: readiness })
}

async function generatePaths(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  body: Record<string, unknown>,
) {
  const targetId = String(body.targetId ?? '')
  const { data: targetRow } = await supabase.from('records').select('*').eq('id', targetId).eq('entity_type', 'TARGET').single()
  if (!targetRow) return json({ error: 'Career target not found' }, 404)
  const target = toItem(targetRow)

  const prompt = `목표: ${target.title}
현재 갭 분석: ${JSON.stringify(target.currentAssessment)}

달성 가능한 2~3개의 서로 다른 경로를 생성하세요.
각 경로: name, description, estimatedMonths, riskLevel(low/medium/high), salaryImpact, stability,
phases 배열(order, name, durationMonths, urgency, actions 배열(title, description, order, linkedModules 배열)).
linkedModules: module(learning/tasks/schedule/relationships/finance), type, referenceType.
JSON 배열로 응답하세요.`

  const pathsData = await callAI(prompt, true)
  const arr = Array.isArray(pathsData) ? pathsData : (pathsData as Record<string, unknown>).paths ?? []

  const inserts = arr.map((p: Record<string, unknown>) => ({
    user_id: userId,
    entity_type: 'CPATH',
    sort_key: targetId,
    data: { ...p, targetId, isSelected: false },
  }))

  const { data, error } = await supabase.from('records').insert(inserts).select()
  if (error) return json({ error: error.message }, 500)
  return json((data ?? []).map(toItem))
}

async function activatePath(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  pathId: string,
) {
  const { data: pathRow } = await supabase.from('records').select('*').eq('id', pathId).eq('entity_type', 'CPATH').single()
  if (!pathRow) return json({ error: 'Career path not found' }, 404)
  const path = toItem(pathRow) as Record<string, unknown>

  const created: Array<{ module: string; id: string }> = []
  const phases = (path.phases as Array<Record<string, unknown>>) ?? []

  for (const phase of phases) {
    const actions = (phase.actions as Array<Record<string, unknown>>) ?? []
    for (const action of actions) {
      const links = (action.linkedModules as Array<Record<string, unknown>>) ?? []
      for (const link of links) {
        let entityType = ''
        if (link.module === 'learning') entityType = 'LGOAL'
        else if (link.module === 'tasks') entityType = 'TASK'
        if (!entityType) continue

        const { data } = await supabase.from('records').insert({
          user_id: userId,
          entity_type: entityType,
          sort_key: entityType === 'TASK' ? 'todo#' : 'active',
          data: {
            title: action.title,
            status: entityType === 'TASK' ? 'todo' : 'active',
            tags: ['career-roadmap'],
          },
        }).select('id').single()
        if (data) created.push({ module: String(link.module), id: data.id })
      }
    }
  }

  await supabase.from('records').update({ data: { ...path, isSelected: true } }).eq('id', pathId)

  const targetId = String(path.targetId ?? '')
  if (targetId) {
    const { data: t } = await supabase.from('records').select('data').eq('id', targetId).single()
    if (t) await supabase.from('records').update({ data: { ...t.data, selectedPathId: pathId, status: 'active' } }).eq('id', targetId)
  }

  return json({ activated: pathId, created })
}

async function runCoaching(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  targetId: string,
) {
  const { data: targetRow } = await supabase.from('records').select('*').eq('id', targetId).eq('entity_type', 'TARGET').single()
  if (!targetRow) return json({ error: 'Career target not found' }, 404)
  const target = toItem(targetRow) as Record<string, unknown>

  let activePath = null
  if (target.selectedPathId) {
    const { data: pathRow } = await supabase.from('records').select('*').eq('id', String(target.selectedPathId)).single()
    if (pathRow) activePath = toItem(pathRow)
  }

  const prompt = `커리어 코치로서 사용자의 진행 상황을 점검하세요.

목표: ${target.title}
전체 준비도: ${target.overallReadiness ?? 0}%
선택된 경로: ${activePath ? JSON.stringify(activePath) : '없음'}

다음 항목을 평가하고 코칭 메시지를 생성하세요:
1. 주간 진행률 체크인
2. 경로 이탈 감지
3. 다음 단계 추천

JSON 배열로 응답하세요. 각 항목: type(checkin/deviation_alert/opportunity/milestone), message, actionTaken(선택)`

  const logsData = await callAI(prompt, true)
  const arr = Array.isArray(logsData) ? logsData : (logsData as Record<string, unknown>).logs ?? []

  const inserts = arr.map((log: Record<string, unknown>) => ({
    user_id: userId,
    entity_type: 'COACH',
    sort_key: `${targetId}#${log.type ?? 'checkin'}`,
    data: { ...log, targetId },
  }))

  const { data, error } = await supabase.from('records').insert(inserts).select()
  if (error) return json({ error: error.message }, 500)
  return json((data ?? []).map(toItem))
}

async function callAI(prompt: string, expectArray = false): Promise<unknown> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })
  const raw = (response.content[0] as { text: string }).text

  try {
    if (expectArray && raw.includes('[')) {
      const s = raw.indexOf('['), e = raw.lastIndexOf(']') + 1
      if (s !== -1 && e > s) return JSON.parse(raw.slice(s, e))
    }
    const s = raw.indexOf('{'), e = raw.lastIndexOf('}') + 1
    if (s !== -1 && e > s) return JSON.parse(raw.slice(s, e))
  } catch {
    // fall through
  }
  return {}
}

function toItem(record: Record<string, unknown>) {
  return {
    id: record.id,
    userId: record.user_id,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
