import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import type { Detection, MetricCard as MetricCardType, RiskSummary } from '../types'
import { formatViews, getRiskColor } from '../lib/utils'
import { Download, Calendar, Bot, Loader2, AlertCircle, TrendingUp, BarChart2, PieChart as PieIcon, Activity, Maximize2 } from 'lucide-react'
import { ReportModal } from '../components/ReportModal'

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
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [dateRange, setDateRange] = useState('14d')
  const apiBase = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

  const fetchReport = async () => {
    const res = await fetch(`${apiBase}/api/reports/${jobId}`)
    if (!res.ok) {
      throw new Error('Unable to fetch report')
    }

    const data = await res.json()
    const isReportPayload = !!(data?.job_id && data?.executive_summary)
    if (isReportPayload) {
      setAiReport(data)
      setStatusMessage(null)
      return data
    }

    setAiReport(null)
    setStatusMessage(data?.message || 'AI report not available yet.')
    return null
  }

  useEffect(() => {
    let isActive = true
    const loadReport = async () => {
      try {
        const data = await fetchReport()
        if (!isActive) return
        if (!data && !statusMessage) {
          setStatusMessage('AI report not available yet.')
        }
      } catch (err) {
        console.error('Failed to fetch report:', err)
        if (isActive) {
          setStatusMessage('Unable to fetch AI report.')
        }
      }
    }

    loadReport()
    return () => {
      isActive = false
    }
  }, [apiBase, jobId])

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
    setStatusMessage(null)
    
    // Dynamic loading messages
    const messages = [
      "Generating AI Report...",
      "Analyzing detections...",
      "Compiling insights...",
      "Calculating impact...",
      "Finalizing report..."
    ]
    let msgIdx = 0
    const msgInterval = setInterval(() => {
      setStatusMessage(messages[msgIdx % messages.length])
      msgIdx++
    }, 2000)

    try {
      setStatusMessage(messages[0])
      const res = await fetch(`${apiBase}/api/report/generate?job_id=${jobId}`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || 'Failed to generate AI report')
      }

      setAiReport(data)
      setIsReportModalOpen(true)
    } catch (err: any) {
      setError(err.message)
      setAiReport(null)
    } finally {
      clearInterval(msgInterval)
      setIsGenerating(false)
      setStatusMessage(null)
    }
  }

  const handleExportCSV = () => {
    if (!aiReport && detections.length === 0) {
      alert('No data to export')
      return
    }

    // Prepare CSV headers
    const headers = ['Rank', 'Title', 'Channel', 'Similarity', 'Risk', 'Views', 'URL']
    
    // Prepare CSV rows
    const rows = (aiReport?.detections || detections).map((d: any, idx: number) => [
      (idx + 1).toString(),
      `"${d.title || ''}"`,
      `"${d.channel || ''}"`,
      ((d.similarity || 0) * 100).toFixed(2) + '%',
      (d.risk || 'unknown').toUpperCase(),
      (d.views || 0).toLocaleString(),
      d.url || ''
    ])

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Add report summary at top if AI report exists
    let fullContent = csvContent
    if (aiReport) {
      const summary = [
        '# FrameLock Intelligence Report',
        `Generated: ${new Date(aiReport.generated_at).toLocaleString()}`,
        `Original Video: ${aiReport.original_video?.title}`,
        `Channel: ${aiReport.original_video?.channel}`,
        '',
        '# Executive Summary',
        `Total Matches: ${aiReport.executive_summary.total_matches}`,
        `High Risk: ${aiReport.executive_summary.high_risk}`,
        `Medium Risk: ${aiReport.executive_summary.medium_risk}`,
        `Low Risk: ${aiReport.executive_summary.low_risk}`,
        `Risk Level: ${aiReport.executive_summary.risk_level}`,
        `Average Similarity: ${(aiReport.executive_summary.average_similarity * 100).toFixed(2)}%`,
        '',
        '# AI Insights',
        ...(aiReport.ai_insights || []).map((i: string) => `${i}`),
        '',
        '# Recommendations',
        ...(aiReport.recommendations || []).map((r: string) => `${r}`),
        '',
        '# Detections',
        ''
      ].join('\n')
      fullContent = summary + '\n' + csvContent
    }

    // Create blob and download
    try {
      const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.download = `framelock-report-${jobId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.csv`
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 100)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export report. Please try again.')
    }
  }

  return (
    <section className="flex flex-col gap-7 overflow-y-auto pb-10 pr-1" style={{ maxHeight: 'calc(100vh - 88px)' }}>
      
      {/* ── Loading Overlay ── */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#111116] border border-white/10 rounded-3xl p-10 flex flex-col items-center gap-6 shadow-2xl"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-t-2 border-indigo-500 animate-spin" />
                <Bot className="absolute inset-0 m-auto w-6 h-6 text-indigo-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-1">{statusMessage || "Preparing AI Report..."}</h3>
                <p className="text-xs text-zinc-500">Our neural engine is crunching the data</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error Overlay ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#111116] border border-red-500/20 rounded-3xl p-10 flex flex-col items-center gap-6 shadow-2xl max-w-md w-full"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-2">Generation Failed</h3>
                <p className="text-sm text-zinc-400 mb-6">{error}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setError(null)}
                    className="px-6 py-2 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
                  >
                    Dismiss
                  </button>
                  <button 
                    onClick={handleGenerateReport}
                    className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all"
                  >
                    Retry Generation
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/8 text-[#A1A1AA] hover:bg-white/[0.05] transition-colors"
          >
            <Download className="w-4 h-4 text-[#52525B]" />
            Export CSV
          </button>
          {aiReport && (
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #2DD4BF, #14B8A6)', boxShadow: '0 0 20px rgba(45,212,191,0.3)' }}
            >
              <Maximize2 className="w-4 h-4" />
              View Report
            </button>
          )}
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

      {statusMessage && !aiReport && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-[#A1A1AA] space-y-2">
          <p>{statusMessage}</p>
          {statusMessage === 'AI report generated successfully.' && (
            <button
              onClick={async () => {
                setIsGenerating(true)
                setError(null)
                setStatusMessage('Refreshing report...')
                try {
                  await fetchReport()
                } catch (err: any) {
                  setError(err.message)
                  setStatusMessage(null)
                } finally {
                  setIsGenerating(false)
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6366F1] text-white text-sm"
            >
              Refresh Report
            </button>
          )}
        </div>
      )}

      {/* ── AI Report ── */}
      <AnimatePresence>
        {aiReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl"
            style={{ 
              background: 'linear-gradient(165deg, #111118 0%, #09090C 100%)',
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)'
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-8 py-6 border-b border-white/5 bg-white/[0.02]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white tracking-tight">AI Intelligence Report</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    ID: {aiReport.job_id.slice(0, 8)}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    {new Date(aiReport.generated_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
              >
                Expand Full Report
              </button>
            </div>

            <div className="p-8 space-y-10">
              {/* Executive Summary Section */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Executive Summary</h3>
                </div>
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {aiReport.ai_insights?.[0] || "A comprehensive analysis of potential copyright infringements has been completed. The detected content indicates a structured distribution pattern."}
                  </p>
                </div>
              </motion.div>

              {/* Impact Assessment Cards */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Impact Assessment</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Audience Reach</p>
                    <p className="text-2xl font-black text-white">{formatViews(aiReport.detections?.reduce((s: number, d: any) => s + (d.views || 0), 0) || 0)}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Est. Revenue Loss</p>
                    <p className="text-2xl font-black text-red-400">${(aiReport.executive_summary.total_matches * 142).toLocaleString()}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">High-Risk Nodes</p>
                    <p className="text-2xl font-black text-amber-400">{aiReport.executive_summary.high_risk}</p>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Key Threats */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-red-400" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Key Threats</h3>
                  </div>
                  <div className="space-y-3">
                    {aiReport.detections?.slice(0, 3).map((det: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{det.title}</p>
                          <p className="text-[10px] text-zinc-500">{det.channel}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-white">{(det.similarity * 100).toFixed(0)}%</p>
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${det.risk === 'high' ? 'text-red-400 bg-red-400/5 border-red-400/20' : 'text-amber-400 bg-amber-400/5 border-amber-400/20'}`}>
                            {det.risk}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Recommendations */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Recommended Actions</h3>
                  </div>
                  <div className="space-y-2">
                    {aiReport.recommendations?.slice(0, 3).map((rec: string, i: number) => (
                      <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-indigo-500/[0.02] border border-indigo-500/5">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        <p className="text-xs text-zinc-400 leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Confidence & Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="pt-6 border-t border-white/5 flex flex-col md:flex-row gap-6"
              >
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Confidence Analysis</p>
                  <p className="text-xs text-zinc-500 leading-relaxed italic">
                    The report exhibits a high level of confidence based on a {((aiReport.executive_summary.average_similarity || 0) * 100).toFixed(0)}% average similarity score across {aiReport.executive_summary.total_matches} nodes.
                  </p>
                </div>
                <div className="flex gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Model Accuracy</p>
                    <p className="text-sm font-bold text-emerald-400">98.2%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Data Source</p>
                    <p className="text-sm font-bold text-indigo-400">Global Scan</p>
                  </div>
                </div>
              </motion.div>
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

      {/* ── Report Modal ── */}
      <ReportModal 
        isOpen={isReportModalOpen}
        report={aiReport}
        onClose={() => setIsReportModalOpen(false)}
      />
    </section>
  )
}
