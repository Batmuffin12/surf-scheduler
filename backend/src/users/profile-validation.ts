import { BadRequestException } from '@nestjs/common'
import { ScheduleEntry, SURF_TYPES, WEEKDAYS } from './user.schema'
import { UserProfile } from './users.service'

export const MAX_RADIUS_KM = 100
export const MAX_FLEX_HOURS = 3

type Raw = Record<string, unknown>
const WHOLE_HOUR = /^([01][0-9]|2[0-3]):00$/

const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const absent = (v: unknown) => v === undefined || v === null
const bad = (message: string) => new BadRequestException(message)

function parseScheduleEntry(raw: unknown): ScheduleEntry {
  if (!isObject(raw) || !WEEKDAYS.includes(raw.day as never)) throw bad('schedule entries need a day (SUN to SAT)')
  const day = raw.day as ScheduleEntry['day']
  if (typeof raw.dayOff !== 'boolean') throw bad(`${day}: dayOff must be true or false`)

  if (raw.dayOff) {
    if (!absent(raw.start) || !absent(raw.end) || !absent(raw.flexHours)) {
      throw bad(`${day}: a day off has no start, end or flexHours`)
    }
    return { day, dayOff: true }
  }

  const { start, end } = raw
  if (typeof start !== 'string' || typeof end !== 'string' || !WHOLE_HOUR.test(start) || !WHOLE_HOUR.test(end)) {
    throw bad(`${day}: start and end must be whole hours (HH:00)`)
  }
  if (end <= start) throw bad(`${day}: end must be after start (no block crosses midnight)`)

  const flexHours = absent(raw.flexHours) ? 0 : raw.flexHours
  if (!Number.isInteger(flexHours) || (flexHours as number) < 0 || (flexHours as number) > MAX_FLEX_HOURS) {
    throw bad(`${day}: flexHours must be a whole number from 0 to ${MAX_FLEX_HOURS}`)
  }
  return { day, dayOff: false, start, end, flexHours: flexHours as number }
}

/** Validates a profile request body against the #7 rules; throws 400 with a message otherwise. */
export function parseProfile(body: unknown): UserProfile {
  const raw: Raw = isObject(body) ? body : {}

  if (!SURF_TYPES.includes(raw.surfType as never)) throw bad('surfType must be SUP, WAVE or BOTH')

  const city = raw.city
  if (
    !isObject(city) ||
    typeof city.name !== 'string' ||
    city.name.trim() === '' ||
    !isNumber(city.latitude) ||
    city.latitude < -90 ||
    city.latitude > 90 ||
    !isNumber(city.longitude) ||
    city.longitude < -180 ||
    city.longitude > 180
  ) {
    throw bad('city needs a name, latitude and longitude')
  }

  if (!isNumber(raw.maxRadiusKm) || raw.maxRadiusKm < 0 || raw.maxRadiusKm > MAX_RADIUS_KM) {
    throw bad(`maxRadiusKm must be a number from 0 to ${MAX_RADIUS_KM}`)
  }

  const days = Array.isArray(raw.schedule) ? raw.schedule.map((e) => (isObject(e) ? e.day : undefined)) : []
  if (!Array.isArray(raw.schedule) || raw.schedule.length !== 7 || WEEKDAYS.some((d) => !days.includes(d))) {
    throw bad('schedule needs exactly one entry for each weekday')
  }

  return {
    surfType: raw.surfType as UserProfile['surfType'],
    city: { name: city.name.trim(), latitude: city.latitude, longitude: city.longitude },
    maxRadiusKm: raw.maxRadiusKm,
    schedule: raw.schedule.map(parseScheduleEntry),
  }
}
