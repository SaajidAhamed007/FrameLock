import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopNav } from './components/TopNav'
import { HeroSection } from './sections/HeroSection'
import { PipelineSection } from './sections/PipelineSection'
import { MainGridSection } from './sections/MainGridSection'
import { ExplainabilityPanel } from './sections/ExplainabilityPanel'
import { PreUploadSection } from './sections/PreUploadSection'
import { NewScanSection } from './sections/NewScanSection'
import { useJobStatus, useJobResults } from './hooks/useApi'
import { mockExplainability } from './data' // Use mock explainability for now
import type { Detection } from './types'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)

  const { status, progress } = useJobStatus(jobId)
  const { results } = useJobResults(jobId, status)

  const handleSelectDetection = (d: Detection) => {
    setSelectedDetection((prev) => (prev?.id === d.id ? null : d))
  }

  const renderContent = () => {
    if (activePage === 'precheck') {
      return (
        <main className="flex-1 px-8 pb-12 space-y-8 animate-fade-in" style={{ paddingTop: 88 }}>
          <PreUploadSection />
        </main>
      )
    }

    if (!jobId) {
      return (
        <main className="flex-1 px-8 pb-12 animate-fade-in" style={{ paddingTop: 88 }}>
          <NewScanSection onJobStarted={setJobId} />
        </main>
      )
    }

    // Dashboard view while job is running or completed
    return (
      <main className="flex-1 px-8 pb-12 space-y-8 animate-fade-in" style={{ paddingTop: 88 }}>
        <PipelineSection status={status} progress={progress} />
        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />

        {status === 'completed' && results && (
          <>
            <HeroSection
              video={results.input_video}
              fingerprint={results.fingerprint}
              riskSummary={results.risk_summary}
            />
            <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />

            <MainGridSection
              detections={results.detections}
              propagationNodes={results.propagation_nodes}
              metrics={results.metrics}
              riskSummary={results.risk_summary}
              selectedDetection={selectedDetection}
              onSelectDetection={handleSelectDetection}
            />
            <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />

            <ExplainabilityPanel
              detection={selectedDetection}
              data={mockExplainability}
            />
          </>
        )}
      </main>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#09090B' }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="flex flex-col min-h-screen" style={{ marginLeft: 240 }}>
        <TopNav title={activePage === 'dashboard' ? 'Scan Overview' : 'Pre-upload Check'} />
        {renderContent()}
      </div>
    </div>
  )
}
