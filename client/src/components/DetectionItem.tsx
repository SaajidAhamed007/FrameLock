import { Card } from './Card'
import { RiskBadge } from './RiskBadge'
import type { Detection } from '../types'
import { formatViews, getSimilarityPercent, getRiskColor } from '../lib/utils'
import { ExternalLink, Video } from 'lucide-react'
import { useState } from 'react'

interface DetectionItemProps {
  detection: Detection
  isSelected: boolean
  rank: number
  onSelect: (d: Detection) => void
}

export function DetectionItem({ detection, isSelected, rank, onSelect }: DetectionItemProps) {
  const color = getRiskColor(detection.risk)
  const pct = detection.similarity * 100
  const [imageError, setImageError] = useState(false)

  // Debug logging
  console.log(`[DetectionItem] Rendering ${detection.title}:`, {
    thumbnailUrl: detection.thumbnailUrl,
    imageError,
    willShowImage: !imageError && !!detection.thumbnailUrl
  })

  return (
    <Card
      hover
      glow={detection.risk === 'high'}
      className="p-3"
      onClick={() => onSelect(detection)}
      style={{
        border: isSelected
          ? `1px solid ${color}40`
          : '1px solid rgba(255,255,255,0.08)',
        backgroundColor: isSelected ? `${color}08` : '#1F1F23',
      }}
    >
      <div className="flex gap-3">
        {/* Rank + thumbnail */}
        <div className="relative shrink-0">
          <div
            className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-10"
            style={{ backgroundColor: color, color: 'white' }}
          >
            {rank}
          </div>
          <div className="w-20 h-12 rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center">
            {!imageError && detection.thumbnailUrl ? (
              <img
                src={detection.thumbnailUrl}
                alt={detection.title}
                className="w-full h-full object-cover"
                onError={() => {
                  console.error(`[DetectionItem] Image failed to load: ${detection.thumbnailUrl}`)
                  setImageError(true)
                }}
                onLoad={() => console.log(`[DetectionItem] Image loaded: ${detection.thumbnailUrl}`)}
              />
            ) : (
              <Video className="w-6 h-6" style={{ color: '#52525B' }} />
            )}
          </div>
          {/* Similarity bar at bottom of thumb */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate mb-0.5" style={{ color: '#E4E4E7' }}>
            {detection.title}
          </p>
          <p className="text-[11px] mb-1.5" style={{ color: '#71717A' }}>
            {detection.channel}
          </p>
          <div className="flex items-center justify-between gap-2">
            <RiskBadge risk={detection.risk} size="sm" />
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono font-bold" style={{ color }}>
                {getSimilarityPercent(detection.similarity)}
              </span>
              <span className="text-[11px]" style={{ color: '#52525B' }}>
                {formatViews(detection.views)} views
              </span>
            </div>
          </div>
        </div>

        <a
          href={detection.url}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start mt-0.5 shrink-0 opacity-30 hover:opacity-80 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          aria-label="Open video in new tab"
        >
          <ExternalLink className="w-3.5 h-3.5" style={{ color: '#A1A1AA' }} />
        </a>
      </div>
    </Card>
  )
}
