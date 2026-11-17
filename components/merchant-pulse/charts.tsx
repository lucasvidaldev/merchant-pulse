'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MerchantHistoryPoint, WeeklyMetric } from '@/lib/merchant-data'

const axisProps = { tick: { fill: '#71819a', fontSize: 11 }, axisLine: false, tickLine: false }
const tooltipStyle = { backgroundColor: '#17243a', border: '1px solid #2a3a52', borderRadius: 10, color: '#e7edf6', fontSize: 12 }

function EmptyChart() {
  return <div className="chart-empty">Sem histórico operacional no período.</div>
}

export function CancellationChart({ data }: { data: WeeklyMetric[] }) {
  if (!data.length) return <div className="chart-canvas"><EmptyChart /></div>
  return <div className="chart-canvas"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#233249" strokeDasharray="3 5" /><XAxis dataKey="day" {...axisProps} dy={8} /><YAxis {...axisProps} tickFormatter={(value) => `${value}%`} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, 'Cancelamentos']} /><Line type="monotone" dataKey="cancelamento" stroke="#f17866" strokeWidth={2.5} dot={{ fill: '#f17866', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, stroke: '#111c30', strokeWidth: 3 }} /></LineChart></ResponsiveContainer></div>
}

export function PrepTimeChart({ data }: { data: WeeklyMetric[] }) {
  if (!data.length) return <div className="chart-canvas"><EmptyChart /></div>
  return <div className="chart-canvas"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><defs><linearGradient id="prepGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5a8ff7" stopOpacity={0.22} /><stop offset="95%" stopColor="#5a8ff7" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#233249" strokeDasharray="3 5" /><XAxis dataKey="day" {...axisProps} dy={8} /><YAxis {...axisProps} tickFormatter={(value) => `${value} min`} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} min`, 'Tempo médio']} /><Area type="monotone" dataKey="preparo" stroke="#5a8ff7" strokeWidth={2.5} fill="url(#prepGradient)" /></AreaChart></ResponsiveContainer></div>
}

export function VolumeChart({ data }: { data: WeeklyMetric[] }) {
  if (!data.length) return <div className="chart-canvas chart-canvas-tall"><EmptyChart /></div>
  return <div className="chart-canvas chart-canvas-tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}><CartesianGrid vertical={false} stroke="#233249" strokeDasharray="3 5" /><XAxis dataKey="day" {...axisProps} dy={8} /><YAxis {...axisProps} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, 'Pedidos']} /><Bar dataKey="pedidos" fill="#5a8ff7" radius={[4, 4, 0, 0]} maxBarSize={32} /></BarChart></ResponsiveContainer></div>
}

export function MerchantTrendChart({ data }: { data: MerchantHistoryPoint[] }) {
  if (!data.length) return <div className="chart-canvas chart-canvas-tall"><EmptyChart /></div>
  return <div className="chart-canvas chart-canvas-tall"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 28, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#233249" strokeDasharray="3 5" /><XAxis dataKey="month" {...axisProps} dy={8} /><YAxis {...axisProps} /><YAxis yAxisId="cancellations" orientation="right" {...axisProps} tickFormatter={(value) => `${Number(value).toFixed(1)}%`} domain={[0, 'dataMax + 2']} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="pedidos" name="Pedidos" stroke="#5a8ff7" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="cancelamento" name="Cancelamentos (%)" stroke="#f17866" strokeWidth={2.5} dot={false} yAxisId="cancellations" /></LineChart></ResponsiveContainer></div>
}
