import type { Beach, Profile, Suggestion, User } from './types.ts'

// Real Israeli beaches, north to south
export const MOCK_BEACHES: Beach[] = [
  { id: 'bat-galim', name: 'Bat Galim, Haifa', lat: 32.8317, lon: 34.9781 },
  { id: 'caesarea', name: 'Caesarea Aqueduct', lat: 32.5126, lon: 34.8946 },
  { id: 'netanya', name: 'Netanya Sironit', lat: 32.3289, lon: 34.8495 },
  { id: 'herzliya', name: 'Herzliya Accadia', lat: 32.1649, lon: 34.7998 },
  { id: 'hilton', name: 'Hilton Beach, Tel Aviv', lat: 32.0898, lon: 34.7695 },
  { id: 'bat-yam', name: 'Bat Yam', lat: 32.0187, lon: 34.7417 },
  { id: 'ashdod', name: 'Ashdod Lido', lat: 31.8045, lon: 34.6418 },
  { id: 'ashkelon', name: 'Ashkelon Delilah', lat: 31.6812, lon: 34.5589 },
]

export const MOCK_PROFILE: Profile = {
  surfType: 'BOTH',
  schedule: {
    SUN: { dayOff: false, start: '08:00', end: '17:00', flexHours: 2 },
    MON: { dayOff: false, start: '08:00', end: '17:00', flexHours: 2 },
    TUE: { dayOff: false, start: '08:00', end: '17:00', flexHours: 2 },
    WED: { dayOff: false, start: '08:00', end: '17:00', flexHours: 2 },
    THU: { dayOff: false, start: '08:00', end: '17:00', flexHours: 1 },
    FRI: { dayOff: true },
    SAT: { dayOff: true },
  },
  radiusKm: 40,
}

function hash(text: string): number {
  let h = 0
  for (const char of text) h = (h * 31 + char.charCodeAt(0)) >>> 0
  return h
}

/** A stable id for an email, so the same email always gets the same mock user. */
export function mockUserId(email: string): string {
  return `00000000-0000-4000-8000-${hash(email.toLowerCase()).toString(16).padStart(12, '0')}`
}

/**
 * A made-up but stable grade for a beach at a time: the same inputs always give the same result.
 * Conditions are bucketed per 2 hours, so the timeline shows real changes between steps.
 */
export function mockGrade(beach: Beach, at: Date): { type: 'SUP' | 'WAVE'; grade: number } {
  const twoHourSlot = Math.floor(at.getTime() / (2 * 60 * 60 * 1000))
  const h = hash(`${beach.id}:${twoHourSlot}`)
  return { type: h % 3 === 0 ? 'WAVE' : 'SUP', grade: (h % 10) + 1 }
}

const HOUR = 60 * 60 * 1000
const MAX_MOCK_SUGGESTIONS = 5 // the backend's default limit (#13)

function israelHour(date: Date): number {
  return Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Jerusalem' }).format(date))
}

/** Same day in Israel, as YYYY-MM-DD */
function israelDay(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })
}

/**
 * Mimics GET /recommendation (#13): 2-hour daylight sessions (06:00-16:00 Israel time) in the next 3 days,
 * at most one per beach per day (its best window), best grade first, ties by earlier start then beach name.
 */
export function mockSuggestions(now: Date): Suggestion[] {
  const horizonEnd = now.getTime() + 72 * HOUR
  const firstStart = Math.ceil(now.getTime() / HOUR) * HOUR
  const bestPerBeachDay = new Map<string, Suggestion>()

  for (let start = firstStart; start + 2 * HOUR <= horizonEnd; start += 2 * HOUR) {
    const hour = israelHour(new Date(start))
    if (hour < 6 || hour > 14) continue
    for (const beach of MOCK_BEACHES) {
      const suggestion: Suggestion = {
        beach,
        start: new Date(start).toISOString(),
        end: new Date(start + 2 * HOUR).toISOString(),
        ...mockGrade(beach, new Date(start)),
      }
      const key = `${beach.id} ${israelDay(new Date(start))}`
      const best = bestPerBeachDay.get(key)
      if (!best || suggestion.grade > best.grade) bestPerBeachDay.set(key, suggestion)
    }
  }

  return [...bestPerBeachDay.values()]
    .sort((a, b) => b.grade - a.grade || a.start.localeCompare(b.start) || a.beach.name.localeCompare(b.beach.name))
    .slice(0, MAX_MOCK_SUGGESTIONS)
}

// Mock "users table", kept in localStorage so a signed-in user survives a page reload.
// Storage can be unavailable (private mode); then users only last for this page.
const MOCK_USERS_KEY = 'surf-scheduler:mock-users'
const memoryUsers: Record<string, User> = {}

function readMockUsers(): Record<string, User> {
  try {
    return { ...memoryUsers, ...JSON.parse(localStorage.getItem(MOCK_USERS_KEY) ?? '{}') }
  } catch {
    return { ...memoryUsers }
  }
}

export function findMockUser(id: string): User | undefined {
  return readMockUsers()[id]
}

export function saveMockUser(user: User): void {
  memoryUsers[user.id] = user
  try {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify({ ...readMockUsers(), [user.id]: user }))
  } catch {
    // Not critical in mock mode
  }
}
