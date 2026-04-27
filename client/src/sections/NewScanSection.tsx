import { useState } from 'react'
import { Card } from '../components/Card'
import { useAnalyze } from '../hooks/useApi'

export function NewScanSection({ onJobStarted }: { onJobStarted: (id: string) => void }) {
  const { startAnalysis, isSubmitting, error } = useAnalyze()
  const [url, setUrl] = useState('')
  const [frames, setFrames] = useState(3)
  const [threshold, setThreshold] = useState(0.85)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    const jobId = await startAnalysis(url, frames, threshold)
    if (jobId) {
      onJobStarted(jobId)
    }
  }

  return (
    <section aria-labelledby="new-scan-title" className="max-w-2xl mx-auto mt-12">
      <Card className="p-8">
        <h2 id="new-scan-title" className="text-xl font-semibold mb-2" style={{ color: '#E4E4E7' }}>
          New Similarity Scan
        </h2>
        <p className="text-sm mb-6" style={{ color: '#A1A1AA' }}>
          Enter a YouTube URL to automatically extract frames, build a fingerprint, and detect copyright infringement across the platform.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#52525B' }}>
              Target Video URL
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#E4E4E7',
                outline: 'none',
              }}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#52525B' }}>
                Frames to Extract: {frames}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={frames}
                onChange={(e) => setFrames(parseInt(e.target.value))}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#52525B' }}>
                Threshold: {(threshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !url}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              backgroundColor: isSubmitting ? '#52525B' : '#6366F1',
              color: 'white',
              opacity: (isSubmitting || !url) ? 0.5 : 1,
            }}
          >
            {isSubmitting ? 'Initializing Job...' : 'Start Scan'}
          </button>
        </form>
      </Card>
    </section>
  )
}
