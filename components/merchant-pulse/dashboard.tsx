'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AlertTriangle, ArrowRight, CalendarDays, ChevronDown, Clock3, Ellipsis, MessageSquareText, Sparkles, Star, Store, Target, TrendingDown } from 'lucide-react'
import { average, buildDailyMetrics, riskClass, riskLabel, useActionPlans, useMerchants, useRestaurantMetrics, useSlackNotifications } from '@/lib/merchant-data'
import { filterByOperation } from '@/lib/operation-scope'
import { useOperation } from './operation-context'
import { CancellationChart, PrepTimeChart } from './charts'
import { PageHeading } from './shell'
import { QueryNotice } from './query-state'

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

export function Dashboard() {
  const { operation } = useOperation()
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30)
  const merchantsQuery = useMerchants()
  const metricsQuery = useRestaurantMetrics(undefined, periodDays)
  const notificationsQuery = useSlackNotifications()
  const plansQuery = useActionPlans()
  const merchants = filterByOperation(merchantsQuery.data ?? [], operation)
  const merchantIds = new Set(merchants.map((merchant) => merchant.id))
  const metrics = (metricsQuery.data ?? []).filter((metric) => merchantIds.has(metric.merchantId))
  const notifications = (notificationsQuery.data ?? []).filter((item) => item.merchantId === null || merchantIds.has(item.merchantId))
  const plans = (plansQuery.data ?? []).filter((plan) => plan.merchantId === null || merchantIds.has(plan.merchantId))
  const openPlans = plans.filter((plan) => plan.status === 'Pendente' || plan.status === 'Em andamento')
  const highRisk = merchants.filter((merchant) => ['risk-high', 'risk-critical'].includes(riskClass(merchant.risk, merchant.riskLevel))).sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0)).slice(0, 5)
  const chartData = buildDailyMetrics(metrics)
  const activeCount = merchants.filter((merchant) => merchant.status.toLowerCase() === 'active').length
  const atRisk = merchants.filter((merchant) => ['risk-high', 'risk-critical'].includes(riskClass(merchant.risk, merchant.riskLevel))).length
  const riskCounts = [
    { label: 'Crítico', value: merchants.filter((merchant) => riskClass(merchant.risk, merchant.riskLevel) === 'risk-critical').length, tone: 'critical' },
    { label: 'Alto', value: merchants.filter((merchant) => riskClass(merchant.risk, merchant.riskLevel) === 'risk-high').length, tone: 'high' },
    { label: 'Moderado', value: merchants.filter((merchant) => riskClass(merchant.risk, merchant.riskLevel) === 'risk-medium').length, tone: 'medium' },
    { label: 'Baixo', value: merchants.filter((merchant) => riskClass(merchant.risk, merchant.riskLevel) === 'risk-low').length, tone: 'low' },
    { label: 'Sem diagnóstico', value: merchants.filter((merchant) => merchant.risk === null).length, tone: 'unknown' },
  ]
  const loading = merchantsQuery.isLoading || metricsQuery.isLoading || notificationsQuery.isLoading || plansQuery.isLoading
  const error = merchantsQuery.error ?? metricsQuery.error ?? notificationsQuery.error ?? plansQuery.error
  const cancellationValues = metrics.map((metric) => metric.cancellationRate)
  const prepValues = metrics.flatMap((metric) => metric.avgPrepTime === null ? [] : [metric.avgPrepTime])
  const ratingValues = metrics.flatMap((metric) => metric.avgRating === null ? [] : [metric.avgRating])
  const kpis = [
    { title: 'Restaurantes ativos', value: merchantsQuery.data ? number.format(activeCount) : '—', icon: Store, caption: 'status ativo', tone: 'blue' },
    { title: 'Em risco', value: merchantsQuery.data ? number.format(atRisk) : '—', icon: AlertTriangle, caption: 'a partir do score 60', tone: 'orange' },
    { title: 'Taxa de cancelamento', value: cancellationValues.length ? `${number.format(average(cancellationValues))}%` : '—', icon: TrendingDown, caption: 'período selecionado', tone: 'green' },
    { title: 'Tempo de preparo', value: prepValues.length ? `${number.format(average(prepValues))} min` : '—', icon: Clock3, caption: 'período selecionado', tone: 'purple' },
    { title: 'Avaliação média', value: ratingValues.length ? number.format(average(ratingValues)) : '—', icon: Star, caption: 'período selecionado', tone: 'yellow' },
  ]
  const cancellationAverage = average(chartData.map((metric) => metric.cancelamento))
  const prepAverage = average(chartData.map((metric) => metric.preparo))

  return <>
    <PageHeading eyebrow="DADOS DO SUPABASE" title="Visão geral" description="Acompanhe a saúde da sua carteira e antecipe riscos de churn." action={<label className="filter-select period-select"><CalendarDays size={14} /><span className="sr-only">Filtro de período</span><select aria-label="Período das métricas" value={periodDays} onChange={(event) => setPeriodDays(Number(event.target.value) as 7 | 30 | 90)}><option value={7}>Últimos 7 dias</option><option value={30}>Últimos 30 dias</option><option value={90}>Últimos 90 dias</option></select><ChevronDown size={13} /></label>} />
    {error && <QueryNotice loading={false} error={error} />}
    {!loading && !error && merchantsQuery.data?.length === 0 && <QueryNotice loading={false} empty emptyMessage="Nenhum restaurante retornado. Verifique os dados e as políticas RLS do Supabase." />}
    <section className="welcome-strip"><div className="welcome-icon"><Sparkles size={18} /></div><div><strong>O pulso da sua carteira, em tempo real.</strong><p>{loading ? 'Consultando merchants e indicadores...' : error ? 'Os dados ainda não estão disponíveis nesta sessão.' : !merchants.length ? 'Nenhum merchant foi retornado pelas consultas atuais.' : `${atRisk} merchants precisam de atenção com base no diagnóstico de risco.`}</p></div><Link href="/copilot" className="welcome-action">Ver resumo com IA <ArrowRight size={14} /></Link></section>
    <section className="action-overview" aria-label="Atalhos da visão geral"><Link href="/copilot" className="overview-shortcut"><span className="overview-icon overview-blue"><Sparkles size={17} /></span><div><strong>Copiloto</strong><span>Analisar a carteira</span></div></Link><Link href="/risk" className="overview-shortcut"><span className="overview-icon overview-orange"><AlertTriangle size={17} /></span><div><strong>{merchantsQuery.data ? number.format(atRisk) : '—'}</strong><span>Central de risco</span></div></Link><Link href="/notifications" className="overview-shortcut"><span className="overview-icon overview-green"><MessageSquareText size={17} /></span><div><strong>{notificationsQuery.data ? number.format(notifications.length) : '—'}</strong><span>Notificações do Slack</span></div></Link><Link href="/actions" className="overview-shortcut"><span className="overview-icon overview-red"><Target size={17} /></span><div><strong>{plansQuery.data ? number.format(openPlans.length) : '—'}</strong><span>Planos de ação</span></div></Link></section>
    <section className="kpi-grid" aria-label="Indicadores principais">{kpis.map(({ title, value, icon: Icon, caption, tone }) => <article className="metric-card" key={title}><div className="metric-top"><span>{title}</span><span className={`metric-icon tone-${tone}`}><Icon size={16} /></span></div><div className="metric-value">{value}</div><div className="metric-footer"><span>{caption}</span></div></article>)}</section>
    <section className="chart-grid"><article className="panel chart-panel"><div className="panel-heading"><div><h2>Taxa de cancelamento</h2><p>Indicadores registrados nos últimos {periodDays} dias</p></div><button className="icon-button" aria-label="Mais opções"><Ellipsis size={18} /></button></div><div className="chart-stat"><strong>{chartData.length ? `${number.format(cancellationAverage)}%` : '—'}</strong><small>média do histórico recente</small></div><CancellationChart data={chartData} /></article><article className="panel chart-panel"><div className="panel-heading"><div><h2>Tempo de preparo</h2><p>Média registrada em minutos</p></div><button className="icon-button" aria-label="Mais opções"><Ellipsis size={18} /></button></div><div className="chart-stat"><strong>{chartData.some((metric) => metric.preparo > 0) ? `${number.format(prepAverage)} min` : '—'}</strong><small>média do histórico recente</small></div><PrepTimeChart data={chartData} /></article></section>
    <section className="panel risk-distribution-panel"><div className="panel-heading"><div><h2>Distribuição de risco</h2><p>Score mais recente em ai_diagnoses</p></div><Link href="/risk" className="text-link">Ver central de risco <ArrowRight size={13} /></Link></div><div className="risk-distribution-content"><div className="risk-distribution-total"><strong>{merchantsQuery.data ? merchants.length : '—'}</strong><span>restaurantes monitorados</span></div><div className="risk-distribution-bar" role="img" aria-label={merchantsQuery.data ? `Distribuição: ${riskCounts.map((item) => `${item.value} ${item.label.toLowerCase()}`).join(', ')}` : 'Distribuição de risco indisponível'}><i className="bar-critical" style={{ width: `${merchants.length ? riskCounts[0].value / merchants.length * 100 : 0}%` }} /><i className="bar-high" style={{ width: `${merchants.length ? riskCounts[1].value / merchants.length * 100 : 0}%` }} /><i className="bar-medium" style={{ width: `${merchants.length ? riskCounts[2].value / merchants.length * 100 : 0}%` }} /><i className="bar-low" style={{ width: `${merchants.length ? riskCounts[3].value / merchants.length * 100 : 0}%` }} /><i className="bar-unknown" style={{ width: `${merchants.length ? riskCounts[4].value / merchants.length * 100 : 0}%` }} /></div><div className="risk-distribution-legend">{riskCounts.map((item) => <div key={item.label}><span className={`legend-dot legend-${item.tone}`} /><span>{item.label}</span><strong>{merchantsQuery.data ? number.format(item.value) : '—'}</strong></div>)}</div></div></section>
    <section className="bottom-grid"><article className="panel merchant-panel"><div className="panel-heading"><div><h2>Precisam de atenção</h2><p>Restaurantes com maior score de risco</p></div><Link href="/risk" className="text-link">Ver todos <ArrowRight size={13} /></Link></div><div className="table-wrap"><table className="data-table"><thead><tr><th>RESTAURANTE</th><th>RISCO</th><th>CANCELAMENTOS</th><th>AVALIAÇÃO</th><th /></tr></thead><tbody>{highRisk.map((merchant) => <tr key={merchant.id}><td><Link href={`/restaurants/${merchant.id}`} className="merchant-cell"><span className="merchant-logo">{merchant.initials}</span><span><strong>{merchant.name}</strong><small>{merchant.city}</small></span></Link></td><td><span className={`risk-pill ${riskClass(merchant.risk, merchant.riskLevel)}`}><span />{merchant.risk} · {riskLabel(merchant.risk, merchant.riskLevel)}</span></td><td className="table-number">{merchant.cancellation === null ? '—' : `${number.format(merchant.cancellation)}%`}</td><td><span className="rating-value"><Star size={13} fill="currentColor" /> {merchant.rating === null ? '—' : number.format(merchant.rating)}</span></td><td><Link className="row-arrow" href={`/restaurants/${merchant.id}`} aria-label={`Ver ${merchant.name}`}><ArrowRight size={15} /></Link></td></tr>)}{!loading && !error && highRisk.length === 0 && <tr><td colSpan={5} className="table-empty-cell">Nenhum diagnóstico de risco alto ou crítico.</td></tr>}</tbody></table></div><Link href="/restaurants" className="panel-footer-link">Explorar todos os restaurantes <ArrowRight size={14} /></Link></article><article className="panel activity-panel"><div className="panel-heading"><div><h2>Notificações do Slack</h2><p>Histórico em slack_notifications</p></div><Link href="/notifications" className="text-link">Abrir <ArrowRight size={13} /></Link></div><div className="activity-list">{notifications.map((notification) => <div className="activity-item" key={notification.id}><span className={`activity-icon ${notification.status === 'Enviada' ? 'activity-success' : notification.status === 'Falhou' ? 'activity-alert' : 'activity-action'}`}><MessageSquareText size={14} /></span><div className="activity-copy"><strong>{notification.actionTitle ?? notification.channel ?? 'Notificação Slack'}</strong><p>{notification.message}</p><small>{notification.status} · {notification.sentAt ? new Date(notification.sentAt).toLocaleString('pt-BR') : notification.createdAt ? new Date(notification.createdAt).toLocaleString('pt-BR') : 'Data não informada'}</small></div></div>)}{!loading && !error && notifications.length === 0 && <div className="activity-empty">Nenhuma notificação registrada.</div>}</div><div className="panel-footer-actions"><Link href="/notifications" className="panel-footer-link">Ver notificações do Slack <ArrowRight size={14} /></Link><Link href="/actions" className="panel-footer-link">Ver {plansQuery.data ? openPlans.length : ''} planos de ação <ArrowRight size={14} /></Link></div></article></section>
    <div className="dashboard-note"><span className={error ? 'demo-dot' : 'status-live'} /> {error ? 'Consultas do Supabase indisponíveis' : loading ? 'Sincronizando dados do Supabase' : 'Dados consultados do Supabase'} <span>·</span> Acesso controlado pelo projeto.</div>
  </>
}
