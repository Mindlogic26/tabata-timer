import { WORKOUT_TEMPLATES } from '../templates.ts'
import type { Workout } from '../types.ts'

interface TemplateListProps {
  onChoose: (workout: Workout) => void
  onCancel: () => void
}

export function TemplateList({ onChoose, onCancel }: TemplateListProps) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col bg-[#0A0A0A] text-white">
      <header className="safe-x pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="text-4xl font-black tracking-tight">New workout</h1>
        <p className="mt-1 text-lg font-semibold leading-snug text-zinc-400">
          Pick a starting point. You can change anything after.
        </p>
      </header>

      <div className="safe-x mt-4 flex-1 space-y-3 overflow-y-auto pb-4">
        {WORKOUT_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            className="w-full rounded-3xl bg-zinc-900 p-4 text-left active:bg-zinc-800"
            onClick={() => onChoose(template.create())}
          >
            <span className="block text-2xl font-black leading-tight">{template.name}</span>
            <span className="mt-1 block text-lg font-semibold leading-snug text-zinc-300">
              {template.summary}
            </span>
          </button>
        ))}
      </div>

      <div className="safe-x border-t border-white/10 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          className="h-16 w-full rounded-2xl bg-zinc-800 text-2xl font-black"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
