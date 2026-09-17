import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { workshopConfig, type TimingOverrides } from '../config/workshop.ts'
import { sessionStore } from '../store/browserStore.ts'
import './timeSettings.css'

type Props = {
  open: boolean
  onClose: () => void
}

type FieldKey = keyof TimingOverrides

type Field = {
  key: FieldKey
  label: string
  defaultValue: number
}

const briefingDefault =
  workshopConfig.phases.find((phase) => phase.id === 'planung')?.startMinutes ??
  10
const estimateDefault =
  workshopConfig.milestones.find(
    (milestone) => milestone.id === 'vorkalkulation',
  )?.atMinutes ?? 30

const FIELDS: Field[] = [
  {
    key: 'planningMinutes',
    label: 'Planungszeit (Minuten)',
    defaultValue: workshopConfig.planningMinutes,
  },
  {
    key: 'realizationMinutes',
    label: 'Realisierungszeit (Minuten)',
    defaultValue: workshopConfig.realizationMinutes,
  },
  {
    key: 'briefingMinutes',
    label: 'Planung ab Minute',
    defaultValue: briefingDefault,
  },
  {
    key: 'estimateDueMinute',
    label: 'Vorkalkulation fällig ab Minute',
    defaultValue: estimateDefault,
  },
  {
    key: 'sketchDueMinute',
    label: 'Projektskizze fällig ab Minute',
    defaultValue: workshopConfig.planningMinutes,
  },
  {
    key: 'warningMinutes',
    label: 'Warnung vor Fälligkeit (Minuten)',
    defaultValue: workshopConfig.warningMinutes,
  },
  {
    key: 'criticalMinutes',
    label: 'Kritisch vor Fälligkeit (Minuten)',
    defaultValue: workshopConfig.criticalMinutes,
  },
]

const EMPTY_VALUES: Record<FieldKey, string> = {
  planningMinutes: '',
  realizationMinutes: '',
  briefingMinutes: '',
  estimateDueMinute: '',
  sketchDueMinute: '',
  warningMinutes: '',
  criticalMinutes: '',
}

function parseMinutes(raw: string): number | undefined {
  const trimmed = raw.trim()
  if (trimmed === '') return undefined
  const value = Number(trimmed)
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

export function TimeSettingsDialog({ open, onClose }: Props) {
  if (!open) return null
  return createPortal(<TimeSettingsCard onClose={onClose} />, document.body)
}

function initialValues(): Record<FieldKey, string> {
  const overrides = sessionStore.getState().timingOverrides
  const next = { ...EMPTY_VALUES }
  for (const field of FIELDS) {
    const value = overrides[field.key]
    next[field.key] = value == null ? '' : String(value)
  }
  return next
}

function TimeSettingsCard({ onClose }: { onClose: () => void }) {
  const [values, setValues] = useState<Record<FieldKey, string>>(initialValues)
  const cardRef = useRef<HTMLDivElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [])

  useEffect(() => {
    const card = cardRef.current
    // Tasten im Dialog nicht an globale Hotkeys weiterreichen (z. B.
    // Leertaste = Start/Pause), Escape schließt den Dialog zuerst.
    function onCardKeyDown(event: KeyboardEvent) {
      event.stopPropagation()
      if (event.key === 'Escape') onClose()
    }
    function onWindowKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    card?.addEventListener('keydown', onCardKeyDown)
    window.addEventListener('keydown', onWindowKeyDown, true)
    return () => {
      card?.removeEventListener('keydown', onCardKeyDown)
      window.removeEventListener('keydown', onWindowKeyDown, true)
    }
  }, [onClose])

  function handleApply() {
    const overrides: TimingOverrides = {}
    for (const field of FIELDS) {
      const value = parseMinutes(values[field.key])
      if (value !== undefined) overrides[field.key] = value
    }
    sessionStore.setTimingOverrides(overrides)
    onClose()
  }

  function handleDefaults() {
    sessionStore.resetTimingOverrides()
    onClose()
  }

  return (
    <div
      className="time-settings-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="time-settings-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="time-settings-title"
        ref={cardRef}
      >
        <div className="time-settings-head">
          <h2 className="time-settings-title" id="time-settings-title">
            Alle Zeiten ändern
          </h2>
          <button
            type="button"
            className="time-settings-close"
            aria-label="Schließen"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            handleApply()
          }}
        >
          <div className="time-settings-grid">
            {FIELDS.map((field, index) => (
              <label key={field.key} className="time-settings-field">
                <span>{field.label}</span>
                <input
                  ref={index === 0 ? firstFieldRef : undefined}
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder={String(field.defaultValue)}
                  value={values[field.key]}
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <p className="time-settings-hint">
            Leere Felder nutzen den Standardwert. Die Projektskizze folgt der
            Planungszeit, solange kein eigener Wert gesetzt ist. Fertigstellung
            und Abschluss ergeben sich aus Planungs- plus Realisierungszeit.
          </p>
          <div className="time-settings-actions">
            <button type="submit" className="time-settings-apply">
              Übernehmen
            </button>
            <button
              type="button"
              className="time-settings-defaults"
              onClick={handleDefaults}
            >
              Standard
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
