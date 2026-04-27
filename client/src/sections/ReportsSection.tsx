import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import type { Detection, MetricCard as MetricCardType, RiskSummary } from '../types'
import { formatViews, getRiskColor } from '../lib/utils'
import { Download, Calendar, Bot, Loader2, AlertCircle, TrendingUp, BarChart2, PieChart as PieIcon, Activity } from 'lucide-react'

interface ReportsSectionProps {
  jobId: string
  detections: Detection[]
  metrics: MetricCardType[]
  riskSummary: RiskSummary
}

// Build 14-day mock trend data from real detections
function buildTrendData(detections: Detection[], riskSummary: RiskSummary) {
  const days = ['Apr 14', 'Apr 15', 'Apr 16', 'Apr 17', 'Apr 18', 'Apr 19', 'Apr 20', 'Apr 21', 'Apr 22', 'Apr 23', 'Apr 24', 'Apr 25', 'Apr 26', 'Apr 27']
  const total = riskSummary.high + riskSummary.medium + riskSummary.low
  return days.map((day, i) => {
    const factor = 0.2 + (i / days.length) * 0.8 + Math.sin(i * 0.8) * 0.1
    return {
      day,
      high: Math.round(riskSummary.high * factor * (0.7 + Math.random() * 0.6)),
      medium: Math.round(riskSummary.medium * factor * (0.7 + Math.random() * 0.6)),
      low: Math.round(riskSummary.low * factor * (0.7 + Math.random() * 0.6)),
      reach: Math.round(detections.reduce((s, d) => s + d.views, 0) * factor * 0.15),
    }
  })
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="px-4 py-3 rounded-xl text-xs"
      style={{
        background: 'rgba(15,15,20,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
      }}
    >
      <p className="font-bold text-[#E4E4E7] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span style={{ color: '#A1A1AA' }}>{p.name}:</span>
          <span className="font-mono font-bold" style={{ color: p.color }}>
            {p.dataKey === 'reach' ? formatViews(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// Animated counter
function Counter({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}{target.toLocaleString()}{suffix}
    </motion.span>
  )
}

export function ReportsSection({ jobId, detections, metrics, riskSummary }: ReportsSectionProps) {
  const [aiReport, setAiReport] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('14d')

  const total = riskSummary.high + riskSummary.medium + riskSummary.low
  const sortedByViews = [...detections].sort((a, b) => b.views - a.views)
  const trendData = buildTrendData(detections, riskSummary)

  const pieData = [
    { name: 'High', value: riskSummary.high, color: '#EF4444' },
    { name: 'Medium', value: riskSummary.medium, color: '#F59E0B' },
    { name: 'Low', value: riskSummary.low, color: '#10B981' },
  ]

  const totalReach = detections.reduce((s, d) => s + d.views, 0)

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:8000/api/reports/${jobId}`)
      if (!res.ok) throw new Error('Failed to generate AI report')
      setAiReport(await res.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section className="flex flex-col gap-7 overflow-y-auto pb-10 pr-1" style={{ maxHeight: 'calc(100vh - 88px)' }}>

      {/* ── Controls ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/8">
          {['7d', '14d', '30d'].map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: dateRange === r ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: dateRange === r ? '#818CF8' : '#71717A',
                border: dateRange === r ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/8 text-[#A1A1AA] hover:bg-white/[0.05] transition-colors">
          <Calendar className="w-4 h-4 text-[#52525B]" />
          All Platforms
        </button>
        <div className="ml-auto flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/8 text-[#A1A1AA] hover:bg-white/[0.05] transition-colors">
            <Download className="w-4 h-4 text-[#52525B]" />
            Export CSV
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
            Generate AI Report
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl flex items-center gap-3 bg-red-500/8 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* ── AI Report ── */}
      <AnimatePresence>
        {aiReport && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(99,102,241,0.25)', background: 'linear-gradient(145deg, #111116, #0e0e13)' }}
          >
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#6366F1]/15" style={{ background: 'rgba(99,102,241,0.07)' }}>
              <Bot className="w-4 h-4 text-[#6366F1]" />
              <h2 className="text-sm font-bold text-[#E4E4E7]">AI Intelligence Report</h2>
              <span className="ml-auto text-[10px] text-[#52525B] uppercase tracking-widest">gemini-2.5-flash</span>
            </div>
            <div className="p-6 grid grid-cols-2 gap-8">
              <div className="col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#6366F1] mb-2">Executive Summary</p>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">{aiReport.executive_summary}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#EF4444] mb-3">Key Threats</p>
                <div className="space-y-3">
                  {aiReport.key_threats?.map((t: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-[#EF4444]/5 border border-[#EF4444]/10">
                      <p className="text-xs font-bold text-[#E4E4E7] mb-1 line-clamp-1">{t.title}</p>
                      <p className="text-[11px] text-[#EF4444]/70">{t.risk_reason}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#2DD4BF] mb-2">Propagation Analysis</p>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">{aiReport.propagation_analysis}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#F59E0B] mb-2">Impact Assessment</p>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">{aiReport.impact_assessment}</p>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-3">Recommended Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {aiReport.recommendations?.map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-[#10B981]/5 border border-[#10B981]/10">
                      <span className="text-[#10B981] mt-0.5 shrink-0">›</span>
                      <p className="text-xs text-[#A1A1AA]">{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Summary Metrics ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#52525B] mb-4">Executive Summary</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Detections', value: total, color: '#6366F1', suffix: '' },
            { label: 'High Risk', value: riskSummary.high, color: '#EF4444', suffix: '' },
            { label: 'Total Reach', value: totalReach, color: '#2DD4BF', suffix: '', fmt: formatViews },
            { label: 'Channels Affected', value: new Set(detections.map(d => d.channel)).size, color: '#F59E0B', suffix: '' },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(145deg, #111114, #16161a)',
                border: `1px solid rgba(255,255,255,0.06)`,
              }}
              whileHover={{ borderColor: `${m.color}25`, boxShadow: `0 0 24px ${m.color}10` } as any}
            >
              <p className="text-[10px] text-[#52525B] uppercase tracking-widest mb-2">{m.label}</p>
              <p className="text-3xl font-black font-mono" style={{ color: m.color }}>
                {m.fmt ? m.fmt(m.value) : m.value.toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Main Charts ── */}
      <div className="grid grid-cols-3 gap-5">
        {/* Stacked Area — main */}
        <div
          className="col-span-2 rounded-2xl p-5"
          style={{ background: 'linear-gradient(145deg, #111114, #16161a)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-[#6366F1]" />
            <h3 className="text-sm font-semibold text-[#E4E4E7]">Detection Trend by Risk Level</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradMed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#52525B', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525B', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="high" name="High" stackId="1" stroke="#EF4444" fill="url(#gradHigh)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="medium" name="Medium" stackId="1" stroke="#F59E0B" fill="url(#gradMed)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="low" name="Low" stackId="1" stroke="#10B981" fill="url(#gradLow)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie — Risk Distribution */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(145deg, #111114, #16161a)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <PieIcon className="w-4 h-4 text-[#F59E0B]" />
            <h3 className="text-sm font-semibold text-[#E4E4E7]">Risk Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                animationBegin={200}
                animationDuration={1000}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map(p => (
              <div key={p.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-xs text-[#71717A] flex-1">{p.name}</span>
                <span className="text-xs font-mono font-bold" style={{ color: p.color }}>{p.value}</span>
                <span className="text-[10px] text-[#52525B]">{((p.value / total) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bar Chart + Channel Rank ── */}
      <div className="grid grid-cols-3 gap-5">
        {/* Daily bar */}
        <div
          className="col-span-2 rounded-2xl p-5"
          style={{ background: 'linear-gradient(145deg, #111114, #16161a)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-4 h-4 text-[#EF4444]" />
            <h3 className="text-sm font-semibold text-[#E4E4E7]">Daily High-Risk Detection Count</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#52525B', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525B', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="high" name="High Risk" fill="#EF4444" fillOpacity={0.7} radius={[3, 3, 0, 0]} animationDuration={1200} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top channels */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(145deg, #111114, #16161a)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-[#2DD4BF]" />
            <h3 className="text-sm font-semibold text-[#E4E4E7]">Top Channels by Reach</h3>
          </div>
          <div className="space-y-3">
            {sortedByViews.slice(0, 6).map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-3"
              >
                <span className="text-[10px] font-bold text-[#3F3F46] w-4">#{i + 1}</span>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: `${getRiskColor(d.risk)}18`, color: getRiskColor(d.risk), border: `1px solid ${getRiskColor(d.risk)}30` }}
                >
                  {d.channel[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[#E4E4E7] truncate">{d.channel}</p>
                  <div className="h-1 mt-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: getRiskColor(d.risk) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.views / sortedByViews[0].views) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.08 }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#71717A] shrink-0">{formatViews(d.views)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Detection Log Table ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#52525B] mb-4">Detailed Detection Log</p>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #111114, #16161a)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <table className="w-full text-left">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Title / Channel', 'Platform', 'Similarity', 'Reach', 'Risk'].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#52525B]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detections.map((d, i) => (
                <motion.tr
                  key={d.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors"
                >
                  <td className="px-5 py-3">
                    <p className="text-xs font-semibold text-[#E4E4E7] truncate max-w-xs">{d.title}</p>
                    <p className="text-[10px] text-[#71717A]">{d.channel}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] px-2 py-1 rounded-md bg-white/[0.04] text-[#71717A] uppercase">{d.platform}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-mono font-bold" style={{ color: getRiskColor(d.risk) }}>
                      {(d.similarity * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs font-mono text-[#A1A1AA]">{formatViews(d.views)}</td>
                  <td className="px-5 py-3">
                    <span
                      className="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border"
                      style={{
                        color: getRiskColor(d.risk),
                        backgroundColor: `${getRiskColor(d.risk)}12`,
                        borderColor: `${getRiskColor(d.risk)}28`,
                      }}
                    >
                      {d.risk}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
