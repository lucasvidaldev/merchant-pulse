'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Activity, BarChart3, Bell, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Command, LayoutDashboard, Menu, Search, Settings2, ShieldAlert, Sparkles, Store, Target, X } from 'lucide-react'
import { ProfileMenu } from './profile-menu'
import { useOperation } from './operation-context'
import { operationLabel, type OperationScope } from '@/lib/operation-scope'

const navigation = [
  { label: 'Visão geral', href: '/', icon: LayoutDashboard },
  { label: 'Restaurantes', href: '/restaurants', icon: Store },
  { label: 'Central de risco', href: '/risk', icon: ShieldAlert },
  { label: 'Análises', href: '/analytics', icon: BarChart3 },
  { label: 'Copiloto IA', href: '/copilot', icon: Sparkles },
  { label: 'Notificações', href: '/notifications', icon: Bell },
  { label: 'Planos de ação', href: '/actions', icon: Target },
]

const operationOptions: Array<{ value: OperationScope; label: string; subtitle: string }> = [
  { value: 'brasil', label: 'Operação Brasil', subtitle: 'Todas as unidades' },
  { value: 'sudeste', label: 'Operação Sudeste', subtitle: 'SP, RJ, MG e ES' },
  { value: 'sul', label: 'Operação Sul', subtitle: 'PR, SC e RS' },
]

const pageNames: Record<string, string> = {
  '/': 'Visão geral', '/restaurants': 'Restaurantes', '/risk': 'Central de risco', '/analytics': 'Análises',
  '/copilot': 'Copiloto IA', '/notifications': 'Notificações', '/actions': 'Planos de ação', '/settings': 'Configurações', '/help': 'Central de ajuda',
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { operation, setOperation } = useOperation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [opMenuOpen, setOpMenuOpen] = useState(false)
  const opMenuRef = useRef<HTMLDivElement>(null)

  const currentPath = pathname.startsWith('/restaurants/') ? '/restaurants' : pathname
  const title = pageNames[currentPath] ?? 'Restaurante'

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (opMenuRef.current && !opMenuRef.current.contains(event.target as Node)) {
        setOpMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div className="app-frame">
      {mobileOpen && <button aria-label="Fechar menu" className="mobile-scrim" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="brand-row">
          {collapsed ? (
            <button
              type="button"
              className="brand-mark"
              aria-label="Expandir menu lateral"
              title="Expandir menu"
              onClick={() => setCollapsed(false)}
              style={{ cursor: 'pointer', border: 'none' }}
            >
              <Activity size={19} strokeWidth={2.5} />
            </button>
          ) : (
            <Link className="brand-mark" href="/" aria-label="Merchant Pulse — início">
              <Activity size={19} strokeWidth={2.5} />
            </Link>
          )}
          {!collapsed && <Link href="/" className="brand-name">merchant<span>pulse</span></Link>}
          {!collapsed && (
            <button
              className="icon-button collapse-button"
              aria-label="Recolher menu"
              onClick={() => setCollapsed(true)}
            >
              <ChevronLeft size={15} />
            </button>
          )}
          <button className="icon-button mobile-close" aria-label="Fechar menu" onClick={() => setMobileOpen(false)}><X size={17} /></button>
        </div>

        {!collapsed ? (
          <div ref={opMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="workspace-switch"
              aria-expanded={opMenuOpen}
              aria-label="Selecionar operação"
              onClick={() => setOpMenuOpen((prev) => !prev)}
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <div className="workspace-avatar">MP</div>
              <div className="workspace-copy">
                <strong style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-primary, #f8fafc)', fontWeight: 600 }}>
                  {operationLabel(operation)}
                </strong>
                <span>Unidade operacional</span>
              </div>
              <ChevronDown
                size={14}
                className="muted-icon"
                style={{
                  transition: 'transform 180ms ease',
                  transform: opMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {opMenuOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: '#0f172a',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  borderRadius: '12px',
                  padding: '6px',
                  boxShadow: '0 16px 32px rgba(0, 0, 0, 0.45)',
                }}
              >
                {operationOptions.map((opt) => {
                  const selected = opt.value === operation
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      onClick={() => {
                        setOperation(opt.value)
                        setOpMenuOpen(false)
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: selected ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                        color: selected ? '#f8fafc' : '#cbd5e1',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{opt.label}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{opt.subtitle}</div>
                      </div>
                      {selected && <Check size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="workspace-avatar workspace-avatar-collapsed"
            title={`${operationLabel(operation)} (clique para expandir)`}
            onClick={() => setCollapsed(false)}
            style={{ border: 'none', cursor: 'pointer' }}
          >
            MP
          </button>
        )}

        {!collapsed && <div className="nav-section-label">WORKSPACE</div>}
        <nav className="primary-nav" aria-label="Navegação principal">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = currentPath === href
            return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`nav-link ${active ? 'nav-link-active' : ''}`} aria-label={label} aria-current={active ? 'page' : undefined} title={collapsed ? label : undefined}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></Link>
          })}
        </nav>
        {!collapsed && <div className="nav-section-label nav-section-spaced">PREFERÊNCIAS</div>}
        <nav className="primary-nav" aria-label="Preferências">
          <Link href="/settings" onClick={() => setMobileOpen(false)} className={`nav-link ${currentPath === '/settings' ? 'nav-link-active' : ''}`} aria-label="Configurações" aria-current={currentPath === '/settings' ? 'page' : undefined} title={collapsed ? 'Configurações' : undefined}><Settings2 size={17} strokeWidth={1.8} /><span>Configurações</span></Link>
          <Link href="/help" onClick={() => setMobileOpen(false)} className={`nav-link ${currentPath === '/help' ? 'nav-link-active' : ''}`} aria-label="Central de ajuda" aria-current={currentPath === '/help' ? 'page' : undefined} title={collapsed ? 'Central de ajuda' : undefined}><CircleHelp size={17} strokeWidth={1.8} /><span>Central de ajuda</span></Link>
        </nav>
        {!collapsed && <div className="sidebar-insight"><div className="insight-icon"><Sparkles size={15} /></div><div><strong>Central de risco</strong><p>Revise os diagnósticos mais recentes.</p><Link href="/risk">Ver riscos <ChevronRight size={12} /></Link></div></div>}
        <div className="sidebar-footer"><ProfileMenu placement="sidebar" compact={collapsed} /></div>
      </aside>
      <div className={`main-column ${collapsed ? 'main-column-collapsed' : ''}`}>
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={() => setMobileOpen(true)}><Menu size={19} /></button><div className="breadcrumbs"><span>Área de trabalho</span><span className="breadcrumb-divider">/</span><strong>{title}</strong></div></div>
          <div className="topbar-actions"><button className="global-search" aria-label="Buscar"><Search size={15} /><span>Buscar</span><kbd><Command size={11} /> K</kbd></button><Link href="/notifications" className="icon-button notification-button" aria-label="Notificações do Slack"><Bell size={17} /><span className="notification-dot" /></Link><div className="topbar-divider" /><ProfileMenu placement="header" /></div>
        </header>
        <main className="page-content">{children}</main>
        <footer className="app-footer"><span>© 2026 Merchant Pulse</span><span>Dados do Supabase <span className="status-live" /></span></footer>
      </div>
    </div>
  )
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><div className="heading-eyebrow">{eyebrow ?? 'MERCHANT PULSE'} <span className="heading-dot">/</span> {title.toUpperCase()}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="heading-action">{action}</div>}</div>
}