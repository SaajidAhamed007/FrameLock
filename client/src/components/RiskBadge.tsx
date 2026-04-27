import type { RiskLevel } from '../types'
import { getRiskColor, getRiskBg } from '../lib/utils'

interface RiskBadgeProps {
  risk: RiskLevel
  size?: 'sm' | 'md'
}

export function RiskBadge({ risk, size = 'md' }: RiskBadgeProps) {
  const color = getRiskColor(risk)
  const bg = getRiskBg(risk)
  const label = risk.charAt(0).toUpperCase() + risk.slice(1)

  return (
    <span
      style={{ color, backgroundColor: bg, border: `1px solid ${color}22` }}
      className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wider ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span
        style={{ backgroundColor: color }}
        className="w-1.5 h-1.5 rounded-full"
      />
      {label}
    </span>
  )
}
