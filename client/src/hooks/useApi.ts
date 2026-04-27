import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8000'

export function useAnalyze() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startAnalysis = async (url: string, frames: number = 3, threshold: number = 0.85) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, frames, threshold })
      })
      if (!res.ok) throw new Error('Failed to start analysis')
      const data = await res.json()
      return data.job_id
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  return { startAnalysis, isSubmitting, error }
}

export function useJobStatus(jobId: string | null) {
  const [status, setStatus] = useState<string>('pending')
  const [progress, setProgress] = useState<any>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) return

    let interval: ReturnType<typeof setInterval>

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/analyze/${jobId}`)
        if (!res.ok) throw new Error('Failed to fetch status')
        const data = await res.json()
        
        setStatus(data.status)
        setProgress(data.progress || {})

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval)
        }
      } catch (err: any) {
        setError(err.message)
        clearInterval(interval)
      }
    }

    poll() // Initial fetch
    interval = setInterval(poll, 2500)

    return () => clearInterval(interval)
  }, [jobId])

  return { status, progress, error }
}

export function useJobResults(jobId: string | null, status: string) {
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId || status !== 'completed') return

    const fetchResults = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/results/${jobId}`)
        if (!res.ok) throw new Error('Failed to fetch results')
        const data = await res.json()
        setResults(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [jobId, status])

  return { results, isLoading, error }
}
