'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Filter, Search, SlidersHorizontal, Star, X } from 'lucide-react'
import { riskClass, riskLabel, useMerchants } from '@/lib/merchant-data'
import { PageHeading } from './shell'
import { QueryNotice } from './query-state'

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

export function RestaurantsPage() {
  const { data: merchants, error, isLoading } = useMerchants()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [sort, setSort] = useState<'risk' | 'name' | 'rating'>('risk')
  const [page, setPage] = useState(1)
  const perPage = 10
  const filtered = useMemo(() => (merchants ?? []).filter((merchant) => {
    const matchesQuery = `${merchant.name} ${merchant.city} ${merchant.category ?? ''} ${merchant.accountManager ?? ''}`.toLowerCase().includes(query.toLowerCase())
    const risk = riskClass(merchant.risk, merchant.riskLevel)
    const matchesRisk = filter === 'Todos' || (filter === 'Crítico' && risk === 'risk-critical') || (filter === 'Alto' && risk === 'risk-high') || (filter === 'Saudável' && risk === 'risk-low') || (filter === 'Sem diagnóstico' && merchant.risk === null) || (filter === 'Inativos' && merchant.status.toLowerCase() !== 'active')
    return matchesQuery && matchesRisk
  }).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'rating' ? (b.rating ?? -1) - (a.rating ?? -1) : (b.risk ?? -1) - (a.risk ?? -1)), [filter, merchants, query, sort])
  const pages = Math.max(1, Math.ceil(filtered.length / perPage))
  const rows = filtered.slice((page - 1) * perPage, page * perPage)
  const active = (merchants ?? []).filter((merchant) => merchant.status.toLowerCase() === 'active').length
  const atRisk = (merchants ?? []).filter((merchant) => ['risk-high', 'risk-critical'].includes(riskClass(merchant.risk, merchant.riskLevel))).length
  const healthy = (merchants ?? []).filter((merchant) => riskClass(merchant.risk, merchant.riskLevel) === 'risk-low').length

  function toggleSort(field: 'risk' | 'name' | 'rating') { setSort(sort === field ? 'name' : field); setPage(1) }
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
    <PageHeading title="Restaurantes" description="Sua carteira em um só lugar. Monitore a saúde de cada parceiro." action={<button className="button-primary" onClick={exportCsv} disabled={!merchants?.length}><Download size={15} /> Exportar</button>} />
    {error && <QueryNotice loading={false} error={error} />}
    <div className="list-summary"><div><strong>{isLoading ? '—' : number.format(active)}</strong><span>merchants ativos</span></div><span className="summary-separator" /><div><strong className="text-risk">{isLoading ? '—' : number.format(atRisk)}</strong><span>em risco</span></div><span className="summary-separator" /><div><strong className="text-positive">{isLoading ? '—' : number.format(healthy)}</strong><span>risco baixo</span></div><div className="summary-date">Consulta em tempo real <span className="status-live" /></div></div>
    <section className="panel restaurants-panel"><div className="table-toolbar"><label className="search-field"><Search size={16} /><input aria-label="Buscar merchant" placeholder="Buscar por nome, cidade, categoria ou responsável..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />{query && <button aria-label="Limpar busca" onClick={() => setQuery('')}><X size={14} /></button>}<kbd>/</kbd></label><div className="toolbar-actions"><label className="filter-select"><Filter size={14} /><span className="sr-only">Filtrar por risco ou status</span><select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1) }}><option>Todos</option><option>Crítico</option><option>Alto</option><option>Saudável</option><option>Sem diagnóstico</option><option>Inativos</option></select><ChevronRight size={13} className="rotate-90" /></label><span className="button-secondary button-compact"><SlidersHorizontal size={14} /> Filtros</span></div></div>
      {isLoading || error ? <QueryNotice loading={isLoading} error={error} /> : <><div className="table-wrap"><table className="data-table restaurant-table"><thead><tr><th><button onClick={() => toggleSort('name')}>MERCHANT <ArrowUpDown size={12} /></button></th><th>CIDADE / RESPONSÁVEL</th><th><button onClick={() => toggleSort('risk')}>RISCO <ArrowUpDown size={12} /></button></th><th>PEDIDOS · ÚLTIMO DIA</th><th>CANCELADOS</th><th><button onClick={() => toggleSort('rating')}>AVALIAÇÃO <ArrowUpDown size={12} /></button></th><th>STATUS</th><th /></tr></thead><tbody>{rows.map((merchant) => <tr key={merchant.id}><td><Link href={`/restaurants/${merchant.id}`} className="merchant-cell"><span className="merchant-logo">{merchant.initials}</span><span><strong>{merchant.name}</strong><small>{merchant.category ?? 'Sem categoria'}</small></span></Link></td><td className="location-cell">{merchant.city}<small>{merchant.accountManager ?? 'Sem responsável'}</small></td><td><span className={`risk-pill ${riskClass(merchant.risk, merchant.riskLevel)}`}><span />{riskLabel(merchant.risk, merchant.riskLevel)} {merchant.risk !== null && <b>{merchant.risk}</b>}</span></td><td className="table-number">{merchant.orders === null ? '—' : number.format(merchant.orders)}</td><td><span className={merchant.cancellation !== null && merchant.cancellation > 5 ? 'text-risk' : ''}>{merchant.canceledOrders === null || merchant.cancellation === null ? '—' : `${number.format(merchant.canceledOrders)} · ${number.format(merchant.cancellation)}%`}</span></td><td><span className="rating-value"><Star size={13} fill="currentColor" /> {merchant.rating === null ? '—' : number.format(merchant.rating)}</span></td><td>{merchant.status}</td><td><Link className="row-arrow" href={`/restaurants/${merchant.id}`} aria-label={`Abrir ${merchant.name}`}><ChevronRight size={16} /></Link></td></tr>)}</tbody></table>{rows.length === 0 && <div className="empty-state"><Search size={19} /><strong>Nenhum merchant encontrado</strong><span>{merchants?.length ? 'Tente outro nome ou ajuste os filtros.' : 'Cadastre merchants e métricas nas tabelas do Supabase.'}</span></div>}</div><div className="table-pagination"><span>Exibindo <strong>{filtered.length ? (page - 1) * perPage + 1 : 0}–{Math.min(page * perPage, filtered.length)}</strong> de <strong>{filtered.length}</strong> resultados</span><div className="pagination-controls"><button className="icon-button" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>{Array.from({ length: pages }, (_, index) => <button key={index} onClick={() => setPage(index + 1)} className={`page-number ${page === index + 1 ? 'page-number-active' : ''}`}>{index + 1}</button>)}<button className="icon-button" aria-label="Próxima página" disabled={page >= pages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button></div></div></>}
    </section>
    <div className="dashboard-note"><span className="status-live" /> Dados de merchants, diagnósticos e métricas diárias.</div>
  </>
}
