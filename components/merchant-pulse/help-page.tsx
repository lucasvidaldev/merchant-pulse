'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Database,
  Layers,
  MessageCircleQuestion,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
  X,
} from 'lucide-react'
import { PageHeading } from './shell'

type GuideItem = {
  id: string
  category: 'Métricas & Risco' | 'Automação & Dados' | 'IA & Operação'
  icon: typeof ShieldCheck
  accent: string
  title: string
  summary: string
  details: string
  linkHref: string
  linkLabel: string
}

const guides: GuideItem[] = [
  {
    id: 'risk-score',
    category: 'Métricas & Risco',
    icon: ShieldCheck,
    accent: '#ef4444',
    title: 'Como interpretar o Score de Risco?',
    summary: 'Entenda como o score (0–100) e os níveis Crítico, Alto, Moderado e Baixo são calculados.',
    details:
      'O score e o nível exibidos vêm do diagnóstico mais recente na tabela ai_diagnoses (risk_score, risk_level e root_causes), cruzando taxa de cancelamento, tempo médio de preparo e avaliação dos clientes. Valores acima de 80 indicam risco crítico imediato.',
    linkHref: '/risk',
    linkLabel: 'Abrir Central de risco',
  },
  {
    id: 'copilot-context',
    category: 'IA & Operação',
    icon: Sparkles,
    accent: '#3b82f6',
    title: 'Quais dados o Copiloto IA utiliza?',
    summary: 'Consultas em tempo real sobre a carteira antes de gerar diagnósticos ou recomendações.',
    details:
      'O Copiloto consulta merchants, daily_metrics, ai_diagnoses, action_plans e slack_notifications diretamente do Supabase. Todas as respostas são ancoradas nos registros reais da unidade operacional selecionada.',
    linkHref: '/copilot',
    linkLabel: 'Conversar com o Copiloto',
  },
  {
    id: 'n8n-ingestion',
    category: 'Automação & Dados',
    icon: Workflow,
    accent: '#10b981',
    title: 'Como funciona a ingestão via n8n?',
    summary: 'Pipeline automatizado de métricas diárias, diagnósticos e alertas no Slack.',
    details:
      'Fluxos externos (como workflows no n8n) gravam métricas operacionais em daily_metrics e disparam análises em ai_diagnoses. Quando um merchant atinge risco elevado, um plano de ação pode ser aberto e notificado em slack_notifications.',
    linkHref: '/settings#integracoes',
    linkLabel: 'Ver integrações',
  },
  {
    id: 'slack-logs',
    category: 'Automação & Dados',
    icon: MessageCircleQuestion,
    accent: '#f59e0b',
    title: 'Como acompanhar alertas do Slack?',
    summary: 'Auditoria completa de mensagens enviadas, pendentes ou com falha de entrega.',
    details:
      'A tela de Notificações exibe todos os eventos registrados em slack_notifications com canal de destino, merchant vinculado, plano de ação associado e timestamp de envio.',
    linkHref: '/notifications',
    linkLabel: 'Ver notificações',
  },
  {
    id: 'action-plans',
    category: 'IA & Operação',
    icon: Target,
    accent: '#8b5cf6',
    title: 'Como gerenciar Planos de Ação?',
    summary: 'Ciclo de execução desde a detecção do risco até a resolução pelo responsável.',
    details:
      'Cada plano de ação nasce vinculado a um diagnóstico de IA e pode avançar entre Pendente, Em andamento e Concluído diretamente na tabela, atualizando o status em tempo real no banco.',
    linkHref: '/actions',
    linkLabel: 'Ir para Planos de ação',
  },
  {
    id: 'operation-scope',
    category: 'Métricas & Risco',
    icon: Layers,
    accent: '#06b6d4',
    title: 'Como funciona o filtro de Operação?',
    summary: 'Segmentação regional rápida entre Brasil, Sudeste e Sul no menu lateral.',
    details:
      'Ao alternar a unidade operacional no seletor superior da barra lateral, todas as visões (Restaurantes, Central de risco, Notificações e KPIs) passam a refletir apenas as praças daquela região.',
    linkHref: '/restaurants',
    linkLabel: 'Explorar restaurantes',
  },
]

const categories = ['Todas', 'Métricas & Risco', 'IA & Operação', 'Automação & Dados'] as const

export function HelpPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('Todas')
  const [expandedId, setExpandedId] = useState<string | null>('risk-score')

  const filteredGuides = useMemo(() => {
    return guides.filter((item) => {
      const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory
      const matchesSearch = `${item.title} ${item.summary} ${item.details} ${item.category}`
        .toLowerCase()
        .includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [search, selectedCategory])

  return (
    <>
      <Link href="/" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <ArrowLeft size={15} /> Voltar à visão geral
      </Link>

      <PageHeading
        title="Central de ajuda"
        description="Documentação operacional, arquitetura de dados e guias rápidos do Merchant Pulse."
        action={
          <Link href="/copilot" className="button-primary">
            <Sparkles size={15} /> Perguntar ao Copiloto
          </Link>
        }
      />

      {/* Barra de busca e filtros por categoria */}
      <section className="panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <label className="search-field" style={{ flex: '1 1 280px', maxWidth: '420px' }}>
            <Search size={15} />
            <input
              aria-label="Buscar na central de ajuda"
              placeholder="Buscar por score de risco, n8n, Slack, Copiloto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" aria-label="Limpar busca" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {categories.map((cat) => {
              const active = selectedCategory === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className="button-secondary button-compact"
                  style={{
                    cursor: 'pointer',
                    background: active ? 'rgba(59, 130, 246, 0.16)' : undefined,
                    borderColor: active ? 'rgba(59, 130, 246, 0.45)' : undefined,
                    color: active ? '#f8fafc' : undefined,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Grid de tópicos */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {filteredGuides.map((item) => {
          const Icon = item.icon
          const isOpen = expandedId === item.id
          return (
            <article
              key={item.id}
              className="panel"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                borderColor: isOpen ? 'rgba(59, 130, 246, 0.35)' : undefined,
                transition: 'border-color 180ms ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${item.accent}1f`,
                      color: item.accent,
                      border: `1px solid ${item.accent}33`,
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: 'rgba(148, 163, 184, 0.1)',
                      color: '#94a3b8',
                    }}
                  >
                    {item.category}
                  </span>
                </div>

                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                  {item.title}
                </h2>
                <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.55 }}>
                  {item.summary}
                </p>

                {isOpen && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(148, 163, 184, 0.12)',
                      fontSize: '0.83rem',
                      color: '#cbd5e1',
                      lineHeight: 1.6,
                    }}
                  >
                    {item.details}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : item.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <span>{isOpen ? 'Ocultar detalhes' : 'Ler detalhes'}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transition: 'transform 180ms ease',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>

                <Link href={item.linkHref} className="text-link" style={{ fontSize: '0.8rem' }}>
                  {item.linkLabel} <ArrowRight size={13} />
                </Link>
              </div>
            </article>
          )
        })}

        {filteredGuides.length === 0 && (
          <div className="panel empty-state" style={{ gridColumn: '1 / -1' }}>
            <Search size={19} />
            <strong>Nenhum tópico encontrado</strong>
            <span>Tente buscar por outro termo ou selecione todas as categorias.</span>
          </div>
        )}
      </section>

      {/* Arquitetura / Fluxo de dados */}
      <section className="panel" style={{ padding: '20px', marginBottom: '16px' }}>
        <div className="panel-heading" style={{ marginBottom: '16px' }}>
          <div>
            <h2>Arquitetura do fluxo operacional</h2>
            <p>Como os dados percorrem o Merchant Pulse até virarem ação.</p>
          </div>
          <span className="button-secondary button-compact">
            <Database size={13} /> Stack conectada
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '12px',
          }}
        >
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#f8fafc', marginBottom: '4px' }}>
              <Workflow size={15} style={{ color: '#10b981' }} /> 1. Ingestão (n8n)
            </strong>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, display: 'block' }}>
              Coleta pedidos, tempos de preparo, cancelamentos e avaliações para o Supabase.
            </span>
          </div>

          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#f8fafc', marginBottom: '4px' }}>
              <ShieldAlert size={15} style={{ color: '#ef4444' }} /> 2. Diagnóstico & Risco
            </strong>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, display: 'block' }}>
              Classifica cada unidade em Crítico, Alto, Moderado ou Baixo com causas raiz.
            </span>
          </div>

          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#f8fafc', marginBottom: '4px' }}>
              <Sparkles size={15} style={{ color: '#3b82f6' }} /> 3. Copiloto & Ação
            </strong>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, display: 'block' }}>
              Gera planos de ação priorizados e dispara alertas operacionais para o time.
            </span>
          </div>
        </div>
      </section>

      <section className="panel help-footer">
        <div>
          <BookOpen size={17} />
          <div>
            <strong>Precisa investigar um restaurante específico?</strong>
            <span>Use o Copiloto IA para cruzar métricas, diagnósticos e planos abertos em segundos.</span>
          </div>
        </div>
        <Link href="/copilot" className="text-link">
          Abrir Copiloto <ArrowRight size={14} />
        </Link>
      </section>
    </>
  )
}