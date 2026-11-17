'use client'

import useSWR, { type SWRResponse } from 'swr'
import { getSupabaseClient } from '@/lib/supabase'
import type { OperationScope } from '@/lib/operation-scope'

export type Merchant = {
  id: string
  name: string
  city: string
  category: string | null
  accountManager: string | null
  status: string
  createdAt: string | null
  risk: number | null
  riskLevel: string | null
  diagnosisId: string | null
  orders: number | null
  canceledOrders: number | null
  cancellation: number | null
  prepTime: number | null
  rating: number | null
  initials: string
}

export type MerchantMetric = {
  id: string
  merchantId: string
  metricDate: string
  totalOrders: number
  canceledOrders: number
  cancellationRate: number
  avgPrepTime: number | null
  avgRating: number | null
}

export type AiDiagnosis = {
  id: string
  merchantId: string
  riskScore: number
  riskLevel: string
  diagnosis: string
  rootCauses: unknown
  modelUsed: string | null
  createdAt: string | null
}

export type ActionPlan = {
  id: string
  diagnosisId: string
  merchantId: string | null
  merchant: string
  title: string
  description: string
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica'
  responsible: string | null
  dueDate: string | null
  status: 'Pendente' | 'Em andamento' | 'Concluído' | 'Cancelado'
  createdAt: string | null
}

export type SlackNotification = {
  id: string
  actionPlanId: string | null
  actionTitle: string | null
  merchantId: string | null
  merchant: string | null
  channel: string | null
  message: string
  status: 'Pendente' | 'Enviada' | 'Falhou'
  sentAt: string | null
  createdAt: string | null
}

export type CurrentProfile = {
  id: string
  name: string
  email: string | null
  role: string | null
}

export const workspaceProfile: CurrentProfile = {
  id: 'workspace-marina-costa',
  name: 'Marina Costa',
  email: 'marina.costa@merchantpulse.com',
  role: 'Gerente de operações',
}

export type WeeklyMetric = {
  day: string
  cancelamento: number
  preparo: number
  pedidos: number
}

export type MerchantHistoryPoint = {
  month: string
  pedidos: number
  cancelamento: number
  preparo: number
  avaliacao: number
}

type MerchantRow = {
  id: string
  name: string
  city: string
  category: string | null
  account_manager: string | null
  status: string | null
  created_at: string | null
}

type MetricRow = {
  id: string
  merchant_id: string
  metric_date: string
  total_orders: number
  canceled_orders: number
  cancellation_rate: number | string
  avg_prep_time: number | string | null
  avg_rating: number | string | null
}

type DiagnosisRow = {
  id: string
  merchant_id: string
  risk_score: number
  risk_level: string
  diagnosis: string
  root_causes: unknown
  model_used: string | null
  created_at: string | null
}

type ActionPlanRow = {
  id: string
  diagnosis_id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  responsible: string | null
  due_date: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | null
  created_at: string | null
}

type SlackNotificationRow = {
  id: string
  action_plan_id: string | null
  channel: string | null
  message: string
  status: 'pending' | 'sent' | 'failed' | null
  sent_at: string | null
  created_at: string | null
}

const merchantColumns = 'id,name,city,category,account_manager,status,created_at'
const metricColumns = 'id,merchant_id,metric_date,total_orders,canceled_orders,cancellation_rate,avg_prep_time,avg_rating'
const diagnosisColumns = 'id,merchant_id,risk_score,risk_level,diagnosis,root_causes,model_used,created_at'
const actionPlanColumns = 'id,diagnosis_id,title,description,priority,responsible,due_date,status,created_at'
const notificationColumns = 'id,action_plan_id,channel,message,status,sent_at,created_at'

function throwQueryError(context: string, _message: string): never {
  throw new Error(context)
}

function numeric(value: number | string | null): number | null {
  return value === null ? null : Number(value)
}

function mapMetric(row: MetricRow): MerchantMetric {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    metricDate: row.metric_date,
    totalOrders: Number(row.total_orders ?? 0),
    canceledOrders: Number(row.canceled_orders ?? 0),
    cancellationRate: Number(row.cancellation_rate ?? 0),
    avgPrepTime: numeric(row.avg_prep_time),
    avgRating: numeric(row.avg_rating),
  }
}

function mapDiagnosis(row: DiagnosisRow): AiDiagnosis {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    riskScore: Number(row.risk_score),
    riskLevel: row.risk_level,
    diagnosis: row.diagnosis,
    rootCauses: row.root_causes,
    modelUsed: row.model_used,
    createdAt: row.created_at,
  }
}

function latestBy<T>(rows: T[], key: (row: T) => string): Map<string, T> {
  const latest = new Map<string, T>()
  for (const row of rows) {
    const id = key(row)
    if (!latest.has(id)) latest.set(id, row)
  }
  return latest
}

export async function fetchMerchants(): Promise<Merchant[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('merchants').select(merchantColumns).order('created_at', { ascending: false })
  if (error) throwQueryError('Não foi possível carregar os restaurantes.', error.message)

  const rows = (data ?? []) as unknown as MerchantRow[]
  if (!rows.length) return []
  const merchantIds = rows.map((merchant) => merchant.id)
  const [metricsResult, diagnosesResult] = await Promise.all([
    supabase.from('daily_metrics').select(metricColumns).in('merchant_id', merchantIds).order('metric_date', { ascending: false }),
    supabase.from('ai_diagnoses').select(diagnosisColumns).in('merchant_id', merchantIds).order('created_at', { ascending: false }),
  ])
  if (metricsResult.error) throwQueryError('Não foi possível carregar as métricas diárias.', metricsResult.error.message)
  if (diagnosesResult.error) throwQueryError('Não foi possível carregar os diagnósticos.', diagnosesResult.error.message)

  const metrics = ((metricsResult.data ?? []) as unknown as MetricRow[]).map(mapMetric)
  const diagnoses = ((diagnosesResult.data ?? []) as unknown as DiagnosisRow[]).map(mapDiagnosis)
  const latestMetrics = latestBy(metrics, (metric) => metric.merchantId)
  const latestDiagnoses = latestBy(diagnoses, (diagnosis) => diagnosis.merchantId)

  return rows.map((row) => {
    const metric = latestMetrics.get(row.id)
    const diagnosis = latestDiagnoses.get(row.id)
    return {
      id: row.id,
      name: row.name,
      city: row.city,
      category: row.category,
      accountManager: row.account_manager,
      status: row.status ?? 'active',
      createdAt: row.created_at,
      risk: diagnosis?.riskScore ?? null,
      riskLevel: diagnosis?.riskLevel ?? null,
      diagnosisId: diagnosis?.id ?? null,
      orders: metric?.totalOrders ?? null,
      canceledOrders: metric?.canceledOrders ?? null,
      cancellation: metric?.cancellationRate ?? null,
      prepTime: metric?.avgPrepTime ?? null,
      rating: metric?.avgRating ?? null,
      initials: row.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
    }
  })
}

export async function fetchRestaurantMetrics(merchantId?: string, periodDays?: 7 | 30 | 90): Promise<MerchantMetric[]> {
  const supabase = getSupabaseClient()
  let query = supabase.from('daily_metrics').select(metricColumns).order('metric_date', { ascending: true })
  if (merchantId) query = query.eq('merchant_id', merchantId)
  if (periodDays) {
    const today = new Date()
    const startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - periodDays + 1)).toISOString().slice(0, 10)
    query = query.gte('metric_date', startDate)
  }

  const { data, error } = await query
  if (error) throwQueryError('Não foi possível carregar as métricas diárias.', error.message)
  return ((data ?? []) as unknown as MetricRow[]).map(mapMetric)
}

export async function fetchDiagnoses(merchantId?: string): Promise<AiDiagnosis[]> {
  const supabase = getSupabaseClient()
  let query = supabase.from('ai_diagnoses').select(diagnosisColumns).order('created_at', { ascending: false })
  if (merchantId) query = query.eq('merchant_id', merchantId)

  const { data, error } = await query
  if (error) throwQueryError('Não foi possível carregar os diagnósticos de IA.', error.message)
  return ((data ?? []) as unknown as DiagnosisRow[]).map(mapDiagnosis)
}

export async function fetchActionPlans(): Promise<ActionPlan[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('action_plans').select(actionPlanColumns).order('created_at', { ascending: false })
  if (error) throwQueryError('Não foi possível carregar os planos de ação.', error.message)

  const rows = (data ?? []) as unknown as ActionPlanRow[]
  if (!rows.length) return []
  const diagnosisIds = [...new Set(rows.map((row) => row.diagnosis_id))]
  const { data: diagnosisData, error: diagnosisError } = await supabase.from('ai_diagnoses').select('id,merchant_id').in('id', diagnosisIds)
  if (diagnosisError) throwQueryError('Não foi possível vincular os planos aos diagnósticos.', diagnosisError.message)

  const diagnoses = (diagnosisData ?? []) as Array<{ id: string; merchant_id: string }>
  const merchantIds = [...new Set(diagnoses.map((row) => row.merchant_id))]
  const { data: merchantData, error: merchantError } = merchantIds.length
    ? await supabase.from('merchants').select('id,name').in('id', merchantIds)
    : { data: [], error: null }
  if (merchantError) throwQueryError('Não foi possível carregar os restaurantes dos planos.', merchantError.message)

  const diagnosisMerchants = new Map(diagnoses.map((row) => [row.id, row.merchant_id]))
  const merchantNames = new Map((merchantData ?? []).map((row) => [row.id as string, row.name as string]))
  const priorityLabels: Record<ActionPlanRow['priority'], ActionPlan['priority']> = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' }
  const statusLabels: Record<NonNullable<ActionPlanRow['status']>, ActionPlan['status']> = { pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluído', cancelled: 'Cancelado' }

  return rows.map((row) => {
    const merchantId = diagnosisMerchants.get(row.diagnosis_id) ?? null
    return {
      id: row.id,
      diagnosisId: row.diagnosis_id,
      merchantId,
      merchant: merchantId ? merchantNames.get(merchantId) ?? 'Restaurante indisponível' : 'Diagnóstico indisponível',
      title: row.title,
      description: row.description,
      priority: priorityLabels[row.priority],
      responsible: row.responsible,
      dueDate: row.due_date,
      status: statusLabels[row.status ?? 'pending'],
      createdAt: row.created_at,
    }
  })
}

export async function fetchSlackNotifications(): Promise<SlackNotification[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('slack_notifications').select(notificationColumns).order('created_at', { ascending: false }).limit(50)
  if (error) throwQueryError('Não foi possível carregar as notificações do Slack.', error.message)

  const rows = (data ?? []) as unknown as SlackNotificationRow[]
  const actionPlanIds = [...new Set(rows.flatMap((row) => row.action_plan_id ? [row.action_plan_id] : []))]
  if (!actionPlanIds.length) return rows.map((row) => mapNotification(row, null, null, null))

  const { data: planData, error: planError } = await supabase.from('action_plans').select('id,title,diagnosis_id').in('id', actionPlanIds)
  if (planError) throwQueryError('Não foi possível vincular notificações aos planos.', planError.message)
  const plans = (planData ?? []) as Array<{ id: string; title: string; diagnosis_id: string }>
  const diagnosisIds = [...new Set(plans.map((plan) => plan.diagnosis_id))]
  const { data: diagnosisData, error: diagnosisError } = diagnosisIds.length
    ? await supabase.from('ai_diagnoses').select('id,merchant_id').in('id', diagnosisIds)
    : { data: [], error: null }
  if (diagnosisError) throwQueryError('Não foi possível carregar os diagnósticos das notificações.', diagnosisError.message)
  const diagnoses = (diagnosisData ?? []) as Array<{ id: string; merchant_id: string }>
  const merchantIds = [...new Set(diagnoses.map((diagnosis) => diagnosis.merchant_id))]
  const { data: merchantData, error: merchantError } = merchantIds.length
    ? await supabase.from('merchants').select('id,name').in('id', merchantIds)
    : { data: [], error: null }
  if (merchantError) throwQueryError('Não foi possível carregar os restaurantes das notificações.', merchantError.message)

  const plansById = new Map(plans.map((plan) => [plan.id, plan]))
  const merchantByDiagnosis = new Map(diagnoses.map((diagnosis) => [diagnosis.id, diagnosis.merchant_id]))
  const merchantNames = new Map((merchantData ?? []).map((merchant) => [merchant.id as string, merchant.name as string]))

  return rows.map((row) => {
    const plan = row.action_plan_id ? plansById.get(row.action_plan_id) : undefined
    const merchantId = plan ? merchantByDiagnosis.get(plan.diagnosis_id) : undefined
    return mapNotification(row, plan?.title ?? null, merchantId ?? null, merchantId ? merchantNames.get(merchantId) ?? null : null)
  })
}

function mapNotification(row: SlackNotificationRow, actionTitle: string | null, merchantId: string | null, merchant: string | null): SlackNotification {
  const statusLabels: Record<NonNullable<SlackNotificationRow['status']>, SlackNotification['status']> = { pending: 'Pendente', sent: 'Enviada', failed: 'Falhou' }
  return {
    id: row.id,
    actionPlanId: row.action_plan_id,
    actionTitle,
    merchantId,
    merchant,
    channel: row.channel,
    message: row.message,
    status: statusLabels[row.status ?? 'pending'],
    sentAt: row.sent_at,
    createdAt: row.created_at,
  }
}

export async function updateActionPlanStatus(id: string, status: ActionPlan['status']): Promise<void> {
  const supabase = getSupabaseClient()
  const dbStatus = status === 'Em andamento' ? 'in_progress' : status === 'Concluído' ? 'completed' : status === 'Cancelado' ? 'cancelled' : 'pending'
  const { error } = await supabase.from('action_plans').update({ status: dbStatus }).eq('id', id)
  if (error) throwQueryError('Não foi possível atualizar o plano de ação.', error.message)
}

export async function createActionPlan(diagnosisId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { data: diagnosisData, error: diagnosisError } = await supabase.from('ai_diagnoses').select('id,risk_level,diagnosis').eq('id', diagnosisId).single()
  if (diagnosisError || !diagnosisData) throwQueryError('Não foi possível vincular o plano a um diagnóstico.', diagnosisError?.message ?? '')

  const priority = diagnosisData.risk_level as ActionPlanRow['priority']
  const validPriority: ActionPlanRow['priority'] = ['low', 'medium', 'high', 'critical'].includes(priority) ? priority : 'medium'
  const { error } = await supabase.from('action_plans').insert({
    diagnosis_id: diagnosisData.id,
    title: 'Acompanhar diagnóstico do restaurante',
    description: diagnosisData.diagnosis,
    priority: validPriority,
    status: 'pending',
  })
  if (error) throwQueryError('Não foi possível criar o plano de ação.', error.message)
}

export function useMerchants(): SWRResponse<Merchant[], Error> {
  return useSWR<Merchant[], Error>('merchant-pulse:merchants', fetchMerchants)
}

export function useRestaurantMetrics(merchantId?: string, periodDays?: 7 | 30 | 90): SWRResponse<MerchantMetric[], Error> {
  const key = ['merchant-pulse:daily-metrics', merchantId ?? 'all', periodDays ?? 'all']
  return useSWR<MerchantMetric[], Error>(key, () => fetchRestaurantMetrics(merchantId, periodDays))
}

export function useDiagnoses(merchantId?: string): SWRResponse<AiDiagnosis[], Error> {
  const key = merchantId ? ['merchant-pulse:ai-diagnoses', merchantId] : 'merchant-pulse:ai-diagnoses'
  return useSWR<AiDiagnosis[], Error>(key, () => fetchDiagnoses(merchantId))
}

export function useActionPlans(): SWRResponse<ActionPlan[], Error> {
  return useSWR<ActionPlan[], Error>('merchant-pulse:action-plans', fetchActionPlans)
}

export function useSlackNotifications(): SWRResponse<SlackNotification[], Error> {
  return useSWR<SlackNotification[], Error>('merchant-pulse:slack-notifications', fetchSlackNotifications)
}

async function fetchCurrentProfile(): Promise<CurrentProfile> {
  try {
    const { data, error } = await getSupabaseClient().auth.getSession()
    const user = error ? null : data.session?.user
    if (!user) return workspaceProfile

    const metadata = user.user_metadata as Record<string, unknown>
    const name = [metadata.full_name, metadata.display_name, metadata.name].find((value) => typeof value === 'string') as string | undefined
    const role = [metadata.role, metadata.job_title].find((value) => typeof value === 'string') as string | undefined
    return { id: user.id, name: name ?? user.email ?? workspaceProfile.name, email: user.email ?? workspaceProfile.email, role: role ?? workspaceProfile.role }
  } catch {
    return workspaceProfile
  }
}

export function useCurrentUserProfile(): SWRResponse<CurrentProfile, Error> {
  return useSWR<CurrentProfile, Error>('merchant-pulse:profile', fetchCurrentProfile)
}

export function buildDailyMetrics(metrics: MerchantMetric[]): WeeklyMetric[] {
  const grouped = new Map<string, MerchantMetric[]>()
  for (const metric of metrics) grouped.set(metric.metricDate, [...(grouped.get(metric.metricDate) ?? []), metric])
  const entries = [...grouped.entries()].sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
  const firstDate = entries[0]?.[0]
  const lastDate = entries.at(-1)?.[0]
  const spanDays = firstDate && lastDate ? (Date.parse(`${lastDate}T00:00:00Z`) - Date.parse(`${firstDate}T00:00:00Z`)) / 86_400_000 : 0

  return entries.map(([date, records]) => {
    const totalOrders = records.reduce((total, record) => total + record.totalOrders, 0)
    const canceledOrders = records.reduce((total, record) => total + record.canceledOrders, 0)
    const dayLabel = spanDays > 14
      ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
      : new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)).replace('.', '')
    return {
      day: dayLabel,
      cancelamento: totalOrders ? canceledOrders / totalOrders * 100 : average(records.map((record) => record.cancellationRate)),
      preparo: average(records.flatMap((record) => record.avgPrepTime === null ? [] : [record.avgPrepTime])),
      pedidos: totalOrders,
    }
  })
}

export function buildMerchantHistory(metrics: MerchantMetric[]): MerchantHistoryPoint[] {
  const grouped = new Map<string, MerchantMetric[]>()
  for (const metric of metrics) {
    const month = metric.metricDate.slice(0, 7)
    grouped.set(month, [...(grouped.get(month) ?? []), metric])
  }

  return [...grouped.entries()].sort(([monthA], [monthB]) => monthA.localeCompare(monthB)).slice(-6).map(([month, records]) => {
    const totalOrders = records.reduce((total, record) => total + record.totalOrders, 0)
    const canceledOrders = records.reduce((total, record) => total + record.canceledOrders, 0)
    return {
      month: new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' }).format(new Date(`${month}-15T12:00:00`)).replace('.', ''),
      pedidos: totalOrders,
      cancelamento: totalOrders ? canceledOrders / totalOrders * 100 : average(records.map((record) => record.cancellationRate)),
      preparo: average(records.flatMap((record) => record.avgPrepTime === null ? [] : [record.avgPrepTime])),
      avaliacao: average(records.flatMap((record) => record.avgRating === null ? [] : [record.avgRating])),
    }
  })
}

export function average(values: Array<number | null>): number {
  const valid = values.filter((value): value is number => value !== null && Number.isFinite(value))
  return valid.length ? valid.reduce((total, value) => total + value, 0) / valid.length : 0
}

export function riskLabel(risk: number | null, riskLevel?: string | null) {
  const normalizedLevel = riskLevel?.toLowerCase()
  if (normalizedLevel === 'critical') return 'Crítico'
  if (normalizedLevel === 'high') return 'Alto'
  if (normalizedLevel === 'medium') return 'Moderado'
  if (normalizedLevel === 'low') return 'Baixo'
  if (risk === null) return 'Sem diagnóstico'
  if (risk >= 80) return 'Crítico'
  if (risk >= 60) return 'Alto'
  if (risk >= 40) return 'Moderado'
  return 'Baixo'
}

export function riskClass(risk: number | null, riskLevel?: string | null) {
  const normalizedLevel = riskLevel?.toLowerCase()
  if (normalizedLevel === 'critical' || (risk !== null && risk >= 80)) return 'risk-critical'
  if (normalizedLevel === 'high' || (risk !== null && risk >= 60)) return 'risk-high'
  if (normalizedLevel === 'medium' || (risk !== null && risk >= 40)) return 'risk-medium'
  if (normalizedLevel === 'low' || risk !== null) return 'risk-low'
  return 'risk-unknown'
}
