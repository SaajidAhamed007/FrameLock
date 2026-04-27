import { useState } from 'react'
import { Card } from '../components/Card'
import { DetectionItem } from '../components/DetectionItem'
import type { Detection } from '../types'
import { Filter, ArrowUpDown, ShieldAlert, CheckCircle2, Flag } from 'lucide-react'
import { getRiskColor, formatViews } from '../lib/utils'
import { mockExplainability } from '../data'

interface DetectionsSectionProps {
  detections: Detection[]
  selectedDetection: Detection | null
  onSelectDetection: (d: Detection) => void
}

export function DetectionsSection({ detections, selectedDetection, onSelectDetection }: DetectionsSectionProps) {
  const [filterRisk, setFilterRisk] = useState<string | null>(null)

  const filteredDetections = filterRisk 
    ? detections.filter(d => d.risk === filterRisk) 
    : detections

  return (
    <section className="h-full flex flex-col space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search detections..." 
              className="w-64 bg-[#1F1F23] border border-white/10 rounded-lg px-4 py-2 text-sm text-[#E4E4E7] focus:outline-none focus:border-[#6366F1]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#A1A1AA]" />
            {['high', 'medium', 'low'].map(risk => (
              <button
                key={risk}
                onClick={() => setFilterRisk(filterRisk === risk ? null : risk)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                  filterRisk === risk 
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-transparent border-white/5 text-[#A1A1AA] hover:bg-white/5'
                }`}
              >
                {risk.charAt(0).toUpperCase() + risk.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button className="flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white transition-colors">
          <ArrowUpDown className="w-4 h-4" />
          Sort by Risk
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* LEFT: Detection List */}
        <div className="col-span-5 flex flex-col bg-[#1F1F23] rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#E4E4E7]">Detected Matches</h3>
            <span className="text-xs text-[#A1A1AA]">{filteredDetections.length} Results</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[700px]">
            {filteredDetections.map((d, i) => (
              <DetectionItem
                key={d.id}
                detection={d}
                rank={i + 1}
                isSelected={selectedDetection?.id === d.id}
                onSelect={onSelectDetection}
              />
            ))}
            {filteredDetections.length === 0 && (
              <div className="p-8 text-center text-[#A1A1AA] text-sm">
                No detections found matching the filters.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Detail Panel */}
        <div className="col-span-7">
          {selectedDetection ? (
            <div className="flex flex-col gap-6 h-full">
              <Card className="p-6 flex-1 border border-white/10 shadow-xl bg-[#1F1F23]">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#E4E4E7] mb-2">{selectedDetection.title}</h2>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-[#A1A1AA]">Channel: <strong className="text-[#E4E4E7]">{selectedDetection.channel}</strong></span>
                      <span className="text-sm text-[#A1A1AA]">Views: <strong className="text-[#E4E4E7]">{formatViews(selectedDetection.views)}</strong></span>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg font-bold text-sm border" style={{
                    color: getRiskColor(selectedDetection.risk),
                    backgroundColor: `${getRiskColor(selectedDetection.risk)}15`,
                    borderColor: `${getRiskColor(selectedDetection.risk)}30`
                  }}>
                    {(selectedDetection.similarity * 100).toFixed(1)}% Match
                  </div>
                </div>

                {/* Visual Comparison */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-[#E4E4E7] mb-4">Visual Comparison</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-[#A1A1AA] uppercase tracking-wider">Original Source</p>
                      <div className="aspect-video bg-[#09090B] rounded-lg border border-white/10 flex items-center justify-center">
                         <span className="text-xs text-[#52525B]">Frame unavailable</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-[#A1A1AA] uppercase tracking-wider">Detected Match</p>
                      <div className="aspect-video bg-[#09090B] rounded-lg border border-white/10 overflow-hidden">
                        <img src={selectedDetection.thumbnailUrl} alt="Match thumbnail" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Reasoning */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-[#E4E4E7] mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#6366F1]" />
                    AI Match Reasoning
                  </h3>
                  <ul className="space-y-3">
                    {mockExplainability[selectedDetection.id]?.highlights.map((highlight: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 bg-[#09090B] p-3 rounded-lg border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full mt-2" style={{ backgroundColor: getRiskColor(selectedDetection.risk) }} />
                        <span className="text-sm text-[#A1A1AA]">{highlight}</span>
                      </li>
                    )) || (
                      <li className="text-sm text-[#A1A1AA]">No reasoning data available for this match.</li>
                    )}
                  </ul>
                </div>
              </Card>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button className="flex-1 flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-lg shadow-[#10B981]/20">
                  <CheckCircle2 className="w-5 h-5" />
                  Mark as Reviewed
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 bg-[#EF4444] hover:bg-[#DC2626] text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-lg shadow-[#EF4444]/20">
                  <Flag className="w-5 h-5" />
                  Flag for Takedown
                </button>
              </div>
            </div>
          ) : (
            <div className="h-[700px] flex items-center justify-center bg-[#1F1F23] rounded-xl border border-white/5 border-dashed">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-[#09090B] rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                  <ShieldAlert className="w-8 h-8 text-[#52525B]" />
                </div>
                <div>
                  <p className="text-[#E4E4E7] font-medium">No Detection Selected</p>
                  <p className="text-sm text-[#A1A1AA] mt-1">Select an item from the list to view details</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
