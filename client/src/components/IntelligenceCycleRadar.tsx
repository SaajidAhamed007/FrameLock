import { Upload, Brain, Search, Share2, FileBarChart2 } from 'lucide-react'
import RadialOrbitalTimeline from './ui/radial-orbital-timeline'

interface IntelligenceCycleRadarProps {
  status: string
  progress: any
}

function getStepState(stepIndex: number, status: string, stage: string) {
  if (status === 'completed') return 'completed'
  if (status === 'failed') return stepIndex === 0 ? 'pending' : 'pending' // Simplified

  const stageOrder: Record<string, number> = {
    queued: 0, extracting: 1, searching: 2, detecting: 2, done: 4,
  }
  const currentIdx = stageOrder[stage] ?? 0

  if (stepIndex < currentIdx) return 'completed'
  if (stepIndex === currentIdx) return 'in-progress'
  return 'pending'
}

export function IntelligenceCycleRadar({ status, progress }: IntelligenceCycleRadarProps) {
  const stage = progress?.stage || 'queued'
  const percent = progress?.percent || 0

  // Upload, Analyze, Detect, Propagate, Report
  const timelineData: any[] = [
    {
      id: 1,
      title: "Upload",
      date: "Step 1",
      content: `<div class="space-y-2">
        <p><strong>Status:</strong> ${getStepState(0, status, stage) === 'completed' ? 'File Processed' : 'Uploading...'}</p>
        <p><strong>File processed:</strong> ${progress?.details || 'video.mp4'}</p>
      </div>`,
      category: "Upload",
      icon: Upload,
      relatedIds: [2],
      status: getStepState(0, status, stage),
      energy: getStepState(0, status, stage) === 'completed' ? 100 : percent,
    },
    {
      id: 2,
      title: "Analyze",
      date: "Step 2",
      content: `<div class="space-y-2">
        <p><strong>Frames extracted:</strong> ${stage === 'extracting' ? percent * 10 : 1000}</p>
        <p><strong>Model used:</strong> VisionGuard-ViT-L</p>
      </div>`,
      category: "Analyze",
      icon: Brain,
      relatedIds: [1, 3],
      status: getStepState(1, status, stage),
      energy: getStepState(1, status, stage) === 'completed' ? 100 : getStepState(1, status, stage) === 'in-progress' ? percent : 0,
    },
    {
      id: 3,
      title: "Detect",
      date: "Step 3",
      content: `<div class="space-y-2">
        <p><strong>Matches found:</strong> ${stage === 'searching' || stage === 'detecting' ? 'Analyzing...' : '24'}</p>
        <p><strong>High risk count:</strong> ${status === 'completed' ? '3' : '...'}</p>
      </div>`,
      category: "Detect",
      icon: Search,
      relatedIds: [2, 4],
      status: getStepState(2, status, stage),
      energy: getStepState(2, status, stage) === 'completed' ? 100 : getStepState(2, status, stage) === 'in-progress' ? percent : 0,
    },
    {
      id: 4,
      title: "Propagate",
      date: "Step 4",
      content: `<div class="space-y-2">
        <p><strong>Clusters:</strong> 1</p>
        <p><strong>Total reach:</strong> ${status === 'completed' ? '1.2M' : '...'}</p>
      </div>`,
      category: "Propagate",
      icon: Share2,
      relatedIds: [3, 5],
      status: getStepState(3, status, stage),
      energy: getStepState(3, status, stage) === 'completed' ? 100 : getStepState(3, status, stage) === 'in-progress' ? percent : 0,
    },
    {
      id: 5,
      title: "Report",
      date: "Step 5",
      content: `<div class="space-y-2">
        <p><strong>Report status:</strong> ${status === 'completed' ? 'Generated' : 'Pending'}</p>
        <p><strong>Confidence score:</strong> 98.5%</p>
      </div>`,
      category: "Report",
      icon: FileBarChart2,
      relatedIds: [4],
      status: getStepState(4, status, stage),
      energy: getStepState(4, status, stage) === 'completed' ? 100 : getStepState(4, status, stage) === 'in-progress' ? percent : 0,
    },
  ]

  const isRunning = status !== 'completed' && status !== 'failed'

  return (
    <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center relative">
      <RadialOrbitalTimeline
        timelineData={timelineData}
        centerTitle="Active Analysis"
        isPulsing={isRunning}
      />
    </div>
  )
}
