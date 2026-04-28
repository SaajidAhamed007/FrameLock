import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopNav } from './components/TopNav'
import { HeroSection } from './sections/HeroSection'
import { PipelineSection } from './sections/PipelineSection'
import { MainGridSection } from './sections/MainGridSection'
import { DetectionsSection } from './sections/DetectionsSection'
import { PropagationSection } from './sections/PropagationSection'
import { ReportsSection } from './sections/ReportsSection'
import { PreUploadSection } from './sections/PreUploadSection'
import { NewScanSection } from './sections/NewScanSection'
import { AssetsSection } from './sections/AssetsSection'
import type { Asset } from './sections/AssetsSection'
import { useJobStatus, useJobResults } from './hooks/useApi'
import type { Detection } from './types'
import { LoadingScreen } from './components/LoadingScreen'
import { InsightModal } from './components/InsightModal'
import type { RadarNodeType } from './components/IntelligenceRadar'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [showLoading, setShowLoading] = useState(true)
  const [radarModalType, setRadarModalType] = useState<RadarNodeType | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [reportIds, setReportIds] = useState<Set<string>>(new Set())

  const { status, progress } = useJobStatus(jobId)
  const { results } = useJobResults(jobId, status)

  const handleSelectDetection = (d: Detection) => {
    setSelectedDetection((prev) => (prev?.id === d.id ? null : d))
  }

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Scan Overview'
      case 'scan': return 'New Scan'
      case 'precheck': return 'Pre-upload Check'
      case 'detections': return 'Detections'
      case 'propagation': return 'Propagation Graph'
      case 'reports': return 'Intelligence Reports'
      case 'assets': return 'Monitored Assets'
      default: return 'VisionGuard'
    }
  }

  const renderContent = () => {
    if (activePage === 'assets') {
      return (
        <main className="flex-1 px-8 pb-12 animate-fade-in" style={{ paddingTop: 88, height: '100vh' }}>
          <AssetsSection 
            assets={assets}
            onAddAsset={(asset) => setAssets([...assets, asset])}
            onRemoveAsset={(id) => setAssets(assets.filter(a => a.id !== id))}
            onUpdateAsset={(updatedAsset) => setAssets(assets.map(a => a.id === updatedAsset.id ? updatedAsset : a))}
            onSetAssets={(nextAssets) => setAssets(nextAssets)}
          />
        </main>
      )
    }

    if (activePage === 'precheck') {
      return (
        <main className="flex-1 px-8 pb-12 animate-fade-in" style={{ paddingTop: 88, height: '100vh' }}>
          <PreUploadSection />
        </main>
      )
    }

    if (!jobId || activePage === 'scan') {
      return (
        <main className="flex-1 px-8 pb-12 animate-fade-in" style={{ paddingTop: 88, height: '100vh' }}>
          <NewScanSection onJobStarted={(id) => {
            setJobId(id)
            setActivePage('dashboard')
          }} />
        </main>
      )
    }

    if (status !== 'completed' || !results) {
      return (
        <main className="flex-1 px-8 pb-12 animate-fade-in" style={{ paddingTop: 88, height: '100vh' }}>
          <PipelineSection status={status} progress={progress} />
        </main>
      )
    }

    // Finished Job Routing
    return (
      <main className="flex-1 px-8 pb-8 flex flex-col animate-fade-in h-screen" style={{ paddingTop: 88 }}>
        {activePage === 'dashboard' && (
          <div className="space-y-8 overflow-y-auto pb-8 pr-2">
            <HeroSection
              video={results.input_video}
              fingerprint={results.fingerprint}
              riskSummary={results.risk_summary}
            />
            <MainGridSection
              detections={results.detections}
              propagationNodes={results.propagation_nodes}
              metrics={results.metrics}
              riskSummary={results.risk_summary}
              selectedDetection={selectedDetection}
              onSelectDetection={handleSelectDetection}
              onRadarNodeClick={setRadarModalType}
            />
          </div>
        )}

        {activePage === 'detections' && (
          <DetectionsSection 
            detections={results.detections}
            selectedDetection={selectedDetection}
            onSelectDetection={handleSelectDetection}
            onNavigateToReports={(ids) => {
              setReportIds(ids)
              setActivePage('reports')
            }}
          />
        )}

        {activePage === 'propagation' && (
          <PropagationSection
            nodes={results.propagation_nodes}
            detections={results.detections}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => setSelectedNodeId(prev => prev === id ? null : id)}
            onRadarNodeClick={setRadarModalType}
          />
        )}

        {activePage === 'reports' && (
          <ReportsSection
            jobId={jobId!}
            detections={reportIds.size > 0 ? results.detections.filter(d => reportIds.has(d.id)) : results.detections}
            metrics={results.metrics}
            riskSummary={results.risk_summary}
          />
        )}
      </main>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#09090B' }}>
      {showLoading && <LoadingScreen onComplete={() => setShowLoading(false)} />}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0" style={{ marginLeft: 240 }}>
        <TopNav title={getPageTitle()} />
        {renderContent()}
      </div>
      <InsightModal
        isOpen={!!radarModalType}
        type={radarModalType}
        onClose={() => setRadarModalType(null)}
        detections={results?.detections}
        propagationNodes={results?.propagation_nodes}
        riskSummary={results?.risk_summary}
      />
    </div>
  )
}
