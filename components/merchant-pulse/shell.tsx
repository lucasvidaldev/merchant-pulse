'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Activity, BarChart3, Bell, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Command, LayoutDashboard, Menu, Search, Settings2, ShieldAlert, Sparkles, Store, Target, X } from 'lucide-react'
import { ProfileMenu } from './profile-menu'
import { useOperation } from './operation-context'
import type { OperationScope } from '@/lib/operation-scope'

const navigation = [
  { label: 'Visão geral', href: '/', icon: LayoutDashboard },
  { label: 'Restaurantes', href: '/restaurants', icon: Store },
  { label: 'Central de risco', href: '/risk', icon: ShieldAlert },
  { label: 'Análises', href: '/analytics', icon: BarChart3 },
  { label: 'Copiloto IA', href: '/copilot', icon: Sparkles },
  { label: 'Notificações', href: '/notifications', icon: Bell },
  { label: 'Planos de ação', href: '/actions', icon: Target },
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
  const currentPath = pathname.startsWith('/restaurants/') ? '/restaurants' : pathname
  const title = pageNames[currentPath] ?? 'Restaurante'

  return (
    <div className="app-frame">
      {mobileOpen && <button aria-label="Fechar menu" className="mobile-scrim" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="brand-row">
          <Link className="brand-mark" href="/" aria-label="Merchant Pulse — início"><Activity size={19} strokeWidth={2.5} /></Link>
          {!collapsed && <Link href="/" className="brand-name">merchant<span>pulse</span></Link>}
          <button className="icon-button collapse-button" aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}</button>
          <button className="icon-button mobile-close" aria-label="Fechar menu" onClick={() => setMobileOpen(false)}><X size={17} /></button>
        </div>
        {!collapsed && <div className="workspace-switch"><div className="workspace-avatar">MP</div><label className="workspace-copy"><span className="sr-only">Selecionar operação</span><select aria-label="Selecionar operação" value={operation} onChange={(event) => setOperation(event.target.value as OperationScope)}><option value="brasil">Operação Brasil</option><option value="sudeste">Operação Sudeste</option><option value="sul">Operação Sul</option></select><span>Unidade operacional</span></label><ChevronDown size={14} className="muted-icon" /></div>}
        {collapsed && <div className="workspace-avatar workspace-avatar-collapsed">MP</div>}
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
