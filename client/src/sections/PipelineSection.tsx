import { IntelligenceCycleRadar } from '../components/IntelligenceCycleRadar'

export function PipelineSection({ status, progress }: { status: string; progress: any }) {
  return (
    <section className="h-full flex flex-col justify-center">
      <IntelligenceCycleRadar status={status} progress={progress} />
    </section>
  )
}
