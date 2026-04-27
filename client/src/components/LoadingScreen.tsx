import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from './Logo'

const LOADING_TEXTS = [
  'Initializing analysis engine…',
  'Extracting video frames…',
  'Generating visual embeddings…',
  'Detecting similarities…',
  'Building intelligence graph…',
]

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [textIndex, setTextIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    // Cycle loading text
    const textInterval = setInterval(() => {
      setTextIndex(i => (i + 1) % LOADING_TEXTS.length)
    }, 700)

    // Smooth progress bar
    let p = 0
    const progressInterval = setInterval(() => {
      p += 100 / (3500 / 50)
      setProgress(Math.min(p, 100))
    }, 50)

    // Start exit after 3.5s
    const exitTimer = setTimeout(() => {
      clearInterval(textInterval)
      clearInterval(progressInterval)
      setProgress(100)
      setExiting(true)
      setTimeout(onComplete, 800)
    }, 3500)

    return () => {
      clearInterval(textInterval)
      clearInterval(progressInterval)
      clearTimeout(exitTimer)
    }
  }, [onComplete])

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="loading"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: 'radial-gradient(ellipse at center, #0d0d14 0%, #09090B 70%)' }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Particle grid (decorative) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-0.5 rounded-full"
                style={{
                  backgroundColor: i % 3 === 0 ? '#6366F1' : '#2DD4BF',
                  left: `${4 + (i % 6) * 16.5}%`,
                  top: `${10 + Math.floor(i / 6) * 22}%`,
                  opacity: 0,
                }}
                animate={{ opacity: [0, 0.4, 0] }}
                transition={{ duration: 2.5, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
          </div>

          {/* Center content */}
          <div className="relative flex flex-col items-center gap-8">
            {/* Logo + scan rings */}
            <div className="relative flex items-center justify-center">
              {/* Outer scan ring */}
              <motion.div
                className="absolute rounded-full border border-[#6366F1]/20"
                style={{ width: 160, height: 160 }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1, rotate: 360 }}
                transition={{ opacity: { duration: 0.5, delay: 0.4 }, scale: { duration: 0.6, delay: 0.4 }, rotate: { duration: 8, repeat: Infinity, ease: 'linear', delay: 0.4 } }}
              />
              {/* Inner scan ring */}
              <motion.div
                className="absolute rounded-full border border-[#2DD4BF]/30"
                style={{ width: 110, height: 110, borderStyle: 'dashed' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: -360 }}
                transition={{ opacity: { duration: 0.5, delay: 0.6 }, rotate: { duration: 5, repeat: Infinity, ease: 'linear', delay: 0.6 } }}
              />

              {/* Signal pulse lines */}
              {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                const rad = (angle * Math.PI) / 180
                const x2 = 85 * Math.cos(rad)
                const y2 = 85 * Math.sin(rad)
                return (
                  <motion.div
                    key={angle}
                    className="absolute"
                    style={{
                      width: 1,
                      height: 30,
                      backgroundColor: '#6366F1',
                      transformOrigin: 'top center',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, 0) rotate(${angle}deg) translateY(38px)`,
                      opacity: 0,
                    }}
                    animate={{ opacity: [0, 0.5, 0], scaleY: [0, 1, 0] }}
                    transition={{ duration: 1.5, delay: 0.8 + i * 0.1, repeat: Infinity, ease: 'easeOut' }}
                  />
                )
              })}

              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10"
              >
                <Logo size={56} />
              </motion.div>
            </div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-center"
            >
              <p className="text-2xl font-black tracking-tight" style={{ color: '#E4E4E7' }}>
                Vision<span style={{ color: '#6366F1' }}>Guard</span>
              </p>
              <p className="text-xs uppercase tracking-[0.3em] mt-1" style={{ color: '#52525B' }}>
                AI Media Intelligence
              </p>
            </motion.div>

            {/* Loading text (cycles) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="h-5 flex items-center justify-center"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={textIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-mono"
                  style={{ color: '#2DD4BF' }}
                >
                  {LOADING_TEXTS[textIndex]}
                </motion.p>
              </AnimatePresence>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="w-64"
            >
              <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #6366F1, #2DD4BF)',
                    boxShadow: '0 0 10px rgba(99,102,241,0.6)',
                    transition: 'width 0.1s linear',
                  }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-mono" style={{ color: '#3F3F46' }}>visionguard.ai/v2</span>
                <span className="text-[10px] font-mono" style={{ color: '#3F3F46' }}>{Math.round(progress)}%</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
