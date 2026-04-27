import { Card } from './Card'
import type { MetricCard as MetricCardType } from '../types'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  metric: MetricCardType
  accent?: string
}

export function MetricCard({ metric, accent = '#2DD4BF' }: MetricCardProps) {
  const TrendIcon = metric.change.startsWith('+') ? TrendingUp : TrendingDown
  const trendColor = metric.change.startsWith('+') ? '#EF4444' : '#10B981'

  return (
    <Card className="p-4">
      <p className="text-xs mb-2" style={{ color: '#71717A' }}>{metric.label}</p>
      <p className="text-2xl font-bold mb-1" style={{ color: accent }}>
        {metric.value}
      </p>
      <div className="flex items-center gap-1">
        <TrendIcon className="w-3 h-3" style={{ color: trendColor }} />
        <span className="text-xs font-medium" style={{ color: trendColor }}>
          {metric.change}
        </span>
        <span className="text-xs" style={{ color: '#52525B' }}>vs last scan</span>
      </div>
    </Card>
  )
}
