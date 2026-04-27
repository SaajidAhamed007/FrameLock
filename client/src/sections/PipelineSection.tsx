import { Card } from '../components/Card'
import { ProgressStepper } from '../components/ProgressStepper'
import { Upload, Brain, Search, Share2, FileBarChart2 } from 'lucide-react'

export function PipelineSection({ status, progress }: { status: string, progress: any }) {
  const getStepStatus = (stepIndex: number) => {
    if (status === 'completed') return 'completed'
    if (status === 'failed') return 'pending' // Should handle error state, keeping simple

    // Map backend stages to stepper steps
    const stageMap: Record<string, number> = {
      'queued': 0,
      'extracting': 1,
      'searching': 2,
      'detecting': 2,
      'done': 4
    }
    
    const currentIdx = stageMap[progress?.stage] || 0
    
    if (stepIndex < currentIdx) return 'completed'
    if (stepIndex === currentIdx) return 'active'
    return 'pending'
  }

  const steps = [
    { id: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" />, status: getStepStatus(0) },
    { id: 'analyze', label: 'Analyze', icon: <Brain className="w-4 h-4" />, status: getStepStatus(1) },
    { id: 'detect', label: 'Detect', icon: <Search className="w-4 h-4" />, status: getStepStatus(2) },
    { id: 'propagate', label: 'Propagate', icon: <Share2 className="w-4 h-4" />, status: getStepStatus(3) },
    { id: 'report', label: 'Report', icon: <FileBarChart2 className="w-4 h-4" />, status: getStepStatus(4) },
  ] as any

  return (
    <section aria-labelledby="pipeline-section-title">
      <Card className="px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#2DD4BF' }} />
            <h2 id="pipeline-section-title" className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
              Pipeline Status: {status}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {status !== 'completed' && status !== 'failed' && (
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#6366F1' }} />
            )}
            <span className="text-xs font-medium" style={{ color: '#6366F1' }}>
              {progress?.details || (status === 'completed' ? 'Complete' : 'Pending')}
            </span>
          </div>
        </div>
        <ProgressStepper steps={steps} />
      </Card>
    </section>
  )
}
