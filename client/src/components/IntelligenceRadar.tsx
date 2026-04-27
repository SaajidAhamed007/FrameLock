import { useEffect, useRef, useState } from 'react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Activity, FileBarChart2, Eye, Zap, TrendingUp } from 'lucide-react'

export type RadarNodeType = 'high-risk' | 'medium-risk' | 'propagation' | 'insights' | 'reports' | 'anomalies'

interface RadarNode {
  type: RadarNodeType
  label: string
  icon: React.ElementType
  color: string
  count?: number
}

const RADAR_NODES: RadarNode[] = [
  { type: 'high-risk', label: 'High Risk', icon: AlertTriangle, color: '#EF4444', count: 0 },
  { type: 'propagation', label: 'Propagation', icon: Activity, color: '#6366F1' },
  { type: 'reports', label: 'Reports', icon: FileBarChart2, color: '#2DD4BF' },
  { type: 'insights', label: 'AI Insights', icon: Eye, color: '#818CF8' },
  { type: 'anomalies', label: 'Anomalies', icon: Zap, color: '#F59E0B' },
  { type: 'medium-risk', label: 'Medium Risk', icon: TrendingUp, color: '#F59E0B', count: 0 },
]

interface IntelligenceRadarProps {
  highRiskCount?: number
  mediumRiskCount?: number
  onNodeClick: (type: RadarNodeType) => void
}

export function IntelligenceRadar({ highRiskCount = 0, mediumRiskCount = 0, onNodeClick }: IntelligenceRadarProps) {
  const controls = useAnimation()
  const counterControls = useAnimation()
  const [hoveredNode, setHoveredNode] = useState<number | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const rotationRef = useRef(0)

  const nodes = RADAR_NODES.map(n => ({
    ...n,
    count: n.type === 'high-risk' ? highRiskCount : n.type === 'medium-risk' ? mediumRiskCount : n.count,
  }))

  useEffect(() => {
    controls.start({
      rotate: 360,
      transition: { duration: 22, repeat: Infinity, ease: 'linear' },
    })
    counterControls.start({
      rotate: -360,
      transition: { duration: 22, repeat: Infinity, ease: 'linear' },
    })
  }, [controls, counterControls])

  const handleMouseEnter = () => {
    setIsHovered(true)
    controls.stop()
    counterControls.stop()
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    controls.start({ rotate: 360, transition: { duration: 22, repeat: Infinity, ease: 'linear' } })
    counterControls.start({ rotate: -360, transition: { duration: 22, repeat: Infinity, ease: 'linear' } })
  }

  const RADIUS = 100

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#52525B' }}>
        Intelligence Radar
      </p>

      <div
        className="relative"
        style={{ width: 280, height: 280 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background rings */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 280">
          <defs>
            <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="140" cy="140" r="130" fill="url(#radar-bg)" />
          {[40, 70, 100, 130].map(r => (
            <circle
              key={r}
              cx="140" cy="140" r={r}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
              strokeDasharray={r > 80 ? "4 5" : "2 3"}
            />
          ))}
          {/* Sweep indicator line */}
          <motion.line
            x1="140" y1="140" x2="140" y2="10"
            stroke="rgba(99,102,241,0.3)"
            strokeWidth="1"
            animate={{ rotate: isHovered ? 0 : 360 }}
            style={{ transformOrigin: '140px 140px' }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
          {/* Sweep gradient arc */}
          <motion.path
            d="M 140 140 L 140 10 A 130 130 0 0 1 240 115 Z"
            fill="rgba(99,102,241,0.04)"
            animate={{ rotate: isHovered ? 0 : 360 }}
            style={{ transformOrigin: '140px 140px' }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
        </svg>

        {/* Orbital ring - rotates */}
        <motion.div
          animate={controls}
          className="absolute"
          style={{ width: 280, height: 280, inset: 0 }}
        >
          {nodes.map((node, i) => {
            const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2
            const nx = 140 + RADIUS * Math.cos(angle)
            const ny = 140 + RADIUS * Math.sin(angle)
            const Icon = node.icon
            const isNodeHovered = hoveredNode === i
            const isHighRisk = node.type === 'high-risk'

            return (
              <motion.div
                key={node.type}
                className="absolute"
                style={{
                  left: nx - 20,
                  top: ny - 20,
                  width: 40,
                  height: 40,
                }}
              >
                {/* Counter-rotate to stay upright */}
                <motion.div
                  animate={counterControls}
                  className="w-full h-full flex items-center justify-center"
                >
                  <motion.button
                    onHoverStart={() => setHoveredNode(i)}
                    onHoverEnd={() => setHoveredNode(null)}
                    onClick={() => onNodeClick(node.type)}
                    className="relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
                    style={{
                      backgroundColor: `${node.color}18`,
                      border: `1px solid ${node.color}35`,
                    }}
                    whileHover={{ scale: 1.35, boxShadow: `0 0 20px ${node.color}60` }}
                    whileTap={{ scale: 0.9 }}
                    animate={isHighRisk && !isHovered ? {
                      boxShadow: [`0 0 8px ${node.color}30`, `0 0 20px ${node.color}60`, `0 0 8px ${node.color}30`]
                    } : {}}
                    transition={isHighRisk ? { duration: 2, repeat: Infinity } : { duration: 0.2 }}
                  >
                    <Icon className="w-4 h-4" style={{ color: node.color }} />
                    {node.count !== undefined && node.count > 0 && (
                      <div
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                        style={{ backgroundColor: node.color, color: 'white' }}
                      >
                        {node.count}
                      </div>
                    )}
                  </motion.button>

                  {/* Tooltip */}
                  <AnimatePresence>
                    {isNodeHovered && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute pointer-events-none z-20 px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap"
                        style={{
                          backgroundColor: 'rgba(15,15,20,0.95)',
                          border: `1px solid ${node.color}40`,
                          color: node.color,
                          top: -28,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          boxShadow: `0 0 12px ${node.color}20`,
                        }}
                      >
                        {node.label}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Center node */}
        <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <motion.div
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(45,212,191,0.15))',
              border: '1px solid rgba(99,102,241,0.4)',
            }}
            animate={{ boxShadow: ['0 0 16px rgba(99,102,241,0.2)', '0 0 32px rgba(99,102,241,0.45)', '0 0 16px rgba(99,102,241,0.2)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Ripple rings */}
            {[1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-2xl"
                style={{ inset: -i * 8, border: '1px solid rgba(99,102,241,0.15)' }}
                animate={{ opacity: [0.4, 0, 0.4], scale: [1, 1.15, 1] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.8, ease: 'easeInOut' }}
              />
            ))}
            <Eye className="w-6 h-6 text-[#818CF8]" />
          </motion.div>
          <p className="text-[10px] font-bold text-center mt-2" style={{ color: '#52525B' }}>SOURCE</p>
        </div>
      </div>
    </div>
  )
}
