import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Activity, FileBarChart2, Eye, Zap, TrendingUp, Flag, CheckCircle2, Download, Bot } from 'lucide-react'
import type { RadarNodeType } from './IntelligenceRadar'
import type { Detection, PropagationNode, RiskSummary } from '../types'
import { getRiskColor, formatViews } from '../lib/utils'

interface InsightModalProps {
  isOpen: boolean
  type: RadarNodeType | null
  onClose: () => void
  detections?: Detection[]
  propagationNodes?: PropagationNode[]
  riskSummary?: RiskSummary
}

const MODAL_META: Record<RadarNodeType, { label: string; color: string; icon: React.ElementType }> = {
  'high-risk':    { label: 'High Risk Detections',   color: '#EF4444', icon: AlertTriangle },
  'medium-risk':  { label: 'Medium Risk Detections',  color: '#F59E0B', icon: TrendingUp },
  'propagation':  { label: 'Propagation Analysis',    color: '#6366F1', icon: Activity },
  'insights':     { label: 'AI Intelligence Insights',color: '#818CF8', icon: Eye },
  'reports':      { label: 'Report Overview',         color: '#2DD4BF', icon: FileBarChart2 },
  'anomalies':    { label: 'Anomaly Detection',       color: '#F59E0B', icon: Zap },
}

function HighRiskContent({ detections = [] }: { detections: Detection[] }) {
  const high = detections.filter(d => d.risk === 'high')
  return (
    <div className="space-y-6">
      <p className="text-sm text-[#A1A1AA] leading-relaxed">
        <strong className="text-[#EF4444]">{high.length}</strong> high-risk unauthorized copies detected. Immediate action recommended.
      </p>
      <div className="space-y-3">
        {high.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex gap-4 p-4 rounded-xl"
            style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <img src={d.thumbnailUrl} alt="" className="w-20 h-12 rounded-lg object-cover shrink-0 bg-black" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#E4E4E7] truncate">{d.title}</p>
              <p className="text-xs text-[#71717A] mt-0.5">{d.channel} · {formatViews(d.views)} views</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#EF4444]" style={{ width: `${(d.similarity * 100).toFixed(0)}%` }} />
                </div>
                <span className="text-xs font-mono text-[#EF4444] shrink-0">{(d.similarity * 100).toFixed(0)}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
          <Flag className="w-4 h-4" /> Flag All for Takedown
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}>
          <CheckCircle2 className="w-4 h-4" /> Mark All Reviewed
        </button>
      </div>
    </div>
  )
}

function MediumRiskContent({ detections = [] }: { detections: Detection[] }) {
  const med = detections.filter(d => d.risk === 'medium')
  return (
    <div className="space-y-5">
      <p className="text-sm text-[#A1A1AA]">
        <strong className="text-[#F59E0B]">{med.length}</strong> medium-risk matches require monitoring.
      </p>
      <div className="space-y-2">
        {med.map((d, i) => (
          <motion.div key={d.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <img src={d.thumbnailUrl} alt="" className="w-12 h-8 rounded-lg object-cover bg-black shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#E4E4E7] truncate">{d.title}</p>
              <p className="text-[10px] text-[#71717A]">{d.channel}</p>
            </div>
            <span className="text-xs font-mono text-[#F59E0B] shrink-0">{(d.similarity * 100).toFixed(0)}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function PropagationContent({ nodes = [] }: { nodes: PropagationNode[] }) {
  const children = nodes.filter(n => n.id !== 'original')
  const totalReach = nodes.reduce((s, n) => s + n.views, 0)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Nodes', value: nodes.length, color: '#6366F1' },
          { label: 'Total Reach', value: formatViews(totalReach), color: '#2DD4BF' },
          { label: 'High Risk', value: nodes.filter(n => n.risk === 'high').length, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-2xl font-black font-mono" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#52525B] mb-3">Spread Distribution</p>
        <div className="space-y-2">
          {[
            { label: 'High Risk Cluster', count: nodes.filter(n => n.risk === 'high').length, color: '#EF4444' },
            { label: 'Medium Risk Cluster', count: nodes.filter(n => n.risk === 'medium').length, color: '#F59E0B' },
            { label: 'Low Risk Cluster', count: nodes.filter(n => n.risk === 'low').length, color: '#10B981' },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="text-xs text-[#71717A] w-40">{row.label}</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: row.color }}
                  initial={{ width: 0 }} animate={{ width: `${(row.count / Math.max(children.length, 1)) * 100}%` }}
                  transition={{ duration: 0.8 }} />
              </div>
              <span className="text-xs font-mono" style={{ color: row.color }}>{row.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InsightsContent({ riskSummary }: { riskSummary?: RiskSummary }) {
  const total = (riskSummary?.high ?? 0) + (riskSummary?.medium ?? 0) + (riskSummary?.low ?? 0)
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-[#818CF8]" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#818CF8]">AI Summary</p>
        </div>
        <p className="text-sm text-[#A1A1AA] leading-relaxed">
          Analysis detected <strong className="text-[#E4E4E7]">{total}</strong> unauthorized copies across platforms.
          {riskSummary && riskSummary.high > 0 && (
            <> <strong className="text-[#EF4444]">{riskSummary.high}</strong> are classified as high-risk based on visual similarity scores above 80%.</>
          )}
          {' '}Content propagation appears organic with no coordinated upload patterns detected at this time.
        </p>
      </div>
      <div className="space-y-3">
        {[
          { label: 'Visual similarity threshold used', value: '≥ 65%' },
          { label: 'Frames analyzed per video', value: '3–5' },
          { label: 'Embedding model', value: 'CLIP ViT-B/32' },
          { label: 'Detection confidence', value: 'High' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="text-xs text-[#71717A]">{item.label}</span>
            <span className="text-xs font-mono font-bold text-[#818CF8]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReportsContent({ detections = [], riskSummary }: { detections: Detection[]; riskSummary?: RiskSummary }) {
  const total = (riskSummary?.high ?? 0) + (riskSummary?.medium ?? 0) + (riskSummary?.low ?? 0)
  const totalReach = detections.reduce((s, d) => s + d.views, 0)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total Detections', value: total, color: '#2DD4BF' },
          { label: 'High Risk', value: riskSummary?.high ?? 0, color: '#EF4444' },
          { label: 'Total Reach', value: formatViews(totalReach), color: '#6366F1' },
          { label: 'Channels Affected', value: new Set(detections.map(d => d.channel)).size, color: '#F59E0B' },
        ].map(m => (
          <div key={m.label} className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-2xl font-black font-mono" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[10px] text-[#52525B] uppercase tracking-wider mt-1">{m.label}</p>
          </div>
        ))}
      </div>
      <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
        style={{ backgroundColor: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.25)', color: '#2DD4BF' }}>
        <Download className="w-4 h-4" /> Export Full Report
      </button>
    </div>
  )
}

function AnomaliesContent() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-[#A1A1AA]">Pattern analysis across detected content reveals the following signals:</p>
      {[
        { title: 'No coordinated upload detected', desc: 'Upload timestamps are spread over multiple days with no synchronized pattern.', type: 'safe', color: '#10B981' },
        { title: 'Single-platform concentration', desc: 'All detections originate from YouTube. Cross-platform spread has not yet occurred.', type: 'info', color: '#6366F1' },
        { title: 'High similarity cluster', desc: '3+ videos share >85% similarity — possible direct re-upload or screen-capture.', type: 'warning', color: '#F59E0B' },
      ].map((a, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className="p-4 rounded-xl" style={{ backgroundColor: `${a.color}08`, border: `1px solid ${a.color}20` }}>
          <p className="text-sm font-semibold mb-1" style={{ color: a.color }}>{a.title}</p>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">{a.desc}</p>
        </motion.div>
      ))}
    </div>
  )
}

export function InsightModal({ isOpen, type, onClose, detections, propagationNodes, riskSummary }: InsightModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const meta = type ? MODAL_META[type] : null
  const Icon = meta?.icon ?? Eye

  const renderContent = () => {
    if (!type) return null
    switch (type) {
      case 'high-risk': return <HighRiskContent detections={detections} />
      case 'medium-risk': return <MediumRiskContent detections={detections} />
      case 'propagation': return <PropagationContent nodes={propagationNodes} />
      case 'insights': return <InsightsContent riskSummary={riskSummary} />
      case 'reports': return <ReportsContent detections={detections} riskSummary={riskSummary} />
      case 'anomalies': return <AnomaliesContent />
    }
  }

  return (
    <AnimatePresence>
      {isOpen && meta && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden"
            style={{
              width: 480,
              background: 'linear-gradient(145deg, #111116, #0e0e13)',
              borderLeft: `1px solid ${meta.color}25`,
              boxShadow: `-20px 0 60px rgba(0,0,0,0.6)`,
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div
              className="px-6 py-5 flex items-center gap-4 shrink-0"
              style={{ borderBottom: `1px solid ${meta.color}18`, background: `${meta.color}08` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${meta.color}18`, border: `1px solid ${meta.color}30` }}
              >
                <Icon className="w-5 h-5" style={{ color: meta.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-[#E4E4E7] leading-tight">{meta.label}</h2>
                <p className="text-[11px] mt-0.5" style={{ color: meta.color }}>Intelligence Panel</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <X className="w-4 h-4 text-[#71717A]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {renderContent()}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
