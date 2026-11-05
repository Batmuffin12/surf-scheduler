// DRAFT types, not yet in docs/openapi.yaml and not yet agreed with Ofek.
// They follow docs/SPEC.md. Once the backend adds them to the contract,
// replace each one with the generated type from ./schema.

export type { User } from './client.ts'

export type SurfType = 'SUP' | 'WAVE' | 'BOTH'

export type Weekday = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT'

/** A working day: the work block may shift by up to `flexHours` earlier or later. Times are "HH:mm", Asia/Jerusalem. */
export type WorkDay = { dayOff: false; start: string; end: string; flexHours: number }
export type DayOff = { dayOff: true }

export type Profile = {
  surfType: SurfType
  schedule: Record<Weekday, WorkDay | DayOff>
  radiusKm: number
}

export type Beach = {
  id: string
  name: string
  lat: number
  lon: number
}

/** A beach's grade at one point in time. A beach is either SUP or WAVE, never both. */
export type BeachGrade = {
  beach: Beach
  type: 'SUP' | 'WAVE'
  grade: number // integer 1-10
}

/** A 2-hour session suggestion. `start` and `end` are ISO date-times. */
export type Suggestion = {
  beach: Beach
  start: string
  end: string
  type: 'SUP' | 'WAVE'
  grade: number // integer 1-10
}

/** Reply of GET /recommendation. `message` explains an empty list, e.g. "No good sessions in the next 3 days." */
export type SuggestionList = {
  suggestions: Suggestion[]
  message?: string
}
