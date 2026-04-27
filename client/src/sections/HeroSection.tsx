import { Card } from '../components/Card'
import { RiskBadge } from '../components/RiskBadge'
import type { OriginalVideo, FingerprintInfo, RiskSummary } from '../types'
import { Clock, Maximize2, Calendar, Cpu, Layers } from 'lucide-react'

interface HeroSectionProps {
  video: OriginalVideo
  fingerprint: FingerprintInfo
  riskSummary: RiskSummary
}

function RiskRadial({ summary }: { summary: RiskSummary }) {
  const total = summary.high + summary.medium + summary.low
  const highPct = (summary.high / total) * 100
  const medPct = (summary.medium / total) * 100
  const lowPct = (summary.low / total) * 100

  // SVG donut chart parameters
  const r = 42
  const cx = 56
  const cy = 56
  const circumference = 2 * Math.PI * r

  const highDash = (highPct / 100) * circumference
  const medDash = (medPct / 100) * circumference
  const lowDash = (lowPct / 100) * circumference

  return (
    <div className="flex items-center gap-6">
      {/* Donut */}
      <div className="relative shrink-0">
        <svg width="112" height="112" viewBox="0 0 112 112">
          {/* Background track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />

          {/* High risk segment */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#EF4444"
            strokeWidth="10"
            strokeDasharray={`${highDash} ${circumference - highDash}`}
            strokeDashoffset={circumference / 4}
            transform="rotate(-90 56 56)"
            style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' }}
          />
          {/* Medium risk segment */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="10"
            strokeDasharray={`${medDash} ${circumference - medDash}`}
            strokeDashoffset={circumference / 4 - highDash}
            transform="rotate(-90 56 56)"
          />
          {/* Low risk segment */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#10B981"
            strokeWidth="10"
            strokeDasharray={`${lowDash} ${circumference - lowDash}`}
            strokeDashoffset={circumference / 4 - (highDash + medDash)}
            transform="rotate(-90 56 56)"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#EF4444' }}>HIGH</span>
          <span className="text-xs font-bold" style={{ color: '#EF4444' }}>RISK</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        {[
          { label: 'High Risk', count: summary.high, color: '#EF4444', pct: highPct },
          { label: 'Medium Risk', count: summary.medium, color: '#F59E0B', pct: medPct },
          { label: 'Low Risk', count: summary.low, color: '#10B981', pct: lowPct },
        ].map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs" style={{ color: '#A1A1AA' }}>{item.label}</span>
              </div>
              <span className="text-xs font-bold" style={{ color: item.color }}>{item.count}</span>
            </div>
            <div className="h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${item.pct}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
        <p className="text-xs pt-1" style={{ color: '#52525B' }}>
          {total} total detections
        </p>
      </div>
    </div>
  )
}

export function HeroSection({ video, fingerprint, riskSummary }: HeroSectionProps) {
  const uploadDate = new Date(video.uploadedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  return (
    <section aria-labelledby="hero-section-title">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#6366F1' }} />
        <h2 id="hero-section-title" className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
          Scan Overview
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* A: Original Video */}
        <Card className="p-4" glow>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#52525B' }}>
            Original Video
          </p>
          <div className="rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '16/9', backgroundColor: '#0a0a0c' }}>
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const el = e.target as HTMLImageElement
                el.style.display = 'none'
              }}
            />
          </div>
          <p className="text-sm font-semibold mb-3 leading-snug" style={{ color: '#E4E4E7' }}>
            {video.title}
          </p>
          <div className="space-y-1.5">
            {[
              { icon: Clock, label: video.duration },
              { icon: Maximize2, label: video.resolution },
              { icon: Calendar, label: uploadDate },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: '#52525B' }} />
                <span className="text-xs" style={{ color: '#A1A1AA' }}>{label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* B: Content Fingerprint */}
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#52525B' }}>
            Content Fingerprint
          </p>

          {/* Fingerprint visual */}
          <div
            className="rounded-xl flex items-center justify-center mb-4"
            style={{
              height: 120,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(45,212,191,0.05))',
              border: '1px solid rgba(99,102,241,0.15)',
            }}
          >
            {/* Waveform bars */}
            <div className="flex items-center gap-0.5 px-4">
              {Array.from({ length: 36 }).map((_, i) => {
                const h = Math.abs(Math.sin(i * 0.7) * 40 + Math.cos(i * 0.3) * 20) + 8
                return (
                  <div
                    key={i}
                    className="w-1 rounded-full"
                    style={{
                      height: `${h}px`,
                      background: i % 3 === 0 ? '#6366F1' : i % 3 === 1 ? '#2DD4BF' : 'rgba(99,102,241,0.4)',
                      opacity: 0.8 + Math.random() * 0.2,
                    }}
                  />
                )
              })}
            </div>
          </div>

          <div
            className="px-3 py-2 rounded-lg mb-3 font-mono text-xs"
            style={{
              backgroundColor: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.15)',
              color: '#818CF8',
            }}
          >
            {fingerprint.id}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" style={{ color: '#52525B' }} />
              <div>
                <p className="text-[10px]" style={{ color: '#52525B' }}>Frames</p>
                <p className="text-xs font-bold" style={{ color: '#E4E4E7' }}>{fingerprint.framesAnalyzed}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" style={{ color: '#52525B' }} />
              <div>
                <p className="text-[10px]" style={{ color: '#52525B' }}>Model</p>
                <p className="text-xs font-bold" style={{ color: '#E4E4E7' }}>{fingerprint.model}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* C: Risk Summary */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#52525B' }}>
              Risk Summary
            </p>
            <RiskBadge risk="high" />
          </div>
          <RiskRadial summary={riskSummary} />
        </Card>
      </div>
    </section>
  )
}
