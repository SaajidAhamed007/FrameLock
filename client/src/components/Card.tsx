import { cn } from '../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  style?: React.CSSProperties
  onClick?: React.MouseEventHandler<HTMLDivElement>
}

export function Card({ children, className, hover = false, glow = false, style, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#1F1F23',
        border: '1px solid rgba(255,255,255,0.08)',
        ...style,
      }}
      className={cn(
        'rounded-xl',
        hover && 'transition-all duration-200 hover:border-white/[0.14] hover:bg-[#27272A] hover:shadow-lg hover:shadow-black/30 cursor-pointer',
        glow && 'hover:shadow-indigo-500/10',
        className
      )}
    >
      {children}
    </div>
  )
}
