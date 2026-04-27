// Types for the VisionGuard AI dashboard

export type RiskLevel = 'high' | 'medium' | 'low'

export type PipelineStatus = 'completed' | 'active' | 'pending'

export interface Detection {
  id: string
  title: string
  channel: string
  thumbnailUrl: string
  views: number
  similarity: number
  risk: RiskLevel
  platform: 'youtube' | 'instagram' | 'twitter'
  uploadedAt: string
  duration: string
  url: string
}

export interface OriginalVideo {
  title: string
  thumbnailUrl: string
  duration: string
  resolution: string
  uploadedAt: string
  platform: string
  channel?: string
}

export interface FingerprintInfo {
  id: string
  framesAnalyzed: number
  model: string
  createdAt: string
}

export interface RiskSummary {
  high: number
  medium: number
  low: number
}

export interface PropagationNode {
  id: string
  title: string
  views: number
  risk: RiskLevel
  similarity: number
  x: number
  y: number
  connections: string[]
}

export interface MetricCard {
  label: string
  value: string
  change: string
  positive: boolean
}

export interface ExplainabilityData {
  whyFlagged: string[]
  visualSimilarity: number
  metadataSimilarity: number
  audioSimilarity: number
  confidence: number
}
