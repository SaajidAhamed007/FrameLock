import { Card } from '../components/Card'
import { ProgressStepper } from '../components/ProgressStepper'
import { Upload, Brain, Search, Share2, FileBarChart2 } from 'lucide-react'

const steps = [
  {
    id: 'upload',
    label: 'Upload',
    icon: <Upload className="w-4 h-4" />,
    status: 'completed' as const,
  },
  {
    id: 'analyze',
    label: 'Analyze',
    icon: <Brain className="w-4 h-4" />,
    status: 'completed' as const,
  },
  {
    id: 'detect',
    label: 'Detect',
    icon: <Search className="w-4 h-4" />,
    status: 'active' as const,
  },
  {
    id: 'propagate',
    label: 'Propagate',
    icon: <Share2 className="w-4 h-4" />,
    status: 'pending' as const,
  },
  {
    id: 'report',
    label: 'Report',
    icon: <FileBarChart2 className="w-4 h-4" />,
    status: 'pending' as const,
  },
]

export function PipelineSection() {
  return (
    <section aria-labelledby="pipeline-section-title">
      <Card className="px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#2DD4BF' }} />
            <h2 id="pipeline-section-title" className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
              Pipeline Status
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#6366F1' }} />
            <span className="text-xs font-medium" style={{ color: '#6366F1' }}>Detection in progress</span>
          </div>
        </div>
        <ProgressStepper steps={steps} />
      </Card>
    </section>
  )
}
