import { Check, Loader2 } from 'lucide-react'
import type { PipelineStatus } from '../types'

interface Step {
  id: string
  label: string
  icon: React.ReactNode
  status: PipelineStatus
}

interface ProgressStepperProps {
  steps: Step[]
}

export function ProgressStepper({ steps }: ProgressStepperProps) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const isCompleted = step.status === 'completed'
        const isActive = step.status === 'active'

        const accentColor = '#6366F1'
        const successColor = '#10B981'

        const dotColor = isCompleted ? successColor : isActive ? accentColor : 'rgba(255,255,255,0.1)'
        const textColor = isCompleted ? '#E4E4E7' : isActive ? '#E4E4E7' : '#52525B'
        const lineColor = isCompleted ? successColor : 'rgba(255,255,255,0.08)'

        return (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step node */}
            <div className="flex flex-col items-center gap-2 relative">
              {/* Active pulse ring */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{
                    backgroundColor: accentColor,
                    opacity: 0.2,
                    width: 32,
                    height: 32,
                    margin: 'auto',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                  }}
                />
              )}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10"
                style={{
                  backgroundColor: dotColor,
                  border: isActive ? `2px solid ${accentColor}` : '2px solid transparent',
                  boxShadow: isActive ? `0 0 12px ${accentColor}40` : isCompleted ? `0 0 8px ${successColor}30` : 'none',
                }}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                )}
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs font-semibold" style={{ color: textColor }}>{step.label}</span>
                <span
                  className="text-[10px] uppercase tracking-wider"
                  style={{
                    color: isCompleted ? '#10B981' : isActive ? '#6366F1' : '#3F3F46'
                  }}
                >
                  {step.status}
                </span>
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className="flex-1 h-0.5 mx-3 rounded-full transition-all duration-500"
                style={{ backgroundColor: lineColor }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
