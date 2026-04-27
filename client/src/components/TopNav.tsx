import { Calendar, Download, ChevronDown, Video } from 'lucide-react'

interface TopNavProps {
  title: string
}

export function TopNav({ title }: TopNavProps) {
  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 flex items-center px-6 gap-4"
      style={{
        left: 240,
        backgroundColor: 'rgba(9,9,11,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-base font-semibold" style={{ color: '#E4E4E7' }}>
          {title}
        </h1>
        <p className="text-xs" style={{ color: '#71717A' }}>
          AI-powered unauthorized media detection
        </p>
      </div>

      {/* Platform chip */}
      <button
        id="platform-chip-youtube"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-white/5"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#E4E4E7',
        }}
      >
        <Video className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
        YouTube
        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
      </button>

      {/* Date selector */}
      <button
        id="date-selector-btn"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-white/5"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#A1A1AA',
        }}
      >
        <Calendar className="w-3.5 h-3.5" />
        Mar 15 – Apr 27, 2024
        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
      </button>

      {/* Export button */}
      <button
        id="export-report-btn"
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:brightness-110 active:scale-95"
        style={{
          backgroundColor: '#10B981',
          color: 'white',
          boxShadow: '0 0 24px rgba(16,185,129,0.25)',
        }}
      >
        <Download className="w-3.5 h-3.5" />
        Export Report
      </button>
    </header>
  )
}
