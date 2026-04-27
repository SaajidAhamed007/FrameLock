import {
  LayoutDashboard,
  ScanLine,
  ShieldCheck,
  Zap,
  Share2,
  FileBarChart2,
  Video,
  Camera,
  MessageSquare,
  ChevronRight,
  Eye,
  User,
  Archive,
} from 'lucide-react'

import { Logo } from './Logo'

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scan', label: 'New Scan', icon: ScanLine },
  { id: 'precheck', label: 'Pre-upload Check', icon: ShieldCheck },
  { id: 'detections', label: 'Detections', icon: Zap },
  { id: 'propagation', label: 'Propagation', icon: Share2 },
  { id: 'reports', label: 'Reports', icon: FileBarChart2 },
  { id: 'assets', label: 'Monitored Assets', icon: Archive },
]

const platforms = [
  { id: 'youtube', label: 'YouTube', icon: Video, active: true },
  { id: 'instagram', label: 'Instagram', icon: Camera, active: false },
  { id: 'twitter', label: 'X (Twitter)', icon: MessageSquare, active: false },
]

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        backgroundColor: '#18181B',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Logo size={32} />
        <div>
          <p className="font-bold text-sm" style={{ color: '#E4E4E7' }}>VisionGuard</p>
          <p className="text-[10px]" style={{ color: '#71717A' }}>AI Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2" style={{ color: '#52525B' }}>
          Navigation
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            return (
              <li key={item.id}>
                <button
                  id={`nav-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  style={{
                    color: isActive ? '#E4E4E7' : '#71717A',
                    backgroundColor: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-white/5 hover:text-[#E4E4E7] group"
                >
                  <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? '#6366F1' : undefined }} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" style={{ color: '#6366F1' }} />}
                </button>
              </li>
            )
          })}
        </ul>

        {/* Platforms */}
        <div className="mt-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2" style={{ color: '#52525B' }}>
            Platforms
          </p>
          <ul className="space-y-0.5">
            {platforms.map((p) => {
              const Icon = p.icon
              return (
                <li key={p.id}>
                  <button
                    id={`platform-${p.id}`}
                    disabled={!p.active}
                    style={{
                      color: p.active ? '#E4E4E7' : '#3F3F46',
                      backgroundColor: p.active ? 'rgba(255,255,255,0.04)' : 'transparent',
                      cursor: p.active ? 'pointer' : 'not-allowed',
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{p.label}</span>
                    {p.active ? (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: '#10B98120', color: '#10B981' }}
                      >
                        Live
                      </span>
                    ) : (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#52525B' }}
                      >
                        Soon
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* User Profile */}
      <div
        className="px-3 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          id="user-profile-btn"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 hover:bg-white/5"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <p className="text-sm font-medium truncate" style={{ color: '#E4E4E7' }}>Navdeep R.</p>
            <p className="text-[11px] truncate" style={{ color: '#71717A' }}>navdeep@visionguard.ai</p>
          </div>
        </button>
      </div>
    </aside>
  )
}
