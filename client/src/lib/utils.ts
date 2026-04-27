import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { RiskLevel } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
  if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K`
  return views.toString()
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function getRiskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'high': return '#EF4444'
    case 'medium': return '#F59E0B'
    case 'low': return '#10B981'
    default: return '#10B981'
  }
}

export function getRiskBg(risk: RiskLevel): string {
  switch (risk) {
    case 'high': return 'rgba(239, 68, 68, 0.12)'
    case 'medium': return 'rgba(245, 158, 11, 0.12)'
    case 'low': return 'rgba(16, 185, 129, 0.12)'
    default: return 'rgba(16, 185, 129, 0.12)'
  }
}

export function getSimilarityPercent(similarity: number): string {
  return `${(similarity * 100).toFixed(1)}%`
}
