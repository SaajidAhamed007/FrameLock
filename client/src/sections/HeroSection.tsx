import { useEffect, useRef, useState } from 'react'
import { motion, useAnimation, animate } from 'framer-motion'
import { Clock, Cpu, Layers, Shield, CheckCircle2, Fingerprint } from 'lucide-react'
import type { OriginalVideo, FingerprintInfo, RiskSummary } from '../types'

interface HeroSectionProps {
  video: OriginalVideo
  fingerprint: FingerprintInfo
  riskSummary: RiskSummary
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 1.5) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setValue(Math.round(v)),
    })
    return controls.stop
  }, [target, duration])
  return value
}

// SVG animated risk ring
function AnimatedRiskRing({ summary }: { summary: RiskSummary }) {
  const total = Math.max(1, summary.high + summary.medium + summary.low)
  const r = 44
  const cx = 60
  const cy = 60
  const circumference = 2 * Math.PI * r

  const segments = [
    { count: summary.high, color: '#EF4444', shadow: 'rgba(239,68,68,0.6)' },
    { count: summary.medium, color: '#F59E0B', shadow: 'rgba(245,158,11,0.4)' },
    { count: summary.low, color: '#10B981', shadow: 'rgba(16,185,129,0.4)' },
  ]

  let offset = circumference / 4
  const animCount = useAnimatedCounter(summary.high + summary.medium + summary.low)

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
          {segments.map((seg, i) => {
            const dash = (seg.count / total) * circumference
            const el = (
              <motion.circle
                key={i}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                transform="rotate(-90 60 60)"
                style={{ filter: `drop-shadow(0 0 8px ${seg.shadow})` }}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
                transition={{ duration: 1.4, delay: 0.3 + i * 0.2, ease: 'easeOut' }}
              />
            )
            offset -= dash
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white font-mono">{animCount}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#EF4444]">Threats</span>
        </div>
      </div>

      <div className="w-full space-y-2.5">
        {[
          { label: 'High', count: summary.high, color: '#EF4444' },
          { label: 'Medium', count: summary.medium, color: '#F59E0B' },
          { label: 'Low', count: summary.low, color: '#10B981' },
        ].map((item, i) => (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: item.color }}>{item.label}</span>
              <span className="font-mono font-bold text-white">{item.count}</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}60` }}
                initial={{ width: 0 }}
                animate={{ width: `${(item.count / total) * 100}%` }}
                transition={{ duration: 1.2, delay: 0.6 + i * 0.15, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Breathing fingerprint waveform
function FingerprintVisual({ id }: { id: string }) {
  const bars = Array.from({ length: 40 }).map((_, i) => ({
    h: Math.abs(Math.sin(i * 0.72) * 38 + Math.cos(i * 0.31) * 18) + 6,
    color: i % 3 === 0 ? '#6366F1' : i % 3 === 1 ? '#2DD4BF' : 'rgba(99,102,241,0.35)',
    delay: i * 0.025,
  }))

  return (
    <div className="relative">
      {/* Scan line sweep */}
      <div
        className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <div
          className="absolute top-0 bottom-0 w-8"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.15), transparent)',
            animation: 'scanline 2.8s ease-in-out infinite',
          }}
        />
      </div>

      <div
        className="relative rounded-xl flex flex-col gap-3 p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(45,212,191,0.04))',
          border: '1px solid rgba(99,102,241,0.18)',
          animation: 'breathe 4s ease-in-out infinite',
        }}
      >
        {/* Waveform */}
        <div className="flex items-center gap-[3px] h-14 justify-center">
          {bars.map((bar, i) => (
            <motion.div
              key={i}
              className="rounded-full flex-shrink-0"
              style={{ width: 3, backgroundColor: bar.color }}
              animate={{ height: [bar.h * 0.6, bar.h, bar.h * 0.7, bar.h] }}
              transition={{ duration: 3.5, delay: bar.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        {/* FP ID */}
        <div
          className="px-3 py-2 rounded-lg font-mono text-xs text-center"
          style={{ backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818CF8' }}
        >
          {id}
        </div>
      </div>
    </div>
  )
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
}

export function HeroSection({ video, fingerprint, riskSummary }: HeroSectionProps) {
  const uploadDate = new Date(video.uploadedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <>
      {/* CSS keyframes injected globally */}
      <style>{`
        @keyframes scanline {
          0% { left: -10%; }
          100% { left: 110%; }
        }
        @keyframes breathe {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
          50% { box-shadow: 0 0 24px 4px rgba(99,102,241,0.12); }
        }
        @keyframes completeSlide {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <section aria-labelledby="hero-section-title">
        {/* Section label */}
        <motion.div
          className="flex items-center gap-3 mb-5"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#6366F1', boxShadow: '0 0 12px #6366F1' }} />
          <h2 id="hero-section-title" className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
            Scan Overview
          </h2>
          {/* Analysis complete badge */}
          <div
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#10B981',
              animation: 'completeSlide 0.6s 0.8s both',
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Analysis Complete
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-5">
          {/* A: Original Video */}
          <motion.div
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #1a1a1f, #16161a)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 0 0 0 transparent',
            }}
            whileHover={{ boxShadow: '0 0 32px rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.2)' }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest px-5 pt-4 pb-0" style={{ color: '#52525B' }}>
              Original Video
            </p>

            {/* Thumbnail */}
            <div className="mx-4 mt-3 rounded-xl overflow-hidden relative flex items-center justify-center" style={{ aspectRatio: '16/9', backgroundColor: '#09090B' }}>
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            <div className="px-5 py-4 space-y-3">
              <p className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: '#E4E4E7' }}>
                {video.title}
              </p>
              {video.channel && (
                <p className="text-[11px]" style={{ color: '#A1A1AA' }}>
                  {video.channel}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Clock, label: video.duration },
                  { icon: Cpu, label: video.platform?.toUpperCase() || 'YOUTUBE' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 bg-white/[0.03] px-2.5 py-2 rounded-lg border border-white/5">
                    <Icon className="w-3 h-3 shrink-0" style={{ color: '#52525B' }} />
                    <span className="text-[11px] truncate" style={{ color: '#A1A1AA' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* B: Content Fingerprint */}
          <motion.div
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{
              background: 'linear-gradient(145deg, #1a1a1f, #16161a)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            whileHover={{ borderColor: 'rgba(45,212,191,0.2)', boxShadow: '0 0 32px rgba(45,212,191,0.08)' }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#52525B' }}>
                Content Fingerprint
              </p>
              <Fingerprint className="w-4 h-4" style={{ color: '#2DD4BF', opacity: 0.7 }} />
            </div>

            <FingerprintVisual id={fingerprint.id} />

            <div className="grid grid-cols-2 gap-3 mt-auto">
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Layers className="w-3 h-3" style={{ color: '#52525B' }} />
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: '#52525B' }}>Frames</p>
                </div>
                <p className="text-lg font-black font-mono" style={{ color: '#E4E4E7' }}>{fingerprint.framesAnalyzed}</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Cpu className="w-3 h-3" style={{ color: '#52525B' }} />
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: '#52525B' }}>Model</p>
                </div>
                <p className="text-[11px] font-bold" style={{ color: '#E4E4E7' }}>{fingerprint.model}</p>
              </div>
            </div>
          </motion.div>

          {/* C: Risk Summary */}
          <motion.div
            custom={2}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{
              background: 'linear-gradient(145deg, #1a1a1f, #16161a)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            whileHover={{ borderColor: 'rgba(239,68,68,0.2)', boxShadow: '0 0 32px rgba(239,68,68,0.06)' }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#52525B' }}>
                Risk Summary
              </p>
              <div className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                HIGH RISK
              </div>
            </div>
            <AnimatedRiskRing summary={riskSummary} />
          </motion.div>
        </div>
      </section>
    </>
  )
}
