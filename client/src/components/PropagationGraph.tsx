import type { PropagationNode } from '../types'
import { getRiskColor } from '../lib/utils'
import { formatViews } from '../lib/utils'

interface PropagationGraphProps {
  nodes: PropagationNode[]
  selectedId?: string
  onSelectNode?: (id: string) => void
}

function getNodeRadius(views: number): number {
  const minR = 6
  const maxR = 22
  const maxViews = 2_840_000
  return Math.max(minR, Math.min(maxR, (views / maxViews) * maxR + minR))
}

export function PropagationGraph({ nodes, selectedId, onSelectNode }: PropagationGraphProps) {
  const W = 100
  const H = 100

  return (
    <div className="relative w-full" style={{ paddingBottom: '75%' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-amber">
            <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.05" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background glow */}
        <ellipse cx="50" cy="50" rx="48" ry="48" fill="url(#bgGrad)" />

        {/* Draw connection lines */}
        {nodes.map((node) =>
          node.connections.map((targetId) => {
            const target = nodes.find((n) => n.id === targetId)
            if (!target) return null
            const isHighRisk = target.risk === 'high' || node.risk === 'high'
            return (
              <line
                key={`${node.id}-${targetId}`}
                x1={node.x}
                y1={node.y}
                x2={target.x}
                y2={target.y}
                stroke={isHighRisk ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)'}
                strokeWidth="0.4"
                strokeDasharray={isHighRisk ? undefined : '1,1'}
              />
            )
          })
        )}

        {/* Draw nodes */}
        {nodes.map((node) => {
          const r = node.id === 'original' ? 10 : getNodeRadius(node.views)
          const color = node.id === 'original' ? '#6366F1' : getRiskColor(node.risk)
          const isSelected = selectedId === node.id
          const isOriginal = node.id === 'original'

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => onSelectNode?.(node.id)}
              style={{ cursor: 'pointer' }}
              filter={node.risk === 'high' ? 'url(#glow-red)' : undefined}
            >
              {/* Outer ring for selected */}
              {isSelected && (
                <circle
                  r={r + 3}
                  fill="none"
                  stroke={color}
                  strokeWidth="0.6"
                  opacity="0.5"
                />
              )}
              {/* Pulse for original */}
              {isOriginal && (
                <circle
                  r={r + 4}
                  fill="none"
                  stroke={color}
                  strokeWidth="0.4"
                  opacity="0.3"
                >
                  <animate attributeName="r" values={`${r + 2};${r + 6};${r + 2}`} dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Main circle */}
              <circle
                r={r}
                fill={color}
                fillOpacity={isOriginal ? 0.9 : 0.7}
                stroke={color}
                strokeWidth={isSelected ? 0.8 : 0.3}
                strokeOpacity={isSelected ? 1 : 0.5}
              />
              {/* Views text inside larger nodes */}
              {r > 10 && (
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="2.5"
                  fill="white"
                  opacity="0.85"
                  fontWeight="600"
                >
                  {formatViews(node.views)}
                </text>
              )}
              {/* Label below */}
              <text
                y={r + 3.5}
                textAnchor="middle"
                fontSize="2.2"
                fill={isOriginal ? '#E4E4E7' : '#A1A1AA'}
                fontWeight={isOriginal ? '700' : '400'}
              >
                {node.title.length > 14 ? node.title.slice(0, 14) + '…' : node.title}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
