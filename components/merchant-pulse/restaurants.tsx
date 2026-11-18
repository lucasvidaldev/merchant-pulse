'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown, ChevronLeft, ChevronRight, Download, Filter, RotateCcw, Search, SlidersHorizontal, Star, X } from 'lucide-react'
import { riskClass, riskLabel, useMerchants } from '@/lib/merchant-data'
import { filterByOperation } from '@/lib/operation-scope'
import { useOperation } from './operation-context'
import { PageHeading } from './shell'
import { QueryNotice } from './query-state'

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const riskOptions = ['Todos', 'Crítico', 'Alto', 'Moderado', 'Saudável', 'Sem diagnóstico', 'Inativos']

export function RestaurantsPage() {
  const { data: merchants, error, isLoading } = useMerchants()
  const { operation } = useOperation()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [cityFilter, setCityFilter] = useState('Todas')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [sortField, setSortField] = useState<'risk' | 'name' | 'rating'>('risk')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const statusMenuRef = useRef<HTMLDivElement>(null)
  const perPage = 10

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const scopedMerchants = useMemo(
    () => filterByOperation(merchants ?? [], operation),
    [merchants, operation]
  )

  const cities = useMemo(
    () => ['Todas', ...Array.from(new Set(scopedMerchants.map((m) => m.city).filter(Boolean))).sort()],
    [scopedMerchants]
  )

  const categories = useMemo(
    () => ['Todas', ...Array.from(new Set(scopedMerchants.map((m) => m.category).filter((c): c is string => Boolean(c)))).sort()],
    [scopedMerchants]
  )

  const activeAdvancedCount = (cityFilter !== 'Todas' ? 1 : 0) + (categoryFilter !== 'Todas' ? 1 : 0)

  const filtered = useMemo(() => scopedMerchants.filter((merchant) => {
    const matchesQuery = `${merchant.name} ${merchant.city} ${merchant.category ?? ''} ${merchant.accountManager ?? ''}`.toLowerCase().includes(query.toLowerCase())
    const risk = riskClass(merchant.risk, merchant.riskLevel)
    const matchesRisk =
      filter === 'Todos' ||
      (filter === 'Crítico' && risk === 'risk-critical') ||
      (filter === 'Alto' && risk === 'risk-high') ||
      (filter === 'Moderado' && risk === 'risk-medium') ||
      (filter === 'Saudável' && risk === 'risk-low') ||
      (filter === 'Sem diagnóstico' && merchant.risk === null) ||
      (filter === 'Inativos' && merchant.status.toLowerCase() !== 'active')
    const matchesCity = cityFilter === 'Todas' || merchant.city === cityFilter
    const matchesCategory = categoryFilter === 'Todas' || merchant.category === categoryFilter
    return matchesQuery && matchesRisk && matchesCity && matchesCategory
  }).sort((a, b) => {
    const factor = sortDir === 'asc' ? 1 : -1
    if (sortField === 'name') return a.name.localeCompare(b.name) * factor
    if (sortField === 'rating') return ((a.rating ?? -1) - (b.rating ?? -1)) * factor
    return ((a.risk ?? -1) - (b.risk ?? -1)) * factor
  }), [categoryFilter, cityFilter, filter, query, scopedMerchants, sortDir, sortField])

  const pages = Math.max(1, Math.ceil(filtered.length / perPage))
  const rows = filtered.slice((page - 1) * perPage, page * perPage)
  const active = scopedMerchants.filter((merchant) => merchant.status.toLowerCase() === 'active').length
  const atRisk = scopedMerchants.filter((merchant) => ['risk-high', 'risk-critical'].includes(riskClass(merchant.risk, merchant.riskLevel))).length
  const healthy = scopedMerchants.filter((merchant) => riskClass(merchant.risk, merchant.riskLevel) === 'risk-low').length

  function toggleSort(field: 'risk' | 'name' | 'rating') {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortDir(field === 'name' ? 'asc' : 'desc')
    }
    setPage(1)
  }

  function renderSortIcon(field: 'risk' | 'name' | 'rating') {
    if (sortField !== field) return <ArrowUpDown size={12} style={{ opacity: 0.45 }} />
    return sortDir === 'asc'
      ? <ArrowUp size={12} style={{ color: '#3b82f6' }} />
      : <ArrowDown size={12} style={{ color: '#3b82f6' }} />
  }

  function exportCsv() {
    const csvRows = [['Nome', 'Cidade', 'Categoria', 'Responsável', 'Status', 'Score de risco', 'Nível de risco', 'Pedidos', 'Pedidos cancelados', 'Taxa de cancelamento', 'Tempo médio de preparo', 'Avaliação'], ...filtered.map((merchant) => [merchant.name, merchant.city, merchant.category ?? '', merchant.accountManager ?? '', merchant.status, merchant.risk ?? '', riskLabel(merchant.risk, merchant.riskLevel), merchant.orders ?? '', merchant.canceledOrders ?? '', merchant.cancellation ?? '', merchant.prepTime ?? '', merchant.rating ?? ''])]
    const csv = `\uFEFF${csvRows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\n')}`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'merchants-merchant-pulse.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return <>
    <PageHeading title="Restaurantes" description="Sua carteira em um só lugar. Monitore a saúde de cada parceiro." action={<button className="button-primary" onClick={exportCsv} disabled={!scopedMerchants.length}><Download size={15} /> Exportar</button>} />
    {error && <QueryNotice loading={false} error={error} />}
    <div className="list-summary"><div><strong>{isLoading ? '—' : number.format(active)}</strong><span>merchants ativos</span></div><span className="summary-separator" /><div><strong className="text-risk">{isLoading ? '—' : number.format(atRisk)}</strong><span>em risco</span></div><span className="summary-separator" /><div><strong className="text-positive">{isLoading ? '—' : number.format(healthy)}</strong><span>risco baixo</span></div><div className="summary-date">Consulta em tempo real <span className="status-live" /></div></div>

    <section className="panel restaurants-panel">
      <div className="table-toolbar">
        <label className="search-field">
          <Search size={16} />
          <input aria-label="Buscar merchant" placeholder="Buscar por nome, cidade, categoria ou responsável..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
          {query && <button aria-label="Limpar busca" onClick={() => setQuery('')}><X size={14} /></button>}
          <kbd>/</kbd>
        </label>

        <div className="toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div ref={statusMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="button-secondary button-compact"
              aria-expanded={statusMenuOpen}
              onClick={() => setStatusMenuOpen((prev) => !prev)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <Filter size={14} />
              <span>{filter}</span>
              <ChevronDown
                size={13}
                style={{
                  transition: 'transform 180ms ease',
                  transform: statusMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {statusMenuOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  minWidth: '185px',
                  zIndex: 40,
                  background: '#0f172a',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  borderRadius: '12px',
                  padding: '6px',
                  boxShadow: '0 16px 32px rgba(0, 0, 0, 0.45)',
                }}
              >
                {riskOptions.map((option) => {
                  const selected = option === filter
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setFilter(option)
                        setPage(1)
                        setStatusMenuOpen(false)
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

          <button
            type="button"
            className="button-secondary button-compact"
            onClick={() => setAdvancedOpen((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
              borderColor: advancedOpen || activeAdvancedCount > 0 ? 'rgba(59, 130, 246, 0.45)' : undefined,
              color: advancedOpen || activeAdvancedCount > 0 ? '#f8fafc' : undefined,
            }}
          >
            <SlidersHorizontal size={14} />
            <span>Filtros{activeAdvancedCount > 0 ? ` (${activeAdvancedCount})` : ''}</span>
          </button>
        </div>
      </div>

      {advancedOpen && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 18px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
            background: 'rgba(15, 23, 42, 0.55)',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>Cidade:</span>
            <select
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setPage(1) }}
              style={{
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid rgba(148, 163, 184, 0.22)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.8rem',
              }}
            >
              {cities.map((city) => <option key={city} value={city} style={{ background: '#0f172a', color: '#f8fafc' }}>{city}</option>)}
            </select>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
            <span>Categoria:</span>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
              style={{
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid rgba(148, 163, 184, 0.22)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.8rem',
              }}
            >
              {categories.map((cat) => <option key={cat} value={cat} style={{ background: '#0f172a', color: '#f8fafc' }}>{cat}</option>)}
            </select>
          </label>

          {(activeAdvancedCount > 0 || filter !== 'Todos' || query) && (
            <button
              type="button"
              onClick={() => {
                setFilter('Todos')
                setCityFilter('Todas')
                setCategoryFilter('Todas')
                setQuery('')
                setPage(1)
              }}
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'transparent',
                border: 'none',
                color: '#60a5fa',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={13} /> Limpar filtros
            </button>
          )}
        </div>
      )}

      {isLoading || error ? <QueryNotice loading={isLoading} error={error} /> : <>
        <div className="table-wrap">
          <table className="data-table restaurant-table">
            <thead>
              <tr>
                <th>
                  <button
                    onClick={() => toggleSort('name')}
                    title="Ordenar por nome do restaurante"
                    style={{ color: sortField === 'name' ? '#f8fafc' : undefined }}
                  >
                    MERCHANT {renderSortIcon('name')}
                  </button>
                </th>
                <th>CIDADE / RESPONSÁVEL</th>
                <th>
                  <button
                    onClick={() => toggleSort('risk')}
                    title="Ordenar por score de risco"
                    style={{ color: sortField === 'risk' ? '#f8fafc' : undefined }}
                  >
                    RISCO {renderSortIcon('risk')}
                  </button>
                </th>
                <th>PEDIDOS · ÚLTIMO DIA</th>
                <th>CANCELADOS</th>
                <th>
                  <button
                    onClick={() => toggleSort('rating')}
                    title="Ordenar por avaliação"
                    style={{ color: sortField === 'rating' ? '#f8fafc' : undefined }}
                  >
                    AVALIAÇÃO {renderSortIcon('rating')}
                  </button>
                </th>
                <th>STATUS</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((merchant) => (
                <tr key={merchant.id}>
                  <td><Link href={`/restaurants/${merchant.id}`} className="merchant-cell"><span className="merchant-logo">{merchant.initials}</span><span><strong>{merchant.name}</strong><small>{merchant.category ?? 'Sem categoria'}</small></span></Link></td>
                  <td className="location-cell">{merchant.city}<small>{merchant.accountManager ?? 'Sem responsável'}</small></td>
                  <td><span className={`risk-pill ${riskClass(merchant.risk, merchant.riskLevel)}`}><span />{riskLabel(merchant.risk, merchant.riskLevel)} {merchant.risk !== null && <b>{merchant.risk}</b>}</span></td>
                  <td className="table-number">{merchant.orders === null ? '—' : number.format(merchant.orders)}</td>
                  <td><span className={merchant.cancellation !== null && merchant.cancellation > 5 ? 'text-risk' : ''}>{merchant.canceledOrders === null || merchant.cancellation === null ? '—' : `${number.format(merchant.canceledOrders)} · ${number.format(merchant.cancellation)}%`}</span></td>
                  <td><span className="rating-value"><Star size={13} fill="currentColor" /> {merchant.rating === null ? '—' : number.format(merchant.rating)}</span></td>
                  <td>{merchant.status}</td>
                  <td><Link className="row-arrow" href={`/restaurants/${merchant.id}`} aria-label={`Abrir ${merchant.name}`}><ChevronRight size={16} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="empty-state"><Search size={19} /><strong>Nenhum merchant encontrado</strong><span>{scopedMerchants.length ? 'Tente outro nome ou ajuste os filtros.' : 'Cadastre merchants e métricas nas tabelas do Supabase.'}</span></div>}
        </div>
        <div className="table-pagination">
          <span>Exibindo <strong>{filtered.length ? (page - 1) * perPage + 1 : 0}–{Math.min(page * perPage, filtered.length)}</strong> de <strong>{filtered.length}</strong> resultados</span>
          <div className="pagination-controls">
            <button className="icon-button" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
            {Array.from({ length: pages }, (_, index) => <button key={index} onClick={() => setPage(index + 1)} className={`page-number ${page === index + 1 ? 'page-number-active' : ''}`}>{index + 1}</button>)}
            <button className="icon-button" aria-label="Próxima página" disabled={page >= pages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
          </div>
        </div>
      </>}
    </section>
    <div className="dashboard-note"><span className="status-live" /> Dados de merchants, diagnósticos e métricas diárias.</div>
  </>
}