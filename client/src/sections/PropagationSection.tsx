import { useState } from 'react'
import { Card } from '../components/Card'
import { PropagationGraph } from '../components/PropagationGraph'
import type { PropagationNode, Detection } from '../types'
import { getRiskColor, formatViews } from '../lib/utils'
import { Calendar, Filter, Share2, Activity, Users, AlertTriangle } from 'lucide-react'

interface PropagationSectionProps {
  nodes: PropagationNode[]
  detections: Detection[]
  selectedNodeId: string | null
  onSelectNode: (id: string) => void
}

export function PropagationSection({ nodes, detections, selectedNodeId, onSelectNode }: PropagationSectionProps) {
  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  const selectedDetection = detections.find(d => d.id === selectedNodeId)

  const totalReach = nodes.reduce((sum, n) => sum + n.views, 0)
  const highRiskNodes = nodes.filter(n => n.risk === 'high').length

  return (
    <section className="h-full flex flex-col space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1F1F23] border border-white/10 rounded-lg text-sm text-[#E4E4E7] hover:bg-white/5 transition-colors">
            <Calendar className="w-4 h-4 text-[#A1A1AA]" />
            Last 7 Days
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1F1F23] border border-white/10 rounded-lg text-sm text-[#E4E4E7] hover:bg-white/5 transition-colors">
            <Filter className="w-4 h-4 text-[#A1A1AA]" />
            All Platforms
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* CENTER: Propagation Map */}
        <div className="col-span-8 flex flex-col bg-[#1F1F23] rounded-xl border border-white/5 overflow-hidden relative">
          <div className="p-4 border-b border-white/5 flex items-center justify-between absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-[#1F1F23] to-transparent">
            <h3 className="text-sm font-semibold text-[#E4E4E7] flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#6366F1]" />
              Network Graph
            </h3>
          </div>
          
          <div className="flex-1 w-full h-full flex items-center justify-center p-8 mt-12">
            <PropagationGraph
              nodes={nodes}
              selectedId={selectedNodeId || undefined}
              onSelectNode={onSelectNode}
            />
          </div>

          {/* Bottom Summary Stats Overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4">
            <Card className="flex-1 p-4 bg-[#09090B]/80 backdrop-blur-md border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#6366F1]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#6366F1]" />
              </div>
              <div>
                <p className="text-xs text-[#A1A1AA] uppercase tracking-wider">Total Reach</p>
                <p className="text-lg font-bold text-[#E4E4E7]">{formatViews(totalReach)}</p>
              </div>
            </Card>
            <Card className="flex-1 p-4 bg-[#09090B]/80 backdrop-blur-md border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#2DD4BF]/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#2DD4BF]" />
              </div>
              <div>
                <p className="text-xs text-[#A1A1AA] uppercase tracking-wider">Total Nodes</p>
                <p className="text-lg font-bold text-[#E4E4E7]">{nodes.length}</p>
              </div>
            </Card>
            <Card className="flex-1 p-4 bg-[#09090B]/80 backdrop-blur-md border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#EF4444]/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div>
                <p className="text-xs text-[#A1A1AA] uppercase tracking-wider">High Risk</p>
                <p className="text-lg font-bold text-[#E4E4E7]">{highRiskNodes}</p>
              </div>
            </Card>
          </div>
        </div>

        {/* RIGHT: Side Panel */}
        <div className="col-span-4">
          <Card className="h-full bg-[#1F1F23] border border-white/5 p-6 flex flex-col gap-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#52525B]">Node Details</h3>
            
            {selectedNode ? (
              <div className="flex flex-col gap-6">
                <div className="space-y-4">
                  {selectedDetection && (
                    <div className="aspect-video bg-[#09090B] rounded-lg border border-white/10 overflow-hidden">
                      <img src={selectedDetection.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div>
                    <h2 className="text-lg font-bold text-[#E4E4E7] leading-tight">{selectedNode.title}</h2>
                    <p className="text-sm text-[#A1A1AA] mt-1">
                      {selectedDetection ? selectedDetection.channel : 'Original Source'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#09090B] p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-[#A1A1AA] uppercase tracking-wider mb-1">Risk Level</p>
                    <p className="text-sm font-bold" style={{ color: getRiskColor(selectedNode.risk) }}>
                      {selectedNode.risk.toUpperCase()}
                    </p>
                  </div>
                  <div className="bg-[#09090B] p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-[#A1A1AA] uppercase tracking-wider mb-1">Impact</p>
                    <p className="text-sm font-bold text-[#E4E4E7]">{formatViews(selectedNode.views)}</p>
                  </div>
                  {selectedNode.id !== 'original' && (
                    <div className="col-span-2 bg-[#09090B] p-3 rounded-lg border border-white/5">
                      <p className="text-xs text-[#A1A1AA] uppercase tracking-wider mb-1">Similarity Match</p>
                      <p className="text-sm font-bold text-[#6366F1]">{(selectedNode.similarity * 100).toFixed(1)}%</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-auto pt-4 border-t border-white/5">
                  <button className="w-full py-3 px-4 rounded-xl font-medium text-sm transition-colors border border-white/10 hover:bg-white/5 text-[#E4E4E7]">
                    View Full Trace
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="space-y-3">
                  <Share2 className="w-8 h-8 text-[#52525B] mx-auto" />
                  <p className="text-sm text-[#A1A1AA]">Select a node on the graph<br/>to view its details</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  )
}
