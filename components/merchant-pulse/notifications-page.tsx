'use client'

import { useMemo, useState } from 'react'
import { Bell, CheckCircle2, CircleAlert, Filter, Search } from 'lucide-react'
import { useSlackNotifications } from '@/lib/merchant-data'
import { filterByOperation } from '@/lib/operation-scope'
import { useOperation } from './operation-context'
import { PageHeading } from './shell'
import { QueryNotice } from './query-state'

export function NotificationsPage() {
  const { operation } = useOperation()
  const { data: notifications, error, isLoading } = useSlackNotifications()
  const [filter, setFilter] = useState('Todas')
  const [search, setSearch] = useState('')
  const visible = useMemo(() => {
    const scoped = filterByOperation((notifications ?? []).filter((item) => item.merchantId !== null), operation)
    return scoped.filter((item) => (filter === 'Todas' || item.status === filter) && `${item.message} ${item.channel ?? ''} ${item.merchant ?? ''} ${item.actionTitle ?? ''}`.toLowerCase().includes(search.toLowerCase()))
  }, [filter, notifications, operation, search])
  const sent = visible.filter((item) => item.status === 'Enviada').length
  const failed = visible.filter((item) => item.status === 'Falhou').length
  const pending = visible.filter((item) => item.status === 'Pendente').length

  return <>
    <PageHeading title="Notificações do Slack" description="Histórico real de mensagens registradas em slack_notifications." action={<label className="filter-select risk-filter"><Filter size={14} /><span className="sr-only">Filtrar status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>Todas</option><option>Pendente</option><option>Enviada</option><option>Falhou</option></select></label>} />
    {error && <QueryNotice loading={false} error={error} />}
    <section className="action-overview"><article><span className="overview-icon overview-blue"><Bell size={17} /></span><div><strong>{isLoading ? '—' : visible.length}</strong><span>Notificações encontradas</span></div></article><article><span className="overview-icon overview-green"><CheckCircle2 size={17} /></span><div><strong>{isLoading ? '—' : sent}</strong><span>Enviadas</span></div></article><article><span className="overview-icon overview-orange"><CircleAlert size={17} /></span><div><strong>{isLoading ? '—' : pending}</strong><span>Pendentes</span></div></article><article><span className="overview-icon overview-red"><CircleAlert size={17} /></span><div><strong>{isLoading ? '—' : failed}</strong><span>Falhas</span></div></article></section>
    <section className="panel notification-panel"><div className="table-toolbar"><label className="search-field"><Search size={15} /><input aria-label="Buscar notificação" placeholder="Buscar mensagem, canal ou merchant..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>{isLoading || error ? <QueryNotice loading={isLoading} error={error} /> : <div className="notification-list">{visible.map((item) => <article className="notification-row" key={item.id}><span className={`activity-icon ${item.status === 'Enviada' ? 'activity-success' : item.status === 'Falhou' ? 'activity-alert' : 'activity-action'}`}><Bell size={14} /></span><div className="notification-copy"><div><strong>{item.actionTitle ?? item.channel ?? 'Notificação Slack'}</strong><span className={`notification-status notification-${item.status.toLowerCase()}`}>{item.status}</span></div><p>{item.message}</p><small>{item.merchant ?? 'Merchant sem vínculo'} · {item.channel ?? 'Canal não informado'} · {item.sentAt ? new Date(item.sentAt).toLocaleString('pt-BR') : new Date(item.createdAt).toLocaleString('pt-BR')}</small></div></article>)}{!visible.length && <div className="empty-state"><Bell size={18} /><strong>Nenhuma notificação encontrada</strong><span>Confira o período e a operação selecionada.</span></div>}</div>}</section>
    <div className="dashboard-note"><span className="status-live" /> Mensagens e status são lidos diretamente de slack_notifications.</div>
  </>
}
