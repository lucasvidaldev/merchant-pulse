'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, CalendarDays, Check, CircleAlert, Clock3, Phone, Star, Utensils } from 'lucide-react'
import { buildMerchantHistory, riskClass, riskLabel, useActionPlans, useDiagnoses, useMerchants, useRestaurantMetrics } from '@/lib/merchant-data'
import { MerchantTrendChart } from './charts'
import { PageHeading } from './shell'
import { QueryNotice } from './query-state'

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

function formatRootCause(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  return JSON.stringify(value)
}

export function MerchantDetail({ id }: { id: string }) {
  const merchantsQuery = useMerchants()
  const metricsQuery = useRestaurantMetrics(id)
  const diagnosesQuery = useDiagnoses(id)
  const plansQuery = useActionPlans()
  const merchant = merchantsQuery.data?.find((item) => item.id === id)
  const metrics = metricsQuery.data ?? []
  const latestDiagnosis = diagnosesQuery.data?.[0]
  const plans = plansQuery.data ?? []
  const activePlan = plans.find((plan) => plan.merchantId === id && plan.status !== 'Concluído' && plan.status !== 'Cancelado')
  const loading = merchantsQuery.isLoading || metricsQuery.isLoading || diagnosesQuery.isLoading || plansQuery.isLoading
  const error = merchantsQuery.error ?? metricsQuery.error ?? diagnosesQuery.error ?? plansQuery.error
  const history = buildMerchantHistory(metrics)
  const latestMetric = metrics.at(-1)
  const previousMetric = metrics.at(-2)
  const riskScore = latestDiagnosis?.riskScore ?? merchant?.risk ?? null
  const rootCauses = Array.isArray(latestDiagnosis?.rootCauses)
    ? latestDiagnosis.rootCauses.map(formatRootCause).filter(Boolean)
    : latestDiagnosis?.rootCauses ? [formatRootCause(latestDiagnosis.rootCauses)] : []
  const metricsCards = merchant ? [
    { label: 'Pedidos · último dia', value: merchant.orders === null ? '—' : number.format(merchant.orders), icon: Utensils },
    { label: 'Pedidos cancelados', value: merchant.canceledOrders === null ? '—' : number.format(merchant.canceledOrders), icon: CircleAlert },
    { label: 'Tempo médio de preparo', value: merchant.prepTime === null ? '—' : `${number.format(merchant.prepTime)} min`, icon: Clock3 },
    { label: 'Avaliação média', value: merchant.rating === null ? '—' : number.format(merchant.rating), icon: Star },
  ] : []
  const diagnosisDate = latestDiagnosis?.createdAt ? new Date(latestDiagnosis.createdAt).toLocaleDateString('pt-BR') : null

  if (error) return <><Link href="/restaurants" className="back-link"><ArrowLeft size={15} /> Voltar para merchants</Link><QueryNotice loading={false} error={error} /></>
  if (loading) return <><Link href="/restaurants" className="back-link"><ArrowLeft size={15} /> Voltar para merchants</Link><QueryNotice loading /><div className="dashboard-note">Consultando merchants, métricas e diagnósticos.</div></>
  if (!merchant) return <><Link href="/restaurants" className="back-link"><ArrowLeft size={15} /> Voltar para merchants</Link><div className="empty-state"><strong>Merchant não encontrado</strong><span>Confira o identificador ou as políticas de acesso no Supabase.</span></div></>

  return <>
    <Link href="/restaurants" className="back-link"><ArrowLeft size={15} /> Voltar para merchants</Link>
    <PageHeading eyebrow="MERCHANTS / PERFIL" title={merchant.name} description={`${merchant.category ?? 'Sem categoria'} · ${merchant.city}`} action={<><button className="button-secondary"><Phone size={14} /> Contatar parceiro</button><Link href="/actions" className="button-primary">Ver planos de ação <ArrowRight size={14} /></Link></>} />
    <section className="merchant-profile-row"><div className="profile-logo">{merchant.initials}</div><div className="profile-identity"><h2>{merchant.name}</h2><p>{merchant.accountManager ?? 'Sem responsável atribuído'} <span>·</span> Status: {merchant.status} <span>·</span> Criado em {merchant.createdAt ? new Date(merchant.createdAt).toLocaleDateString('pt-BR') : '—'}</p></div><div className="profile-risk"><span className={`risk-pill ${riskClass(riskScore, latestDiagnosis?.riskLevel ?? merchant.riskLevel)}`}><span /> Risco {riskLabel(riskScore, latestDiagnosis?.riskLevel ?? merchant.riskLevel)}</span><div className="risk-score"><strong>{riskScore ?? '—'}</strong><span>/ 100</span></div></div></section>
    <section className="merchant-kpi-grid">{metricsCards.map(({ label, value, icon: Icon }) => <article className="metric-card merchant-metric" key={label}><span className="merchant-metric-label"><Icon size={14} /> {label}</span><strong>{value}</strong><span className="metric-change">{latestMetric ? `Registro de ${new Date(`${latestMetric.metricDate}T12:00:00`).toLocaleDateString('pt-BR')}` : 'Sem métrica diária'}</span></article>)}</section>
    <section className="chart-grid merchant-chart-grid"><article className="panel chart-panel"><div className="panel-heading"><div><h2>Histórico de performance</h2><p>Pedidos e cancelamentos · últimos registros diários</p></div><span className="button-secondary button-compact"><CalendarDays size={14} /> Até 6 meses</span></div><MerchantTrendChart data={history} /></article><article className="panel score-panel"><div className="panel-heading"><div><h2>Diagnóstico de IA</h2><p>{diagnosisDate ? `Atualizado em ${diagnosisDate}` : 'Sem diagnóstico disponível'}</p></div></div><div className="score-meter"><div className="score-ring" style={{ '--score': `${riskScore ?? 0}%` } as React.CSSProperties}><strong>{riskScore ?? '—'}</strong><span>{latestDiagnosis?.riskLevel?.toUpperCase() ?? 'SEM SCORE'}</span></div></div><p className="diagnosis-summary">{latestDiagnosis?.diagnosis ?? 'Ainda não há diagnóstico para este merchant.'}</p>{latestDiagnosis?.modelUsed && <p className="score-footnote">Modelo: {latestDiagnosis.modelUsed}</p>}</article></section>
    <section className="panel diagnosis-panel"><div className="panel-heading"><div><h2>Causas raiz</h2><p>Conteúdo armazenado em ai_diagnoses.root_causes</p></div></div><div className="diagnosis-list">{rootCauses.map((cause, index) => <div className="diagnosis-item" key={`${index}-${cause}`}><span className="diagnosis-icon"><CircleAlert size={16} /></span><div><strong>Causa {index + 1}</strong><p>{cause}</p></div></div>)}{!rootCauses.length && <div className="empty-state"><strong>Nenhuma causa raiz disponível</strong><span>O campo root_causes está vazio neste diagnóstico.</span></div>}</div></section>
    <section className="panel action-preview"><div className="panel-heading"><div><h2>Plano de ação ativo</h2><p>Planos vinculados aos diagnósticos deste merchant</p></div><Link href="/actions" className="text-link">Ver planos <ArrowRight size={13} /></Link></div>{activePlan ? <div className="action-card"><div className="action-priority-icon"><CircleAlert size={17} /></div><div className="action-card-copy"><span>PRIORIDADE {activePlan.priority.toUpperCase()} <span>·</span> {activePlan.status.toUpperCase()}</span><strong>{activePlan.title}</strong><p>Responsável: {activePlan.responsible ?? 'Não atribuído'} <span>·</span> {activePlan.dueDate ? new Date(`${activePlan.dueDate}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem prazo definido'}</p></div><Link href="/actions" className="button-primary button-compact"><Check size={14} /> Ver plano</Link></div> : <div className="empty-state"><strong>Nenhum plano de ação ativo</strong><span>Planos vinculados a diagnósticos aparecerão aqui.</span></div>}</section>
    <div className="dashboard-note"><span className="status-live" /> Perfil e histórico consultados do Supabase.</div>
  </>
}
