import { AlertCircle, LoaderCircle, SearchX } from 'lucide-react'

export function QueryNotice({ error, loading, empty, emptyMessage = 'Nenhum registro foi encontrado.' }: { error?: Error; loading: boolean; empty?: boolean; emptyMessage?: string }) {
  if (loading) {
    return <div className="query-state" role="status"><LoaderCircle size={17} className="spin" /><span>Consultando o Supabase…</span></div>
  }
  if (error) {
    return <div className="query-state query-state-error" role="alert"><AlertCircle size={17} /><div><strong>Não foi possível carregar os dados.</strong><span>Confira as tabelas, colunas e políticas RLS do Supabase.</span></div></div>
  }
  if (empty) {
    return <div className="query-state" role="status"><SearchX size={17} /><span>{emptyMessage}</span></div>
  }
  return null
}
