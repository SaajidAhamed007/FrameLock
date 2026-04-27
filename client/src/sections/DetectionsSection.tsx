import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Detection } from '../types'
import { getRiskColor, formatViews } from '../lib/utils'
import { Filter, ArrowUpDown, ShieldAlert, CheckCircle2, Flag, Search, Pin, AlertTriangle } from 'lucide-react'
import { mockExplainability } from '../data'

interface DetectionsSectionProps {
  detections: Detection[]
  selectedDetection: Detection | null
  onSelectDetection: (d: Detection) => void
}

function SimilarityMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 80 ? '#EF4444' : pct >= 60 ? '#F59E0B' : '#10B981'
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-[#A1A1AA] uppercase tracking-wider">Similarity Score</span>
        <motion.span
          key={pct}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-2xl font-black font-mono"
          style={{ color }}
        >
          {pct}%
        </motion.span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}60` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}

function DetectionCard({
  detection,
  rank,
  isSelected,
  onSelect,
}: {
  detection: Detection
  rank: number
  isSelected: boolean
  onSelect: (d: Detection) => void
}) {
  const riskColor = getRiskColor(detection.risk)
  const isHighRisk = detection.risk === 'high'

  return (
    <motion.div
      layout
      onClick={() => onSelect(detection)}
      className="relative cursor-pointer rounded-xl p-3 flex gap-3 items-start"
      style={{
        backgroundColor: isSelected ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isSelected ? 'rgba(99,102,241,0.3)' : isHighRisk ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)'}`,
        transition: 'all 0.2s ease',
      }}
      whileHover={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        y: -2,
        boxShadow: `0 8px 24px rgba(0,0,0,0.3)`,
      }}
    >
      {/* High risk pulse pin */}
      {isHighRisk && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{ backgroundColor: '#EF4444' }}
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Rank */}
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5"
        style={{
          backgroundColor: isSelected ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
          color: isSelected ? '#818CF8' : '#52525B',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        #{rank}
      </div>

      {/* Thumbnail */}
      <div className="w-16 h-10 rounded-lg overflow-hidden bg-[#09090B] shrink-0">
        <img src={detection.thumbnailUrl} alt="" className="w-full h-full object-cover" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#E4E4E7] truncate leading-tight">{detection.title}</p>
        <p className="text-[10px] text-[#71717A] truncate mt-0.5">{detection.channel}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
            style={{ color: riskColor, backgroundColor: `${riskColor}12`, borderColor: `${riskColor}25` }}
          >
            {detection.risk.toUpperCase()}
          </span>
          <span className="text-[10px] font-mono" style={{ color: riskColor }}>
            {(detection.similarity * 100).toFixed(0)}%
          </span>
          <span className="text-[10px] text-[#52525B] ml-auto">{formatViews(detection.views)}</span>
        </div>
      </div>
    </motion.div>
  )
}

export function DetectionsSection({ detections, selectedDetection, onSelectDetection }: DetectionsSectionProps) {
  const [filterRisk, setFilterRisk] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDetections = detections
    .filter(d => !filterRisk || d.risk === filterRisk)
    .filter(d => !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.channel.toLowerCase().includes(searchQuery.toLowerCase()))

  const highlights = selectedDetection ? (mockExplainability[selectedDetection.id]?.highlights ?? []) : []

  return (
    <section className="h-full flex flex-col gap-5">
      {/* Top Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
          <input
            type="text"
            placeholder="Search title or channel..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#1F1F23] border border-white/8 rounded-xl text-[#E4E4E7] placeholder-[#52525B] focus:outline-none focus:border-[#6366F1]/50 transition-colors"
          />
        </div>

        {/* Risk chips */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#52525B]" />
          {[
            { key: 'high', label: 'High', color: '#EF4444' },
            { key: 'medium', label: 'Medium', color: '#F59E0B' },
            { key: 'low', label: 'Low', color: '#10B981' },
          ].map(r => (
            <button
              key={r.key}
              onClick={() => setFilterRisk(filterRisk === r.key ? null : r.key)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
              style={{
                backgroundColor: filterRisk === r.key ? `${r.color}18` : 'rgba(255,255,255,0.03)',
                borderColor: filterRisk === r.key ? `${r.color}40` : 'rgba(255,255,255,0.06)',
                color: filterRisk === r.key ? r.color : '#71717A',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <button className="ml-auto flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors">
          <ArrowUpDown className="w-3.5 h-3.5" />
          Sort by Risk
        </button>

        <span className="text-xs text-[#52525B]">{filteredDetections.length} results</span>
      </div>

      <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
        {/* LEFT: Detection list */}
        <div className="col-span-5 flex flex-col bg-[#111114] rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#52525B]">Detected Matches</h3>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
              <span className="text-xs text-[#EF4444] font-semibold">
                {detections.filter(d => d.risk === 'high').length} High
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ maxHeight: 'calc(100vh - 320px)' }}>
            <AnimatePresence>
              {filteredDetections.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <DetectionCard
                    detection={d}
                    rank={i + 1}
                    isSelected={selectedDetection?.id === d.id}
                    onSelect={onSelectDetection}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredDetections.length === 0 && (
              <div className="p-8 text-center text-[#52525B] text-sm">No matches found.</div>
            )}
          </div>
        </div>

        {/* RIGHT: Detail Panel */}
        <div className="col-span-7 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {selectedDetection ? (
              <motion.div
                key={selectedDetection.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-4 h-full"
              >
                {/* Header */}
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'linear-gradient(145deg, #111114, #16161a)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex justify-between items-start gap-4 mb-5">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-[#E4E4E7] leading-tight line-clamp-2">
                        {selectedDetection.title}
                      </h2>
                      <p className="text-sm text-[#71717A] mt-1">
                        {selectedDetection.channel} · {formatViews(selectedDetection.views)} views
                      </p>
                    </div>
                    <div
                      className="shrink-0 px-3 py-1.5 rounded-xl text-sm font-bold border"
                      style={{
                        color: getRiskColor(selectedDetection.risk),
                        backgroundColor: `${getRiskColor(selectedDetection.risk)}12`,
                        borderColor: `${getRiskColor(selectedDetection.risk)}30`,
                      }}
                    >
                      {selectedDetection.risk.toUpperCase()} RISK
                    </div>
                  </div>

                  <SimilarityMeter value={selectedDetection.similarity} />
                </div>

                {/* Visual Comparison */}
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'linear-gradient(145deg, #111114, #16161a)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#52525B] mb-4">
                    Visual Comparison
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Original Source</p>
                      <div className="aspect-video bg-[#09090B] rounded-xl border border-white/8 flex items-center justify-center">
                        <span className="text-xs text-[#3F3F46]">Frame unavailable</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-[#52525B] uppercase tracking-wider">Detected Match</p>
                      <div className="aspect-video bg-[#09090B] rounded-xl border border-white/8 overflow-hidden">
                        <img
                          src={selectedDetection.thumbnailUrl}
                          alt="Match"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Match Reasoning */}
                <div
                  className="rounded-2xl p-5 flex-1"
                  style={{
                    background: 'linear-gradient(145deg, #111114, #16161a)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="w-4 h-4 text-[#6366F1]" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#52525B]">
                      AI Match Reasoning
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {highlights.length > 0 ? highlights.map((h: string, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: getRiskColor(selectedDetection.risk), boxShadow: `0 0 6px ${getRiskColor(selectedDetection.risk)}` }}
                        />
                        <span className="text-sm text-[#A1A1AA] leading-relaxed">{h}</span>
                      </motion.div>
                    )) : (
                      <p className="text-sm text-[#52525B]">No AI reasoning available for this match.</p>
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-colors"
                    style={{ backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Reviewed
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-colors"
                    style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
                  >
                    <Flag className="w-4 h-4" />
                    Flag for Takedown
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-colors"
                    style={{ backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818CF8' }}
                  >
                    <Pin className="w-4 h-4" />
                    Add to Report
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center rounded-2xl border border-dashed border-white/8"
                style={{ background: 'rgba(255,255,255,0.01)', minHeight: 600 }}
              >
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
                  >
                    <ShieldAlert className="w-7 h-7 text-[#52525B]" />
                  </motion.div>
                  <div>
                    <p className="text-[#E4E4E7] font-semibold">Forensic Analysis Console</p>
                    <p className="text-sm text-[#52525B] mt-1">Select a detection to begin investigation</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
