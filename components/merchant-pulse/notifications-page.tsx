'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Check, CheckCircle2, ChevronDown, CircleAlert, Filter, Search } from 'lucide-react'
import { useMerchants, useSlackNotifications } from '@/lib/merchant-data'
import { filterByOperation } from '@/lib/operation-scope'
import { useOperation } from './operation-context'
import { PageHeading } from './shell'
import { QueryNotice } from './query-state'

const statusOptions = ['Todas', 'Pendente', 'Enviada', 'Falhou']

export function NotificationsPage() {
  const { operation } = useOperation()
  const { data: notifications, error, isLoading } = useSlackNotifications()
  const { data: merchants } = useMerchants()
  const [filter, setFilter] = useState('Todas')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const allowedMerchantIds = useMemo(() => {
    const scopedMerchants = filterByOperation(merchants ?? [], operation)
    return new Set(scopedMerchants.map((m) => m.id))
  }, [merchants, operation])

  const visible = useMemo(() => {
    return (notifications ?? []).filter((item) => {
      if (!item.merchantId) return false
      if (operation !== 'brasil' && merchants?.length && !allowedMerchantIds.has(item.merchantId)) {
        return false
      }
      const matchesStatus = filter === 'Todas' || item.status === filter
      const matchesQuery = `${item.message} ${item.channel ?? ''} ${item.merchant ?? ''} ${item.actionTitle ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
      return matchesStatus && matchesQuery
    })
  }, [allowedMerchantIds, filter, merchants?.length, notifications, operation, search])

  const sent = visible.filter((item) => item.status === 'Enviada').length
  const failed = visible.filter((item) => item.status === 'Falhou').length
  const pending = visible.filter((item) => item.status === 'Pendente').length

  return (
    <>
      <PageHeading
        title="Notificações do Slack"
        description="Histórico real de mensagens registradas em slack_notifications."
        action={
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="button-secondary button-compact"
              aria-expanded={menuOpen}
              aria-label="Filtrar status das notificações"
              onClick={() => setMenuOpen((prev) => !prev)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <Filter size={14} />
              <span>{filter}</span>
              <ChevronDown
                size={13}
                style={{
                  transition: 'transform 180ms ease',
                  transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  minWidth: '175px',
                  zIndex: 40,
                  background: '#0f172a',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  borderRadius: '12px',
                  padding: '6px',
                  boxShadow: '0 16px 32px rgba(0, 0, 0, 0.45)',
                }}
              >
                {statusOptions.map((option) => {
                  const selected = option === filter
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setFilter(option)
                        setMenuOpen(false)
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: selected ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                        color: selected ? '#f8fafc' : '#cbd5e1',
                        fontSize: '0.82rem',
                        fontWeight: selected ? 600 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span>{option}</span>
                      {selected && <Check size={14} style={{ color: '#3b82f6' }} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        }
      />
      {error && <QueryNotice loading={false} error={error} />}
      <section className="action-overview">
        <article>
          <span className="overview-icon overview-blue">
            <Bell size={17} />
          </span>
          <div>
            <strong>{isLoading ? '—' : visible.length}</strong>
            <span>Notificações encontradas</span>
          </div>
        </article>
        <article>
          <span className="overview-icon overview-green">
            <CheckCircle2 size={17} />
          </span>
          <div>
            <strong>{isLoading ? '—' : sent}</strong>
            <span>Enviadas</span>
          </div>
        </article>
        <article>
          <span className="overview-icon overview-orange">
            <CircleAlert size={17} />
          </span>
          <div>
            <strong>{isLoading ? '—' : pending}</strong>
            <span>Pendentes</span>
          </div>
        </article>
        <article>
          <span className="overview-icon overview-red">
            <CircleAlert size={17} />
          </span>
          <div>
            <strong>{isLoading ? '—' : failed}</strong>
            <span>Falhas</span>
          </div>
        </article>
      </section>
      <section className="panel notification-panel">
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={15} />
            <input
              aria-label="Buscar notificação"
              placeholder="Buscar mensagem, canal ou merchant..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        {isLoading || error ? (
          <QueryNotice loading={isLoading} error={error} />
        ) : (
          <div className="notification-list">
            {visible.map((item) => (
              <article className="notification-row" key={item.id}>
                <span
                  className={`activity-icon ${
                    item.status === 'Enviada'
                      ? 'activity-success'
                      : item.status === 'Falhou'
                      ? 'activity-alert'
                      : 'activity-action'
                  }`}
                >
                  <Bell size={14} />
                </span>
                <div className="notification-copy">
                  <div>
                    <strong>{item.actionTitle ?? item.channel ?? 'Notificação Slack'}</strong>
                    <span className={`notification-status notification-${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </div>
                  <p>{item.message}</p>
                  <small>
                    {item.merchant ?? 'Merchant sem vínculo'} · {item.channel ?? 'Canal não informado'} ·{' '}
                    {item.sentAt
                      ? new Date(item.sentAt).toLocaleString('pt-BR')
                      : item.createdAt
                      ? new Date(item.createdAt).toLocaleString('pt-BR')
                      : 'Data não informada'}
                  </small>
                </div>
              </article>
            ))}
            {!visible.length && (
              <div className="empty-state">
                <Bell size={18} />
                <strong>Nenhuma notificação encontrada</strong>
                <span>Confira o período e a operação selecionada.</span>
              </div>
            )}
          </div>
        )}
      </section>
      <div className="dashboard-note">
        <span className="status-live" /> Mensagens e status são lidos diretamente de slack_notifications.
      </div>
    </>
  )
}