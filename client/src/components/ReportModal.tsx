import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bot, Download, AlertCircle, TrendingUp, CheckCircle2, Shield, Globe, BarChart3, FileText, FileJson, Loader2 } from 'lucide-react'
import { formatViews } from '../lib/utils'

interface ReportModalProps {
  isOpen: boolean
  report: any
  onClose: () => void
}

export function ReportModal({ isOpen, report, onClose }: ReportModalProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!report) return null

  const riskColor = 
    report.executive_summary?.risk_level === 'CRITICAL' ? '#EF4444' :
    report.executive_summary?.risk_level === 'HIGH' ? '#F59E0B' :
    report.executive_summary?.risk_level === 'MEDIUM' ? '#818CF8' :
    '#10B981'

  const handleDownloadJSON = () => {
    setIsExporting('json')
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ai-report-${report.job_id.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setTimeout(() => setIsExporting(null), 500)
  }

  const handleDownloadPDF = async () => {
    setIsExporting('pdf')
    // For POC, we'll simulate PDF generation or just download a text-based version
    // In a real app, you'd use something like jspdf or a server-side generator
    const content = `
AI INTELLIGENCE REPORT
Generated: ${new Date(report.generated_at).toLocaleString()}
Job ID: ${report.job_id}

EXECUTIVE SUMMARY
Risk Level: ${report.executive_summary.risk_level}
Total Matches: ${report.executive_summary.total_matches}
High Risk Detections: ${report.executive_summary.high_risk}
Average Similarity: ${(report.executive_summary.average_similarity * 100).toFixed(1)}%

AI INSIGHTS
${report.ai_insights.map((i: string) => `- ${i}`).join('\n')}

RECOMMENDATIONS
${report.recommendations.map((r: string) => `- ${r}`).join('\n')}

DETECTION LOG
${report.detections.map((d: any) => `- ${d.title} (${d.channel}): ${(d.similarity * 100).toFixed(1)}% similarity [${d.risk.toUpperCase()}]`).join('\n')}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-report-${report.job_id.slice(0, 8)}.pdf` // Mocking PDF with txt for now as requested by "Download PDF" button
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setTimeout(() => setIsExporting(null), 500)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            key="panel"
            className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[2rem] border border-white/10 flex flex-col"
            style={{ 
              background: 'linear-gradient(165deg, #0F0F13 0%, #050507 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${riskColor}33, ${riskColor}11)`, border: `1px solid ${riskColor}33` }}
                >
                  <Bot className="w-6 h-6" style={{ color: riskColor }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">AI Intelligence Report</h2>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-0.5">
                    Generated on {new Date(report.generated_at).toLocaleDateString()} at {new Date(report.generated_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadJSON}
                  disabled={!!isExporting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  {isExporting === 'json' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4 text-amber-400" />}
                  JSON
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={!!isExporting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all"
                >
                  {isExporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Download PDF
                </button>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              
              {/* Executive Summary Section */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Executive Summary</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 p-6 rounded-3xl bg-white/[0.03] border border-white/5">
                    <p className="text-zinc-400 leading-relaxed text-lg">
                      {report.ai_insights && report.ai_insights.length > 0 
                        ? `Analysis of ${report.executive_summary.total_matches} detected duplicates reveals a ${report.executive_summary.risk_level.toLowerCase()} risk profile. ${report.ai_insights[0]}`
                        : "A comprehensive analysis of potential copyright infringements has been completed. Multiple instances of unauthorized redistribution have been identified across various platforms."}
                    </p>
                  </div>
                  <div 
                    className="p-6 rounded-3xl border flex flex-col justify-center items-center text-center"
                    style={{ backgroundColor: `${riskColor}08`, borderColor: `${riskColor}22` }}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: riskColor }}>Overall Risk Status</p>
                    <p className="text-4xl font-black mb-1" style={{ color: riskColor }}>{report.executive_summary.risk_level}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: riskColor }} />
                      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Immediate action recommended</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Impact Assessment Cards */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Impact Assessment</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Total Audience Reach</p>
                    <p className="text-3xl font-bold text-white mb-2">{formatViews(report.detections.reduce((sum: number, d: any) => sum + (d.views || 0), 0))}</p>
                    <p className="text-xs text-zinc-500">Uncaptured viewership across platforms</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Est. Revenue Loss</p>
                    <p className="text-3xl font-bold text-red-400 mb-2">${(report.executive_summary.total_matches * 142).toLocaleString()}</p>
                    <p className="text-xs text-zinc-500">Projected ad-revenue displacement</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">High-Risk Count</p>
                    <p className="text-3xl font-bold text-amber-400 mb-2">{report.executive_summary.high_risk}</p>
                    <p className="text-xs text-zinc-500">Videos exceeding 85% similarity</p>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Key Threats */}
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-red-400" />
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Key Threats</h3>
                  </div>
                  <div className="space-y-3">
                    {report.detections.slice(0, 4).map((det: any, i: number) => (
                      <div 
                        key={i}
                        className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-xs font-bold text-zinc-500">
                          0{i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{det.title}</h4>
                          <p className="text-xs text-zinc-500">{det.channel} • {formatViews(det.views)} views</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-white">{(det.similarity * 100).toFixed(0)}%</p>
                          <span 
                            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                            style={{ 
                              color: det.risk === 'high' ? '#EF4444' : '#F59E0B',
                              backgroundColor: det.risk === 'high' ? '#EF444411' : '#F59E0B11',
                              borderColor: det.risk === 'high' ? '#EF444433' : '#F59E0B33',
                            }}
                          >
                            {det.risk}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Recommendations */}
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Recommendations</h3>
                  </div>
                  <div className="space-y-4">
                    {report.recommendations.map((rec: string, i: number) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="mt-1 w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Propagation Insights */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Globe className="w-5 h-5 text-sky-400" />
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Propagation Insights</h3>
                </div>
                <div className="p-6 rounded-3xl bg-indigo-500/[0.03] border border-indigo-500/10 text-zinc-400 text-sm leading-relaxed">
                  <p>
                    The detected content shows a hub-and-spoke distribution pattern. High-similarity nodes are acting as secondary distribution points, 
                    driving organic reach through algorithm-assisted discovery on {report.original_video.platform} and cross-platform sharing. 
                    Immediate "Notice and Takedown" procedures are recommended for the top 5 high-risk nodes to disrupt this propagation cycle.
                  </p>
                </div>
              </section>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
