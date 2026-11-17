'use client'

import { FormEvent, KeyboardEvent, useMemo, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowDown, ArrowRight, ArrowUp, Bot, Check, ChevronDown, Copy, FileText, Lightbulb, LoaderCircle, MessageSquare, Plus, Send, Sparkles, ThumbsUp } from 'lucide-react'
import { PageHeading } from './shell'

const suggestions = [
  { icon: 'risk', title: 'Quais restaurantes precisam de atenção hoje?', detail: 'Priorize os sinais de churn mais urgentes' },
  { icon: 'trend', title: 'O que mudou na taxa de cancelamento?', detail: 'Compare tendências da última semana' },
  { icon: 'plan', title: 'Sugira um plano de ação para o maior risco', detail: 'Crie próximos passos com base nos sinais' },
]

export function CopilotPage() {
  const [input, setInput] = useState('')
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), [])
  const { messages, sendMessage, setMessages, status, error } = useChat({ transport })
  const busy = status === 'submitted' || status === 'streaming'
  function submitMessage(text = input) {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    sendMessage({ text: trimmed })
    setInput('')
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submitMessage()
  }
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
      event.preventDefault()
      submitMessage()
    }
  }
  return <>
    <PageHeading title="Copiloto IA" description="Pergunte sobre sua carteira e receba recomendações com evidências." action={<button className="button-secondary" onClick={() => setMessages([])}><Plus size={14} /> Nova conversa</button>} />
    <div className="copilot-layout"><aside className="copilot-rail"><div className="copilot-rail-title"><span>SEU COPILOTO</span><button className="icon-button" aria-label="Nova conversa" onClick={() => setMessages([])}><Plus size={15} /></button></div><div className="copilot-status"><span className="ai-status-dot" /><div><strong>Merchant Pulse AI</strong><small>Pronto para ajudar</small></div></div><div className="copilot-rail-label">CONSULTAS SUGERIDAS</div><button className="conversation-item conversation-active" onClick={() => submitMessage('Quais merchants têm maior score de risco?')}><MessageSquare size={14} /><span>Risco da carteira hoje</span></button><button className="conversation-item" onClick={() => submitMessage('Como evoluíram os cancelamentos nos últimos dias?')}><MessageSquare size={14} /><span>Tendência de cancelamentos</span></button><button className="conversation-item" onClick={() => submitMessage('Sugira um plano para o merchant com maior risco.')}><MessageSquare size={14} /><span>Plano para o maior risco</span></button><div className="copilot-rail-note"><Lightbulb size={14} /><span>As respostas consultam apenas a carteira autorizada pelas políticas RLS.</span></div></aside><section className="copilot-chat"><div className="chat-header"><div className="chat-assistant-mark"><Sparkles size={16} /></div><div><strong>Copiloto de performance</strong><span>Respostas baseadas em dados da carteira</span></div><span className="chat-model-tag">Qwen 3.7 Flash <ChevronDown size={11} /></span></div><div className="chat-scroll" aria-live="polite">{messages.length === 0 ? <div className="chat-welcome"><div className="chat-welcome-icon"><Sparkles size={21} /></div><span className="chat-overline">SEU ANALISTA DE CARTEIRA</span><h2>O que você quer entender?</h2><p>Encontre padrões, priorize parceiros e transforme sinais em ações concretas.</p><div className="suggestion-grid">{suggestions.map((suggestion) => <button className="suggestion-card" key={suggestion.title} onClick={() => submitMessage(suggestion.title)}><span className={`suggestion-icon suggestion-${suggestion.icon}`}><Lightbulb size={15} /></span><strong>{suggestion.title}</strong><small>{suggestion.detail}</small><ArrowRight size={14} className="suggestion-arrow" /></button>)}</div><div className="evidence-hint"><FileText size={14} /><span>Respostas incluem contexto e indicadores demonstrativos para apoiar sua decisão.</span></div></div> : <div className="message-list">{messages.map((message) => <article className={`chat-message ${message.role === 'user' ? 'chat-message-user' : ''}`} key={message.id}><div className={`message-avatar ${message.role === 'user' ? 'message-avatar-user' : ''}`}>{message.role === 'user' ? 'MC' : <Sparkles size={14} />}</div><div className="message-body"><span className="message-author">{message.role === 'user' ? 'Você' : 'Merchant Pulse AI'} <small>· {message.role === 'user' ? 'agora' : 'análise'}</small></span>{message.parts.map((part, index) => part.type === 'text' ? <p key={`${message.id}-${index}`}>{part.text}</p> : null)}{message.role === 'assistant' && <div className="message-evidence"><span><FileText size={12} /> Base demonstrativa · indicadores da carteira</span><button aria-label="Copiar resposta"><Copy size={13} /></button><button aria-label="Resposta útil"><ThumbsUp size={13} /></button></div>}</div></article>)}{busy && <div className="typing-indicator"><span /><span /><span /><small>Analisando os indicadores...</small></div>}{error && <div className="chat-error">Não foi possível consultar o Supabase ou montar a análise. Verifique o schema, as políticas RLS e a conexão. <a href="/settings">Ver configurações</a></div>}</div>}</div><form className="chat-composer" onSubmit={handleSubmit}><textarea aria-label="Mensagem para o copiloto" placeholder="Pergunte sobre sua carteira..." value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} rows={2} disabled={busy} /><div className="composer-bottom"><span><span className="composer-ai-mark"><Sparkles size={11} /></span> Respostas geradas por IA podem conter imprecisões.</span><button type="submit" className="send-button" disabled={!input.trim() || busy} aria-label="Enviar mensagem">{busy ? <LoaderCircle size={16} className="spin" /> : <ArrowUp size={17} />}</button></div></form><div className="chat-disclaimer">As respostas usam os registros autorizados do Supabase. Confira a seção de evidências antes de decidir.</div></section></div>
  </>
}
