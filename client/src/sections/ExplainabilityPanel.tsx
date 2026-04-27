import { Card } from '../components/Card'
import type { Detection, ExplainabilityData } from '../types'
import { Brain, AlertTriangle, Eye, Music, Hash, ChevronRight } from 'lucide-react'
import { getRiskColor } from '../lib/utils'

interface ExplainabilityPanelProps {
  detection: Detection | null
  data: ExplainabilityData
}

function ConfidenceBar({ label, value, icon: Icon, color }: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-xs" style={{ color: '#A1A1AA' }}>{label}</span>
        </div>
        <span className="text-xs font-bold font-mono" style={{ color }}>
          {(value * 100).toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${value * 100}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  )
}

export function ExplainabilityPanel({ detection, data }: ExplainabilityPanelProps) {
  if (!detection) {
    return (
      <section aria-labelledby="explainability-title">
        <Card className="p-6 text-center">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#6366F1' }} />
            <h2 id="explainability-title" className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
              AI Explainability
            </h2>
          </div>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: 'rgba(99,102,241,0.08)' }}
          >
            <Brain className="w-7 h-7" style={{ color: '#52525B' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: '#52525B' }}>No Detection Selected</p>
          <p className="text-xs" style={{ color: '#3F3F46' }}>Click a detection to see AI analysis details</p>
        </Card>
      </section>
    )
  }

  const riskColor = getRiskColor(detection.risk)

  return (
    <section aria-labelledby="explainability-title">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#6366F1' }} />
        <h2 id="explainability-title" className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
          AI Explainability
        </h2>
        <span className="text-xs" style={{ color: '#52525B' }}>— why this was flagged</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Why flagged */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${riskColor}15` }}
            >
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: riskColor }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: '#A1A1AA' }}>Detection Reasons</p>
          </div>
          <div className="space-y-2">
            {data.whyFlagged.map((reason, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: riskColor }} />
                <p className="text-xs leading-relaxed" style={{ color: '#A1A1AA' }}>{reason}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Similarity breakdown */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(99,102,241,0.12)' }}
            >
              <Brain className="w-3.5 h-3.5" style={{ color: '#6366F1' }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: '#A1A1AA' }}>Similarity Breakdown</p>
          </div>
          <div className="space-y-4">
            <ConfidenceBar
              label="Visual Similarity"
              value={data.visualSimilarity}
              icon={Eye}
              color="#EF4444"
            />
            <ConfidenceBar
              label="Metadata Match"
              value={data.metadataSimilarity}
              icon={Hash}
              color="#F59E0B"
            />
            <ConfidenceBar
              label="Audio Match"
              value={data.audioSimilarity}
              icon={Music}
              color="#6366F1"
            />
          </div>
        </Card>

        {/* Confidence */}
        <Card className="p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(45,212,191,0.12)' }}
            >
              <Brain className="w-3.5 h-3.5" style={{ color: '#2DD4BF' }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: '#A1A1AA' }}>AI Confidence</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            {/* Circular confidence */}
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="#2DD4BF"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${data.confidence * 251.2} 251.2`}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(45,212,191,0.5))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold" style={{ color: '#2DD4BF' }}>
                  {(data.confidence * 100).toFixed(0)}%
                </p>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: '#71717A' }}>Confidence</p>
              </div>
            </div>

            {/* Detection info */}
            <div className="w-full px-2 space-y-2">
              <div
                className="px-3 py-2 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-xs" style={{ color: '#71717A' }}>Flagged Video</span>
                <span className="text-xs font-medium truncate max-w-[100px]" style={{ color: '#E4E4E7' }}>
                  {detection.channel}
                </span>
              </div>
              <div
                className="px-3 py-2 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-xs" style={{ color: '#71717A' }}>Similarity</span>
                <span className="text-xs font-bold font-mono" style={{ color: riskColor }}>
                  {(detection.similarity * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
