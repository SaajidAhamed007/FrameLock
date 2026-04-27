import { Card } from '../components/Card'
import { UploadBox } from '../components/UploadBox'
import { ShieldCheck } from 'lucide-react'

export function PreUploadSection() {
  return (
    <section aria-labelledby="preupload-title">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#10B981' }} />
              <h2 id="preupload-title" className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
                Pre-upload Check
              </h2>
            </div>
            <p className="text-xs ml-3" style={{ color: '#52525B' }}>
              Scan your video before publishing to detect potential copyright conflicts
            </p>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.15)',
            }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: '#10B981' }} />
            <span className="text-xs font-semibold" style={{ color: '#10B981' }}>
              Protection Active
            </span>
          </div>
        </div>

        <UploadBox />
      </Card>
    </section>
  )
}
