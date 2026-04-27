import { Card } from '../components/Card'
import { DetectionItem } from '../components/DetectionItem'
import { PropagationGraph } from '../components/PropagationGraph'
import { MetricCard } from '../components/MetricCard'
import type { Detection, PropagationNode, MetricCard as MetricCardType, RiskSummary } from '../types'
import { AlertTriangle, Globe } from 'lucide-react'

interface MainGridSectionProps {
  detections: Detection[]
  propagationNodes: PropagationNode[]
  metrics: MetricCardType[]
  riskSummary: RiskSummary
  selectedDetection: Detection | null
  onSelectDetection: (d: Detection) => void
}

function RiskDistributionBar({ summary }: { summary: RiskSummary }) {
  const total = summary.high + summary.medium + summary.low
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: '#71717A' }}>Risk Distribution</span>
        <span className="text-xs font-semibold" style={{ color: '#E4E4E7' }}>{total} total</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        <div
          className="transition-all duration-700"
          style={{ width: `${(summary.high / total) * 100}%`, backgroundColor: '#EF4444', borderRadius: '99px 0 0 99px' }}
        />
        <div
          className="transition-all duration-700"
          style={{ width: `${(summary.medium / total) * 100}%`, backgroundColor: '#F59E0B' }}
        />
        <div
          className="transition-all duration-700"
          style={{ width: `${(summary.low / total) * 100}%`, backgroundColor: '#10B981', borderRadius: '0 99px 99px 0' }}
        />
      </div>
      <div className="flex justify-between">
        {[
          { label: 'High', count: summary.high, color: '#EF4444' },
          { label: 'Med', count: summary.medium, color: '#F59E0B' },
          { label: 'Low', count: summary.low, color: '#10B981' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-[11px]" style={{ color: item.color }}>{item.count} {item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MainGridSection({
  detections,
  propagationNodes,
  metrics,
  riskSummary,
  selectedDetection,
  onSelectDetection,
}: MainGridSectionProps) {
  return (
    <section aria-labelledby="main-grid-title">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#EF4444' }} />
        <h2 id="main-grid-title" className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
          Detection Intelligence
        </h2>
        <div
          className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {detections.filter((d) => d.risk === 'high').length} High Risk
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* LEFT: Detection List */}
        <div className="flex flex-col gap-3">
          {/* Top risk alert */}
          <div
            className="px-3 py-2.5 rounded-xl flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.04))',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#EF4444' }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: '#EF4444' }}>Top Threat Detected</p>
              <p className="text-[11px] truncate" style={{ color: '#A1A1AA' }}>{detections[0]?.title}</p>
            </div>
            <span className="text-xs font-mono font-bold" style={{ color: '#EF4444' }}>
              {(detections[0]?.similarity * 100).toFixed(1)}%
            </span>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: '#52525B' }}>
            All Detections ({detections.length})
          </p>

          <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
            {detections.map((d, i) => (
              <DetectionItem
                key={d.id}
                detection={d}
                rank={i + 1}
                isSelected={selectedDetection?.id === d.id}
                onSelect={onSelectDetection}
              />
            ))}
          </div>
        </div>

        {/* CENTER: Propagation Map */}
        <Card className="p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#52525B' }}>
              Propagation Map
            </p>
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" style={{ color: '#2DD4BF' }} />
              <span className="text-xs font-semibold" style={{ color: '#2DD4BF' }}>
                {propagationNodes.length - 1} copies detected
              </span>
            </div>
          </div>
          <div className="flex-1">
            <PropagationGraph
              nodes={propagationNodes}
              selectedId={selectedDetection?.id}
            />
          </div>
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 pt-3 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'High', color: '#EF4444' },
              { label: 'Medium', color: '#F59E0B' },
              { label: 'Low', color: '#10B981' },
              { label: 'Original', color: '#6366F1' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[11px]" style={{ color: '#71717A' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* RIGHT: Impact Summary */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: '#52525B' }}>
            Impact Summary
          </p>

          <div className="grid grid-cols-2 gap-3">
            {metrics.map((m, i) => (
              <MetricCard
                key={m.label}
                metric={m}
                accent={i === 0 || i === 1 ? '#2DD4BF' : '#6366F1'}
              />
            ))}
          </div>

          <Card className="p-4">
            <RiskDistributionBar summary={riskSummary} />
          </Card>

          <Card className="p-4">
            <p className="text-xs font-semibold mb-3" style={{ color: '#52525B' }}>Top Infringing Channels</p>
            <div className="space-y-2">
              {detections.slice(0, 4).map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${d.risk === 'high' ? '#EF4444' : d.risk === 'medium' ? '#F59E0B' : '#10B981'}, transparent)`,
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                      }}
                    >
                      {d.channel[0]}
                    </div>
                    <span className="text-xs truncate" style={{ color: '#A1A1AA' }}>{d.channel}</span>
                  </div>
                  <span className="text-xs font-mono font-semibold shrink-0" style={{
                    color: d.risk === 'high' ? '#EF4444' : d.risk === 'medium' ? '#F59E0B' : '#10B981'
                  }}>
                    {(d.similarity * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
