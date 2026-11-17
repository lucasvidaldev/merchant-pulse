'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, Settings2, UserRound } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { useCurrentUserProfile, workspaceProfile } from '@/lib/merchant-data'

export function ProfileMenu({ placement = 'header', compact = false }: { placement?: 'header' | 'sidebar'; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const { data: profile } = useCurrentUserProfile()
  const name = profile?.name ?? workspaceProfile.name
  const email = profile?.email ?? workspaceProfile.email
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  useEffect(() => {
    if (!open) return
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  async function signOut() {
    setError('')
    const { error: signOutError } = await getSupabaseClient().auth.signOut()
    if (signOutError) {
      setError('Não foi possível encerrar a sessão.')
      return
    }
    window.location.assign('/')
  }

  return <div className={`profile-menu profile-menu-${placement}`} ref={menuRef}>
    <button className={`profile-trigger ${compact ? 'profile-trigger-compact' : ''}`} aria-label={`Perfil de ${name}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <span className="user-avatar">{initials || 'MC'}</span>
      {!compact && <span className="profile-trigger-copy"><strong>{name}</strong><small>{profile?.role ?? workspaceProfile.role}</small></span>}
      {!compact && <ChevronDown size={14} className="muted-icon" />}
    </button>
    {open && <div className="profile-popover" role="menu"><div className="profile-popover-header"><strong>{name}</strong><span>{email}</span></div><Link href="/settings#conta" role="menuitem" onClick={() => setOpen(false)}><UserRound size={14} /> Perfil</Link><Link href="/settings#notificacoes" role="menuitem" onClick={() => setOpen(false)}><Settings2 size={14} /> Preferências</Link><button role="menuitem" onClick={signOut}><LogOut size={14} /> Sair</button>{error && <span className="profile-menu-error" role="alert">{error}</span>}</div>}
  </div>
}
