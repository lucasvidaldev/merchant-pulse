'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, CircleAlert, Search, ShieldAlert, Star } from 'lucide-react'
import { riskClass, riskLabel, useDiagnoses, useMerchants } from '@/lib/merchant-data'
import { filterByOperation } from '@/lib/operation-scope'
import { useOperation } from './operation-context'
import { PageHeading } from './shell'
import { QueryNotice } from './query-state'

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

export function RiskPage() {
  const { operation } = useOperation()
  const merchantsQuery = useMerchants()
  const diagnosesQuery = useDiagnoses()
  const [filter, setFilter] = useState('Crítico e alto')
  const [search, setSearch] = useState('')
  const allMerchants = merchantsQuery.data ?? []
  const merchants = filterByOperation(allMerchants, operation)
  const diagnoses = diagnosesQuery.data ?? []
  const latestDiagnoses = new Map<string, (typeof diagnoses)[number]>()
  for (const diagnosis of diagnoses) if (!latestDiagnoses.has(diagnosis.merchantId)) latestDiagnoses.set(diagnosis.merchantId, diagnosis)
  const atRisk = useMemo(() => merchants.filter((merchant) => {
    const level = riskClass(merchant.risk, merchant.riskLevel)
    const matchesRisk = filter === 'Todos' || filter === 'Crítico e alto' && ['risk-critical', 'risk-high'].includes(level) || filter === 'Crítico' && level === 'risk-critical' || filter === 'Alto' && level === 'risk-high'
    return matchesRisk && `${merchant.name} ${merchant.city} ${merchant.accountManager ?? ''}`.toLowerCase().includes(search.toLowerCase())
  }).sort((a, b) => (b.risk ?? -1) - (a.risk ?? -1)), [filter, merchants, search])
  const loading = merchantsQuery.isLoading || diagnosesQuery.isLoading
  const error = merchantsQuery.error ?? diagnosesQuery.error
  const criticalCount = merchants.filter((merchant) => riskClass(merchant.risk, merchant.riskLevel) === 'risk-critical').length
  const highCount = merchants.filter((merchant) => riskClass(merchant.risk, merchant.riskLevel) === 'risk-high').length
  const diagnosedCount = merchants.filter((merchant) => merchant.risk !== null).length

  return <>
    <PageHeading title="Central de risco" description="Priorize merchants com base no diagnóstico mais recente do Supabase." action={<label className="filter-select risk-filter"><span className="sr-only">Filtrar risco</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>Crítico e alto</option><option>Crítico</option><option>Alto</option><option>Todos</option></select></label>} />
    {error && <QueryNotice loading={false} error={error} />}
    <section className="action-overview"><article><span className="overview-icon overview-red"><ShieldAlert size={17} /></span><div><strong>{loading ? '—' : criticalCount}</strong><span>Risco crítico</span></div></article><article><span className="overview-icon overview-orange"><CircleAlert size={17} /></span><div><strong>{loading ? '—' : highCount}</strong><span>Risco alto</span></div></article><article><span className="overview-icon overview-blue"><Star size={17} /></span><div><strong>{loading ? '—' : diagnosedCount}</strong><span>Com diagnóstico</span></div></article><article><span className="overview-icon overview-green"><ShieldAlert size={17} /></span><div><strong>{loading ? '—' : merchants.length - diagnosedCount}</strong><span>Sem diagnóstico</span></div></article></section>
    <section className="panel risk-table-panel"><div className="table-toolbar"><label className="search-field"><Search size={15} /><input aria-label="Buscar merchant em risco" placeholder="Buscar por merchant, cidade ou responsável..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>{loading || error ? <QueryNotice loading={loading} error={error} /> : <div className="table-wrap"><table className="data-table risk-table"><thead><tr><th>MERCHANT</th><th>CIDADE</th><th>SCORE</th><th>NÍVEL</th><th>DIAGNÓSTICO</th><th>ATUALIZADO</th><th /></tr></thead><tbody>{atRisk.map((merchant) => { const diagnosis = latestDiagnoses.get(merchant.id); return <tr key={merchant.id}><td><Link href={`/restaurants/${merchant.id}`} className="merchant-cell"><span className="merchant-logo">{merchant.initials}</span><span><strong>{merchant.name}</strong><small>{merchant.category ?? 'Sem categoria'}</small></span></Link></td><td>{merchant.city}</td><td>{merchant.risk ?? '—'}</td><td><span className={`risk-pill ${riskClass(merchant.risk, merchant.riskLevel)}`}><span />{riskLabel(merchant.risk, merchant.riskLevel)}</span></td><td className="risk-diagnosis-cell">{diagnosis?.diagnosis ?? 'Diagnóstico indisponível'}</td><td>{diagnosis?.createdAt ? new Date(diagnosis.createdAt).toLocaleDateString('pt-BR') : '—'}</td><td><Link className="row-arrow" href={`/restaurants/${merchant.id}`} aria-label={`Ver ${merchant.name}`}><ArrowRight size={15} /></Link></td></tr>})}</tbody></table>{!atRisk.length && <div className="empty-state"><ShieldAlert size={19} /><strong>Nenhum merchant corresponde ao filtro</strong><span>{diagnosedCount ? 'Ajuste o nível de risco ou a busca.' : 'Ainda não há diagnósticos em ai_diagnoses para esta operação.'}</span></div>}</div>}</section>
    <div className="dashboard-note"><span className="status-live" /> Scores e diagnósticos lidos de ai_diagnoses, filtrados pela operação selecionada.</div>
  </>
}
