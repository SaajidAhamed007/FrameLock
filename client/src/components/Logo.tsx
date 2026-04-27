interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 32, className = '' }: LogoProps) {
  const s = size
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="vg-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#2DD4BF" />
        </linearGradient>
        <linearGradient id="vg-grad2" x1="40" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818CF8" />
          <stop offset="1" stopColor="#2DD4BF" />
        </linearGradient>
        <filter id="vg-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer radar ring — dashed */}
      <circle
        cx="20" cy="20" r="18"
        stroke="url(#vg-grad)"
        strokeWidth="1"
        strokeDasharray="3.5 2.2"
        strokeOpacity="0.5"
      />

      {/* Inner ring */}
      <circle
        cx="20" cy="20" r="13"
        stroke="url(#vg-grad)"
        strokeWidth="0.6"
        strokeOpacity="0.25"
      />

      {/* Eye shape — two arcs forming an eye */}
      <path
        d="M8 20 Q20 8 32 20 Q20 32 8 20 Z"
        stroke="url(#vg-grad)"
        strokeWidth="1.5"
        fill="none"
        filter="url(#vg-glow)"
      />

      {/* Iris */}
      <circle cx="20" cy="20" r="5.5" fill="url(#vg-grad2)" opacity="0.9" filter="url(#vg-glow)" />

      {/* Pupil highlight */}
      <circle cx="21.5" cy="18.5" r="1.5" fill="white" opacity="0.35" />

      {/* Radar sweep line */}
      <line x1="20" y1="20" x2="32" y2="20" stroke="url(#vg-grad)" strokeWidth="0.8" strokeOpacity="0.6" />

      {/* Cross hairs */}
      <line x1="20" y1="2" x2="20" y2="6" stroke="#2DD4BF" strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="20" y1="34" x2="20" y2="38" stroke="#2DD4BF" strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="2" y1="20" x2="6" y2="20" stroke="#2DD4BF" strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="34" y1="20" x2="38" y2="20" stroke="#2DD4BF" strokeWidth="1.2" strokeOpacity="0.5" />

      {/* Corner tick marks */}
      <path d="M5.5 5.5 L8 5.5 L8 8" stroke="#6366F1" strokeWidth="1" fill="none" strokeOpacity="0.6" />
      <path d="M34.5 5.5 L32 5.5 L32 8" stroke="#6366F1" strokeWidth="1" fill="none" strokeOpacity="0.6" />
      <path d="M5.5 34.5 L8 34.5 L8 32" stroke="#6366F1" strokeWidth="1" fill="none" strokeOpacity="0.6" />
      <path d="M34.5 34.5 L32 34.5 L32 32" stroke="#6366F1" strokeWidth="1" fill="none" strokeOpacity="0.6" />
    </svg>
  )
}
