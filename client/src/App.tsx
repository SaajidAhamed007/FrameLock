import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopNav } from './components/TopNav'
import { HeroSection } from './sections/HeroSection'
import { PipelineSection } from './sections/PipelineSection'
import { MainGridSection } from './sections/MainGridSection'
import { ExplainabilityPanel } from './sections/ExplainabilityPanel'
import { PreUploadSection } from './sections/PreUploadSection'
import {
  mockOriginalVideo,
  mockFingerprint,
  mockRiskSummary,
  mockDetections,
  mockPropagationNodes,
  mockMetrics,
  mockExplainability,
} from './data'
import type { Detection } from './types'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null)

  const handleSelectDetection = (d: Detection) => {
    setSelectedDetection((prev) => (prev?.id === d.id ? null : d))
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#09090B' }}
    >
      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Main content area */}
      <div
        className="flex flex-col min-h-screen"
        style={{ marginLeft: 240 }}
      >
        {/* Top nav */}
        <TopNav title="Scan Overview" />

        {/* Page content */}
        <main
          className="flex-1 px-8 pb-12 space-y-8 animate-fade-in"
          style={{ paddingTop: 88 }}  /* 64px header + 24px gap */
        >
          {/* Section 1: Hero — Original Video / Fingerprint / Risk Summary */}
          <HeroSection
            video={mockOriginalVideo}
            fingerprint={mockFingerprint}
            riskSummary={mockRiskSummary}
          />

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />

          {/* Section 2: Pipeline Progress */}
          <PipelineSection />

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />

          {/* Section 3: Main 3-column grid */}
          <MainGridSection
            detections={mockDetections}
            propagationNodes={mockPropagationNodes}
            metrics={mockMetrics}
            riskSummary={mockRiskSummary}
            selectedDetection={selectedDetection}
            onSelectDetection={handleSelectDetection}
          />

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />

          {/* Section 4: AI Explainability */}
          <ExplainabilityPanel
            detection={selectedDetection}
            data={mockExplainability}
          />

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />

          {/* Section 5: Pre-upload Check */}
          <PreUploadSection />
        </main>
      </div>
    </div>
  )
}
