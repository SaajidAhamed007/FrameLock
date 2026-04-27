import { Card } from '../components/Card'
import { MetricCard } from '../components/MetricCard'
import type { Detection, MetricCard as MetricCardType, RiskSummary } from '../types'
import { formatViews, getRiskColor } from '../lib/utils'
import { Download, FileText, Calendar, Activity, BarChart2 } from 'lucide-react'

interface ReportsSectionProps {
  detections: Detection[]
  metrics: MetricCardType[]
  riskSummary: RiskSummary
}

export function ReportsSection({ detections, metrics, riskSummary }: ReportsSectionProps) {
  const total = riskSummary.high + riskSummary.medium + riskSummary.low
  const sortedDetections = [...detections].sort((a, b) => b.views - a.views)

  return (
    <section className="h-full flex flex-col space-y-8 overflow-y-auto pr-2 pb-8">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1F1F23] border border-white/10 rounded-lg text-sm text-[#E4E4E7] hover:bg-white/5 transition-colors">
            <Calendar className="w-4 h-4 text-[#A1A1AA]" />
            Last 30 Days
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1F1F23] border border-white/10 rounded-lg text-sm font-medium text-[#E4E4E7] hover:bg-white/5 transition-colors">
            <Download className="w-4 h-4 text-[#A1A1AA]" />
            CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-sm font-medium text-white transition-colors shadow-lg shadow-[#6366F1]/20">
            <FileText className="w-4 h-4" />
            Export PDF Report
          </button>
        </div>
      </div>

      {/* Section 1: Summary Cards */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#52525B] mb-4">Executive Summary</h3>
        <div className="grid grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <MetricCard
              key={m.label}
              metric={m}
              accent={i === 0 ? '#6366F1' : i === 1 ? '#EF4444' : i === 2 ? '#2DD4BF' : '#F59E0B'}
            />
          ))}
        </div>
      </div>

      {/* Section 2: Charts Area (Mocked for now) */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6 bg-[#1F1F23] border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-5 h-5 text-[#6366F1]" />
            <h3 className="text-sm font-semibold text-[#E4E4E7]">Risk Distribution</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold text-white">{total}</span>
              <span className="text-sm text-[#A1A1AA] pb-1">Total Detections</span>
            </div>
            
            <div className="space-y-3">
              {[
                { label: 'High Risk', count: riskSummary.high, color: '#EF4444' },
                { label: 'Medium Risk', count: riskSummary.medium, color: '#F59E0B' },
                { label: 'Low Risk', count: riskSummary.low, color: '#10B981' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: item.color }}>{item.label}</span>
                    <span className="font-mono text-[#E4E4E7]">{item.count}</span>
                  </div>
                  <div className="h-2 w-full bg-[#09090B] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${(item.count / Math.max(1, total)) * 100}%`,
                        backgroundColor: item.color
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-[#1F1F23] border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-[#2DD4BF]" />
            <h3 className="text-sm font-semibold text-[#E4E4E7]">Top Channels by Impact</h3>
          </div>
          
          <div className="space-y-4">
            {sortedDetections.slice(0, 5).map((d, i) => (
              <div key={d.id} className="flex items-center gap-4">
                <div className="w-6 text-center text-xs font-bold text-[#52525B]">#{i+1}</div>
                <div className="w-8 h-8 rounded-full bg-[#09090B] border border-white/10 flex items-center justify-center font-bold text-xs" style={{ color: getRiskColor(d.risk) }}>
                  {d.channel[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#E4E4E7] truncate">{d.channel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-[#E4E4E7]">{formatViews(d.views)}</p>
                  <p className="text-[10px] text-[#A1A1AA] uppercase">Views</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Section 3: Detailed Table */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#52525B] mb-4">Detailed Detection Log</h3>
        <div className="bg-[#1F1F23] border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#09090B]/50 border-b border-white/5">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#71717A]">Title / Channel</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#71717A]">Platform</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#71717A]">Similarity</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#71717A]">Views</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#71717A]">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {detections.map(d => (
                <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[#E4E4E7] truncate max-w-md">{d.title}</p>
                    <p className="text-xs text-[#A1A1AA]">{d.channel}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold bg-white/5 text-[#A1A1AA] uppercase">
                      {d.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono" style={{ color: getRiskColor(d.risk) }}>
                    {(d.similarity * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-sm text-[#E4E4E7] font-mono">
                    {formatViews(d.views)}
                  </td>
                  <td className="px-4 py-3">
                    <span 
                      className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                      style={{ 
                        color: getRiskColor(d.risk),
                        backgroundColor: `${getRiskColor(d.risk)}15`,
                        borderColor: `${getRiskColor(d.risk)}30`
                      }}
                    >
                      {d.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
