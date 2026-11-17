'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, CheckCheck, ChevronDown, Clock3, Filter, MoreHorizontal, Plus, Search, Sparkles, Target, TrendingUp, UsersRound, Zap } from 'lucide-react'
import { average, buildDailyMetrics, createActionPlan, riskClass, updateActionPlanStatus, useActionPlans, useDiagnoses, useMerchants, useRestaurantMetrics, type ActionPlan } from '@/lib/merchant-data'
import { VolumeChart } from './charts'
import { PageHeading } from './shell'
import { QueryNotice } from './query-state'

export function AnalyticsPage() {
  const restaurantsQuery = useMerchants()
  const metricsQuery = useRestaurantMetrics()
  const diagnosesQuery = useDiagnoses()
  const plansQuery = useActionPlans()
  const merchants = restaurantsQuery.data ?? []
  const metrics = metricsQuery.data ?? []
  const weekly = buildDailyMetrics(metrics)
  const categoryGroups = new Map<string, typeof merchants>()
  for (const merchant of merchants) {
    const category = merchant.category ?? 'Sem categoria'
    categoryGroups.set(category, [...(categoryGroups.get(category) ?? []), merchant])
  }
  const categoryRows = [...categoryGroups.entries()].map(([label, items]) => {
    const scores = items.flatMap((merchant) => merchant.risk === null ? [] : [merchant.risk])
    return { label, count: items.length, score: scores.length ? Math.round(average(scores)) : null }
  }).sort((a, b) => b.count - a.count).slice(0, 5)
  const orders = metrics.reduce((total, metric) => total + metric.totalOrders, 0)
  const canceledOrders = metrics.reduce((total, metric) => total + metric.canceledOrders, 0)
  const averagePrep = average(metrics.map((metric) => metric.avgPrepTime))
  const averageCancellation = average(metrics.map((metric) => metric.cancellationRate))
  const averageRating = average(metrics.map((metric) => metric.avgRating))
  const hasPrepTime = metrics.some((metric) => metric.avgPrepTime !== null)
  const hasRating = metrics.some((metric) => metric.avgRating !== null)
  const ordersPerMerchant = merchants.length && metrics.length ? orders / merchants.length : 0
  const comparison = [
    { name: 'Tempo médio de preparo', current: hasPrepTime ? `${averagePrep.toFixed(1)} min` : '—', width: Math.min(100, averagePrep / 60 * 100) },
    { name: 'Taxa média de cancelamento', current: metrics.length ? `${averageCancellation.toFixed(1)}%` : '—', width: Math.min(100, averageCancellation * 10) },
    { name: 'Avaliação média', current: hasRating ? averageRating.toFixed(1) : '—', width: Math.min(100, averageRating / 5 * 100) },
    { name: 'Pedidos por merchant', current: metrics.length && merchants.length ? `${ordersPerMerchant.toFixed(1)} no período` : '—', width: Math.min(100, ordersPerMerchant / 100 * 100) },
  ]
  const loading = restaurantsQuery.isLoading || metricsQuery.isLoading || diagnosesQuery.isLoading || plansQuery.isLoading
  const error = restaurantsQuery.error ?? metricsQuery.error ?? diagnosesQuery.error ?? plansQuery.error
  const merchantsAtRisk = merchants.filter((merchant) => ['risk-high', 'risk-critical'].includes(riskClass(merchant.risk, merchant.riskLevel))).length

  return <>
    <PageHeading title="Análises" description="Entenda tendências operacionais e compare a saúde da sua carteira." action={<span className="button-secondary">Histórico disponível</span>} />
    {error && <QueryNotice loading={false} error={error} />}
    <section className="analysis-summary-grid"><article className="analysis-stat"><span>Pedidos registrados</span><strong>{metrics.length ? orders.toLocaleString('pt-BR') : '—'}</strong><small className="stat-positive">Total de pedidos no histórico</small></article><article className="analysis-stat"><span>Pedidos cancelados</span><strong>{metrics.length ? canceledOrders.toLocaleString('pt-BR') : '—'}</strong><small className="stat-positive">Cancelamentos registrados</small></article><article className="analysis-stat"><span>Diagnósticos de IA</span><strong>{diagnosesQuery.data ? diagnosesQuery.data.length.toLocaleString('pt-BR') : '—'}</strong><small className="stat-positive">Diagnósticos vinculados a merchants</small></article><article className="analysis-stat"><span>Planos de ação ativos</span><strong>{plansQuery.data ? plansQuery.data.filter((plan) => plan.status === 'Pendente' || plan.status === 'Em andamento').length.toLocaleString('pt-BR') : '—'}</strong><small className="stat-positive">Aguardando ou em andamento</small></article></section>
    {loading && <QueryNotice loading />}
    {!loading && !error && !merchants.length && <QueryNotice loading={false} empty emptyMessage="Ainda não há merchants ou métricas disponíveis no Supabase." />}
    <section className="analysis-main-grid"><article className="panel chart-panel"><div className="panel-heading"><div><h2>Volume de pedidos</h2><p>Pedidos agrupados por dia · últimos 7 dias</p></div><button className="icon-button" aria-label="Mais opções"><MoreHorizontal size={17} /></button></div><div className="chart-stat"><strong>{weekly.length ? weekly.reduce((total, item) => total + item.pedidos, 0).toLocaleString('pt-BR') : '—'}</strong><small>pedidos no período recente</small></div><VolumeChart data={weekly} /></article><article className="panel category-panel"><div className="panel-heading"><div><h2>Saúde por categoria</h2><p>Score médio do diagnóstico mais recente</p></div></div><div className="category-bars">{categoryRows.map((item) => <div className="category-row" key={item.label}><div><span>{item.label}</span><small>{item.count} merchants</small></div><div className="category-meter"><i className={(item.score ?? 0) > 60 ? 'meter-risk' : (item.score ?? 0) > 40 ? 'meter-warn' : 'meter-good'} style={{ width: `${item.score ?? 0}%` }} /></div><b>{item.score ?? '—'}</b></div>)}{!categoryRows.length && !loading && <div className="empty-state"><span>Sem categorias cadastradas.</span></div>}</div><div className="category-note"><Sparkles size={14} />{categoryRows[0] ? `${categoryRows[0].label} tem mais registros nesta carteira.` : 'A análise por categoria aparecerá após a primeira sincronização.'}</div></article></section>
    <section className="analysis-bottom-grid"><article className="panel"><div className="panel-heading"><div><h2>Indicadores operacionais</h2><p>Médias atuais de daily_metrics</p></div><span className="button-secondary button-compact"><Filter size={13} /> Fonte conectada</span></div><div className="comparison-list">{comparison.map((metric) => <div className="comparison-row" key={metric.name}><div><span>{metric.name}</span><strong>{merchants.length ? metric.current : '—'}</strong><small className="text-positive">atual</small></div><div className="comparison-track"><i style={{ width: `${metric.width}%` }} /></div></div>)}</div></article><article className="panel insight-panel"><div className="insight-panel-icon"><Sparkles size={16} /></div><div className="panel-heading"><div><h2>Leitura do período</h2><p>Indicadores agregados da carteira</p></div></div><p>{weekly.length ? <>Foram registrados <strong>{weekly.reduce((total, item) => total + item.pedidos, 0).toLocaleString('pt-BR')} pedidos</strong> nos últimos sete dias e <strong>{merchantsAtRisk} merchants</strong> com score de risco a partir de 60.</> : 'Não há métricas nos sete dias mais recentes do histórico consultado.'}</p><Link href="/copilot" className="text-link">Explorar com o Copiloto IA <ArrowRight size={13} /></Link></article></section>
    <div className="dashboard-note"><span className="status-live" /> Análises calculadas a partir das tabelas do Supabase.</div>
  </>
}

export function ActionPlansPage() {
  const plansQuery = useActionPlans()
  const diagnosesQuery = useDiagnoses()
  const plans = plansQuery.data
  const latestDiagnosis = diagnosesQuery.data?.[0]
  const error = plansQuery.error ?? diagnosesQuery.error
  const isLoading = plansQuery.isLoading || diagnosesQuery.isLoading
  const mutate = plansQuery.mutate
  const [filter, setFilter] = useState('Todos')
  const [search, setSearch] = useState('')
  const [actionError, setActionError] = useState('')
  const [saving, setSaving] = useState(false)
  const currentPlans = plans ?? []
  const shownPlans = useMemo(() => currentPlans.filter((plan) => (filter === 'Todos' || plan.status === filter) && `${plan.title} ${plan.merchant} ${plan.responsible ?? ''}`.toLowerCase().includes(search.toLowerCase())), [currentPlans, filter, search])
  const priorityClass = { Baixa: 'green', Média: 'yellow', Alta: 'orange', Crítica: 'red' }

  async function cycleStatus(id: string, current: ActionPlan['status']) {
    const nextStatus: Record<ActionPlan['status'], ActionPlan['status']> = { Pendente: 'Em andamento', 'Em andamento': 'Concluído', 'Concluído': 'Cancelado', 'Cancelado': 'Pendente' }
    const next = nextStatus[current]
    setActionError('')
    setSaving(true)
    try {
      await updateActionPlanStatus(id, next)
      await mutate()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o plano.')
    } finally {
      setSaving(false)
    }
  }

  async function addPlan() {
    setActionError('')
    if (!latestDiagnosis) {
      setActionError('É necessário ter um diagnóstico de IA antes de criar um plano de ação.')
      return
    }
    setSaving(true)
    try {
      await createActionPlan(latestDiagnosis.id)
      await mutate()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível criar o plano.')
    } finally {
      setSaving(false)
    }
  }

  return <>
    <PageHeading title="Planos de ação" description="Transforme sinais de risco em próximos passos claros." action={<button className="button-primary" onClick={addPlan} disabled={saving || !latestDiagnosis}><Plus size={15} /> Novo plano</button>} />
    {error && <QueryNotice loading={false} error={error} />}
    {actionError && <div className="query-state query-state-error" role="alert">{actionError}</div>}
    <section className="action-overview"><article><span className="overview-icon overview-blue"><Target size={17} /></span><div><strong>{isLoading ? '—' : currentPlans.filter((plan) => plan.status !== 'Concluído' && plan.status !== 'Cancelado').length.toString().padStart(2, '0')}</strong><span>Planos ativos</span></div></article><article><span className="overview-icon overview-orange"><Clock3 size={17} /></span><div><strong>{isLoading ? '—' : currentPlans.filter((plan) => plan.status === 'Em andamento').length.toString().padStart(2, '0')}</strong><span>Em andamento</span></div></article><article><span className="overview-icon overview-green"><CheckCheck size={17} /></span><div><strong>{isLoading ? '—' : currentPlans.filter((plan) => plan.status === 'Concluído').length.toString().padStart(2, '0')}</strong><span>Concluídos</span></div></article><article><span className="overview-icon overview-red"><Zap size={17} /></span><div><strong>{isLoading ? '—' : currentPlans.filter((plan) => plan.priority === 'Crítica' && plan.status !== 'Concluído' && plan.status !== 'Cancelado').length.toString().padStart(2, '0')}</strong><span>Com prioridade crítica</span></div></article></section>
    <section className="panel action-table-panel"><div className="table-toolbar"><label className="search-field"><Search size={15} /><input aria-label="Buscar plano de ação" placeholder="Buscar por plano, restaurante ou responsável..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="filter-select"><Filter size={14} /><span className="sr-only">Filtrar planos</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>Todos</option><option>Pendente</option><option>Em andamento</option><option>Concluído</option><option>Cancelado</option></select><ChevronDown size={13} /></label></div><div className="table-wrap">{isLoading || error ? <QueryNotice loading={isLoading} error={error} /> : <><table className="data-table action-table"><thead><tr><th>PLANO DE AÇÃO</th><th>RESTAURANTE</th><th>PRIORIDADE</th><th>RESPONSÁVEL</th><th>PRAZO</th><th>STATUS</th><th /></tr></thead><tbody>{shownPlans.map((plan) => <tr key={plan.id}><td><div className="action-title-cell"><strong>{plan.title}</strong><small>Criado em {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('pt-BR') : '—'}</small></div></td><td>{plan.merchant}</td><td><span className={`priority-label priority-${priorityClass[plan.priority]}`}><i />{plan.priority}</span></td><td><span className="assignee-cell"><span className="assignee-avatar">{plan.responsible ? plan.responsible.split(' ').map((part) => part[0]).slice(0, 2).join('') : '—'}</span>{plan.responsible || 'Não atribuído'}</span></td><td>{plan.dueDate ? new Date(`${plan.dueDate}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Sem prazo'}</td><td><button className={`status-button status-${plan.status.toLowerCase().replace(' ', '-')}`} onClick={() => cycleStatus(plan.id, plan.status)} disabled={saving} title="Alterar status">{plan.status === 'Concluído' && <Check size={12} />}{plan.status}</button></td><td><button className="icon-button" aria-label="Mais opções"><MoreHorizontal size={16} /></button></td></tr>)}</tbody></table>{shownPlans.length === 0 && <div className="empty-state"><Search size={19} /><strong>Nenhum plano encontrado</strong><span>{currentPlans.length ? 'Altere os filtros para ver outros planos.' : 'Cadastre planos de ação para acompanhar a carteira.'}</span></div>}</>}</div></section>
    <div className="dashboard-note"><span className="status-live" /> Planos consultados e atualizados no Supabase.</div>
  </>
}

export function SettingsPage() {
  return <>
    <PageHeading title="Configurações" description="Gerencie seu espaço de trabalho, conta e integrações." />
    <div className="settings-layout"><aside className="settings-nav"><a className="settings-nav-active" href="#conta"><UsersRound size={15} /> Conta</a><a href="#integracoes"><Zap size={15} /> Integrações</a><a href="#notificacoes"><Clock3 size={15} /> Notificações</a></aside><div className="settings-content"><section className="panel settings-panel" id="conta"><div className="panel-heading"><div><h2>Perfil da conta</h2><p>Informações do seu espaço de trabalho.</p></div><button className="button-secondary button-compact">Editar perfil</button></div><div className="account-row"><span className="user-avatar user-avatar-large">MC</span><div><strong>Marina Costa</strong><span>marina.costa@merchantpulse.com</span></div><span className="account-role">Gerente de operações</span></div><div className="setting-field-grid"><label><span>Aplicação</span><input readOnly value="Merchant Pulse" /></label><label><span>Controle de acesso</span><input readOnly value="Políticas do Supabase" /></label></div></section><section className="panel settings-panel" id="integracoes"><div className="panel-heading"><div><h2>Integrações</h2><p>Conexões usadas para alimentar e automatizar sua operação.</p></div></div><div className="integration-list"><div className="integration-item"><span className="integration-logo supabase-logo">S</span><div className="integration-copy"><strong>Supabase</strong><span>Banco de dados e autenticação</span></div><span className="integration-status status-connected"><i />Conectado</span><button className="integration-action">Ver status</button></div><div className="integration-warning"><Zap size={15} /><div><strong>Verifique o acesso ao schema Merchant Pulse</strong><span>As consultas usam merchants, daily_metrics, ai_diagnoses, action_plans e slack_notifications. Confirme colunas e políticas RLS; o app não altera o schema.</span></div></div><div className="integration-item"><span className="integration-logo n8n-logo">n8n</span><div className="integration-copy"><strong>n8n</strong><span>Automação de fluxos e ingestão de dados</span></div><span className="integration-status status-disconnected"><i />Não conectado</span><button className="integration-action">Configurar</button></div><div className="integration-item"><span className="integration-logo ai-logo"><Sparkles size={15} /></span><div className="integration-copy"><strong>Vercel AI Gateway</strong><span>Modelos de linguagem para análises e copiloto</span></div><span className="integration-status status-attention"><i />Crédito necessário</span><a className="integration-action" href="https://vercel.com/ol-ucas-dev/~/ai?modal=add-credit-card" target="_blank" rel="noreferrer">Configurar</a></div><div className="integration-warning"><Zap size={15} /><div><strong>Configure cobrança para usar o Copiloto</strong><span>A integração está ativa, mas o Gateway exige um cartão de crédito válido para processar solicitações.</span></div></div></div></section><section className="panel settings-panel" id="notificacoes"><div className="panel-heading"><div><h2>Notificações</h2><p>Alertas para os sinais mais importantes da carteira.</p></div></div><div className="notification-setting"><div><strong>Alertas de risco elevado</strong><span>Receba um aviso quando um restaurante entrar em risco crítico.</span></div><span className="switch-on" role="switch" aria-checked="true" tabIndex={0}><i /></span></div><div className="notification-setting"><div><strong>Resumo semanal</strong><span>Uma visão consolidada da sua carteira toda segunda-feira.</span></div><span className="switch-on" role="switch" aria-checked="true" tabIndex={0}><i /></span></div></section></div></div>
    <div className="dashboard-note"><span className="demo-dot" /> Configuração do workspace <span>·</span> Esta tela reflete o estado atual das integrações conectadas ao projeto.</div>
  </>
}
