'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, CircleAlert, Filter, Search, ShieldAlert, Star } from 'lucide-react'
import { riskClass, riskLabel, useDiagnoses, useMerchants } from '@/lib/merchant-data'
import { filterByOperation } from '@/lib/operation-scope'
import { useOperation } from './operation-context'
import { PageHeading } from './shell'
import { QueryNotice } from './query-state'

const riskFilterOptions = ['Crítico e alto', 'Crítico', 'Alto', 'Moderado', 'Baixo', 'Todos']

export function RiskPage() {
  const { operation } = useOperation()
  const merchantsQuery = useMerchants()
  const diagnosesQuery = useDiagnoses()
  const [filter, setFilter] = useState('Crítico e alto')
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

  const allMerchants = merchantsQuery.data ?? []
  const merchants = filterByOperation(allMerchants, operation)
  const diagnoses = diagnosesQuery.data ?? []
  const latestDiagnoses = new Map<string, (typeof diagnoses)[number]>()
  for (const diagnosis of diagnoses) {
    if (!latestDiagnoses.has(diagnosis.merchantId)) {
      latestDiagnoses.set(diagnosis.merchantId, diagnosis)
    }
  }

  const atRisk = useMemo(
    () =>
      merchants
        .filter((merchant) => {
          const level = riskClass(merchant.risk, merchant.riskLevel)
          const matchesRisk =
            filter === 'Todos' ||
            (filter === 'Crítico e alto' && ['risk-critical', 'risk-high'].includes(level)) ||
            (filter === 'Crítico' && level === 'risk-critical') ||
            (filter === 'Alto' && level === 'risk-high') ||
            (filter === 'Moderado' && level === 'risk-medium') ||
            (filter === 'Baixo' && level === 'risk-low')
          return (
            matchesRisk &&
            `${merchant.name} ${merchant.city} ${merchant.accountManager ?? ''}`
              .toLowerCase()
              .includes(search.toLowerCase())
          )
        })
        .sort((a, b) => (b.risk ?? -1) - (a.risk ?? -1)),
    [filter, merchants, search]
  )

  const loading = merchantsQuery.isLoading || diagnosesQuery.isLoading
  const error = merchantsQuery.error ?? diagnosesQuery.error
  const criticalCount = merchants.filter((merchant) => riskClass(merchant.risk, merchant.riskLevel) === 'risk-critical').length
  const highCount = merchants.filter((merchant) => riskClass(merchant.risk, merchant.riskLevel) === 'risk-high').length
  const diagnosedCount = merchants.filter((merchant) => merchant.risk !== null).length

  return (
    <>
      <PageHeading
        title="Central de risco"
        description="Priorize merchants com base no diagnóstico mais recente do Supabase."
        action={
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="button-secondary button-compact"
              aria-expanded={menuOpen}
              aria-label="Filtrar nível de risco"
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
                  minWidth: '185px',
                  zIndex: 40,
                  background: '#0f172a',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  borderRadius: '12px',
                  padding: '6px',
                  boxShadow: '0 16px 32px rgba(0, 0, 0, 0.45)',
                }}
              >
                {riskFilterOptions.map((option) => {
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
          <span className="overview-icon overview-red">
            <ShieldAlert size={17} />
          </span>
          <div>
            <strong>{loading ? '—' : criticalCount}</strong>
            <span>Risco crítico</span>
          </div>
        </article>
        <article>
          <span className="overview-icon overview-orange">
            <CircleAlert size={17} />
          </span>
          <div>
            <strong>{loading ? '—' : highCount}</strong>
            <span>Risco alto</span>
          </div>
        </article>
        <article>
          <span className="overview-icon overview-blue">
            <Star size={17} />
          </span>
          <div>
            <strong>{loading ? '—' : diagnosedCount}</strong>
            <span>Com diagnóstico</span>
          </div>
        </article>
        <article>
          <span className="overview-icon overview-green">
            <ShieldAlert size={17} />
          </span>
          <div>
            <strong>{loading ? '—' : merchants.length - diagnosedCount}</strong>
            <span>Sem diagnóstico</span>
          </div>
        </article>
      </section>
      <section className="panel risk-table-panel">
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={15} />
            <input
              aria-label="Buscar merchant em risco"
              placeholder="Buscar por merchant, cidade ou responsável..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        {loading || error ? (
          <QueryNotice loading={loading} error={error} />
        ) : (
          <div className="table-wrap">
            <table className="data-table risk-table">
              <thead>
                <tr>
                  <th>MERCHANT</th>
                  <th>CIDADE</th>
                  <th>SCORE</th>
                  <th>NÍVEL</th>
                  <th>DIAGNÓSTICO</th>
                  <th>ATUALIZADO</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {atRisk.map((merchant) => {
                  const diagnosis = latestDiagnoses.get(merchant.id)
                  return (
                    <tr key={merchant.id}>
                      <td>
                        <Link href={`/restaurants/${merchant.id}`} className="merchant-cell">
                          <span className="merchant-logo">{merchant.initials}</span>
                          <span>
                            <strong>{merchant.name}</strong>
                            <small>{merchant.category ?? 'Sem categoria'}</small>
                          </span>
                        </Link>
                      </td>
                      <td>{merchant.city}</td>
                      <td>{merchant.risk ?? '—'}</td>
                      <td>
                        <span className={`risk-pill ${riskClass(merchant.risk, merchant.riskLevel)}`}>
                          <span />
                          {riskLabel(merchant.risk, merchant.riskLevel)}
                        </span>
                      </td>
                      <td className="risk-diagnosis-cell">{diagnosis?.diagnosis ?? 'Diagnóstico indisponível'}</td>
                      <td>{diagnosis?.createdAt ? new Date(diagnosis.createdAt).toLocaleDateString('pt-BR') : '—'}</td>
                      <td>
                        <Link className="row-arrow" href={`/restaurants/${merchant.id}`} aria-label={`Ver ${merchant.name}`}>
                          <ArrowRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!atRisk.length && (
              <div className="empty-state">
                <ShieldAlert size={19} />
                <strong>Nenhum merchant corresponde ao filtro</strong>
                <span>{diagnosedCount ? 'Ajuste o nível de risco ou a busca.' : 'Ainda não há diagnósticos em ai_diagnoses para esta operação.'}</span>
              </div>
            )}
          </div>
        )}
      </section>
      <div className="dashboard-note">
        <span className="status-live" /> Scores e diagnósticos lidos de ai_diagnoses, filtrados pela operação selecionada.
      </div>
    </>
  )
}