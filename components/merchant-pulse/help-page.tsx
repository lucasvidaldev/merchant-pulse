import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, MessageCircleQuestion, ShieldCheck, Sparkles } from 'lucide-react'
import { PageHeading } from './shell'

const questions = [
  {
    icon: ShieldCheck,
    title: 'Como interpretar o Score de Risco?',
    answer: 'O score e o nível exibidos vêm do diagnóstico mais recente em ai_diagnoses (risk_score, risk_level e root_causes). O Merchant Pulse apresenta esses valores e não recalcula o diagnóstico.',
  },
  {
    icon: MessageCircleQuestion,
    title: 'Como funciona o histórico do Slack?',
    answer: 'A página Notificações lista os registros de slack_notifications, incluindo canal, mensagem, status e horários. O envio das mensagens é feito pelo processo que grava nessa tabela.',
  },
  {
    icon: Sparkles,
    title: 'Quais dados o Copiloto usa?',
    answer: 'O Copiloto consulta merchants, daily_metrics, ai_diagnoses, action_plans e slack_notifications. As respostas incluem evidências dos registros retornados pelo Supabase e respeitam as permissões configuradas no banco.',
  },
]

export function HelpPage() {
  return <>
    <Link href="/" className="back-link"><ArrowLeft size={15} /> Voltar à visão geral</Link>
    <PageHeading title="Central de ajuda" description="Respostas rápidas sobre os indicadores e as fontes de dados do Merchant Pulse." />
    <section className="help-grid">{questions.map(({ icon: Icon, title, answer }) => <article className="panel help-card" key={title}><span className="help-card-icon"><Icon size={18} /></span><h2>{title}</h2><p>{answer}</p></article>)}</section>
    <section className="panel help-footer"><div><BookOpen size={17} /><div><strong>Precisa de mais contexto?</strong><span>Veja os dados atuais da carteira ou pergunte ao Copiloto.</span></div></div><Link href="/copilot" className="text-link">Abrir Copiloto <ArrowRight size={14} /></Link></section>
  </>
}
