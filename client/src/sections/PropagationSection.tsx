import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PropagationNode, Detection } from '../types'
import { getRiskColor, formatViews } from '../lib/utils'
import { Calendar, Filter, Activity, Users, AlertTriangle, Share2, X } from 'lucide-react'
import { IntelligenceRadar } from '../components/IntelligenceRadar'
import type { RadarNodeType } from '../components/IntelligenceRadar'

interface PropagationSectionProps {
  nodes: PropagationNode[]
  detections: Detection[]
  selectedNodeId: string | null
  onSelectNode: (id: string) => void
  onRadarNodeClick: (type: RadarNodeType) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Radial graph computed in JS (no layout lib needed)
// ─────────────────────────────────────────────────────────────────────────────
function computeLayout(nodes: PropagationNode[]) {
  const W = 800
  const H = 560
  const cx = W / 2
  const cy = H / 2

  const original = nodes.find(n => n.id === 'original')
  const children = nodes.filter(n => n.id !== 'original')

  // Sort children by similarity desc so highest similarity is near top
  const sorted = [...children].sort((a, b) => b.similarity - a.similarity)

  // Distribute across two rings based on risk
  const highRisk = sorted.filter(n => n.risk === 'high')
  const rest = sorted.filter(n => n.risk !== 'high')

  const maxViews = Math.max(...children.map(n => n.views), 1)

  function placeRing(items: PropagationNode[], radius: number) {
    return items.map((node, i) => {
      const angle = (i / items.length) * 2 * Math.PI - Math.PI / 2
      return {
        ...node,
        px: cx + Math.cos(angle) * radius,
        py: cy + Math.sin(angle) * radius,
        r: Math.max(8, Math.min(28, 8 + (node.views / maxViews) * 22)),
      }
    })
  }

  const innerRing = placeRing(highRisk, 160)
  const outerRing = placeRing(rest, 250)

  const all: LayoutNode[] = [
    {
      ...(original || nodes[0]),
      px: cx,
      py: cy,
      r: 36,
    },
    ...innerRing,
    ...outerRing,
  ]

  return { all, W, H, cx, cy }
}

interface LayoutNode extends PropagationNode {
  px: number
  py: number
  r: number
}

// Animated SVG path draw-in
function AnimatedLine({ x1, y1, x2, y2, color, delay = 0 }: { x1: number; y1: number; x2: number; y2: number; color: string; delay?: number }) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  return (
    <motion.line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color}
      strokeWidth={1.5}
      strokeOpacity={0.35}
      strokeDasharray={len}
      initial={{ strokeDashoffset: len }}
      animate={{ strokeDashoffset: 0 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    />
  )
}

function NetworkGraph({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: PropagationNode[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const { all, W, H, cx, cy } = computeLayout(nodes)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
        </radialGradient>
        <filter id="node-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="strong-glow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill="rgba(255,255,255,0.2)" />
        </marker>
      </defs>

      {/* Ambient center glow */}
      <circle cx={cx} cy={cy} r={80} fill="url(#centerGlow)" />

      {/* Grid rings (decorative) */}
      {[160, 250].map(r => (
        <circle
          key={r}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={1}
          strokeDasharray="4 6"
        />
      ))}

      {/* Connection lines (animated) */}
      {all.map((node, ni) =>
        node.connections?.map((targetId) => {
          const target = all.find(n => n.id === targetId)
          if (!target) return null
          const isSelected = node.id === selectedId || target.id === selectedId
          const color = isSelected ? getRiskColor(target.risk) : 'rgba(255,255,255,0.1)'
          return (
            <AnimatedLine
              key={`${node.id}-${targetId}`}
              x1={node.px} y1={node.py} x2={target.px} y2={target.py}
              color={color}
              delay={ni * 0.06}
            />
          )
        })
      )}

      {/* Nodes */}
      {all.map((node, i) => {
        const isOriginal = node.id === 'original'
        const isSelected = selectedId === node.id
        const isDimmed = selectedId && !isSelected && node.id !== 'original'
        const color = isOriginal ? '#6366F1' : getRiskColor(node.risk)

        return (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: isDimmed ? 0.25 : 1,
              scale: 1,
            }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            style={{ cursor: 'pointer', transformOrigin: `${node.px}px ${node.py}px` }}
            onClick={() => onSelect(node.id)}
            whileHover={{ scale: 1.15 } as any}
          >
            {/* Original ripple */}
            {isOriginal && (
              <>
                <circle cx={node.px} cy={node.py} r={node.r + 8} fill="none" stroke="#6366F1" strokeWidth={1} strokeOpacity={0.2} filter="url(#node-glow)">
                  <animate attributeName="r" values={`${node.r + 4};${node.r + 18};${node.r + 4}`} dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx={node.px} cy={node.py} r={node.r + 4} fill="none" stroke="#6366F1" strokeWidth={0.8} strokeOpacity={0.15}>
                  <animate attributeName="r" values={`${node.r + 2};${node.r + 12};${node.r + 2}`} dur="3s" begin="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.25;0;0.25" dur="3s" begin="1s" repeatCount="indefinite" />
                </circle>
              </>
            )}

            {/* Selection ring */}
            {isSelected && (
              <circle
                cx={node.px} cy={node.py}
                r={node.r + 5}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={0.7}
                filter="url(#node-glow)"
              />
            )}

            {/* Main node */}
            <circle
              cx={node.px} cy={node.py}
              r={node.r}
              fill={color}
              fillOpacity={isOriginal ? 0.95 : 0.75}
              filter={isOriginal ? 'url(#strong-glow)' : node.risk === 'high' ? 'url(#node-glow)' : undefined}
            />

            {/* Inner highlight */}
            <circle
              cx={node.px - node.r * 0.25}
              cy={node.py - node.r * 0.25}
              r={node.r * 0.35}
              fill="white"
              fillOpacity={0.1}
            />

            {/* Label */}
            <text
              x={node.px}
              y={node.py + node.r + 10}
              textAnchor="middle"
              fontSize={isOriginal ? 9 : 7.5}
              fontWeight={isOriginal ? '700' : '500'}
              fill={isOriginal ? '#E4E4E7' : '#A1A1AA'}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {node.title.length > 16 ? node.title.slice(0, 16) + '…' : node.title}
            </text>
          </motion.g>
        )
      })}
    </svg>
  )
}

export function PropagationSection({ nodes, detections, selectedNodeId, onSelectNode, onRadarNodeClick }: PropagationSectionProps) {
  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  const selectedDetection = detections.find(d => d.id === selectedNodeId)

  const totalReach = nodes.reduce((s, n) => s + n.views, 0)
  const highRiskCount = nodes.filter(n => n.risk === 'high').length
  const children = nodes.filter(n => n.id !== 'original')

  return (
    <section className="h-full flex flex-col gap-5">
      {/* Top controls */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/8 text-[#A1A1AA] hover:bg-white/[0.06] transition-colors">
          <Calendar className="w-4 h-4 text-[#52525B]" />
          Last 7 Days
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/8 text-[#A1A1AA] hover:bg-white/[0.06] transition-colors">
          <Filter className="w-4 h-4 text-[#52525B]" />
          All Platforms
        </button>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-[#52525B]">
          <Share2 className="w-3.5 h-3.5" />
          <span>{children.length} copies detected</span>
        </div>
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* Main graph area */}
        <div
          className="flex-1 rounded-2xl relative overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.05) 0%, #0d0d10 70%)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {/* Graph */}
          <div className="absolute inset-0 p-4">
            <NetworkGraph
              nodes={nodes}
              selectedId={selectedNodeId}
              onSelect={(id) => onSelectNode(selectedNodeId === id ? '' : id)}
            />
          </div>

          {/* Summary bar overlaid at bottom */}
          <div className="absolute bottom-5 left-5 right-5 flex gap-3 pointer-events-none">
            {[
              { icon: Users, label: 'Total Reach', value: formatViews(totalReach), color: '#6366F1' },
              { icon: Activity, label: 'Nodes', value: nodes.length, color: '#2DD4BF' },
              { icon: AlertTriangle, label: 'High Risk', value: highRiskCount, color: '#EF4444' },
              { icon: Share2, label: 'Clusters', value: 1, color: '#F59E0B' },
            ].map(stat => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-md"
                  style={{
                    background: 'rgba(9,9,11,0.75)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${stat.color}18` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#52525B] uppercase tracking-wider">{stat.label}</p>
                    <p className="text-sm font-bold text-[#E4E4E7]">{stat.value}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5">
            {[
              { color: '#6366F1', label: 'Original' },
              { color: '#EF4444', label: 'High Risk' },
              { color: '#F59E0B', label: 'Medium' },
              { color: '#10B981', label: 'Low' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-[10px] text-[#52525B]">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <AnimatePresence mode="wait">
          {selectedNode ? (
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, x: 24, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 280 }}
              exit={{ opacity: 0, x: 24, width: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="shrink-0 flex flex-col gap-4 overflow-hidden"
            >
              <div
                className="rounded-2xl p-5 flex flex-col gap-5 h-full"
                style={{ background: 'linear-gradient(145deg, #111114, #16161a)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#52525B]">Node Details</p>
                  <button
                    onClick={() => onSelectNode('')}
                    className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-3 h-3 text-[#71717A]" />
                  </button>
                </div>

                {selectedDetection && (
                  <div className="aspect-video bg-[#09090B] rounded-xl overflow-hidden border border-white/8">
                    <img src={selectedDetection.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-bold text-[#E4E4E7] leading-snug">{selectedNode.title}</h3>
                  {selectedDetection && (
                    <p className="text-xs text-[#71717A] mt-1">{selectedDetection.channel}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Risk</p>
                    <p className="text-sm font-bold" style={{ color: getRiskColor(selectedNode.risk) }}>
                      {selectedNode.risk.toUpperCase()}
                    </p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-1">Views</p>
                    <p className="text-sm font-bold text-[#E4E4E7]">{formatViews(selectedNode.views)}</p>
                  </div>
                  {selectedNode.id !== 'original' && (
                    <div className="col-span-2 bg-white/[0.03] rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] text-[#52525B] uppercase tracking-wider mb-2">Similarity</p>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: getRiskColor(selectedNode.risk) }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(selectedNode.similarity * 100).toFixed(0)}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <p className="text-xs font-mono font-bold mt-1.5" style={{ color: getRiskColor(selectedNode.risk) }}>
                        {(selectedNode.similarity * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>

                <button
                  className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-colors border border-white/10 hover:bg-white/5 text-[#A1A1AA]"
                >
                  View Full Trace
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="tip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-72 shrink-0 flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-[#111114]"
            >
              <IntelligenceRadar
                highRiskCount={highRiskCount}
                mediumRiskCount={nodes.filter(n => n.risk === 'medium').length}
                onNodeClick={onRadarNodeClick}
              />
              <p className="text-xs text-[#71717A] mt-6 text-center px-6">
                Interact with the radar or select a node in the graph.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
