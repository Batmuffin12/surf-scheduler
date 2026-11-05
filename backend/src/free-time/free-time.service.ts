import { Injectable } from '@nestjs/common'
import { ForecastProvider } from '../adapters/forecast/forecast-provider'
import { HolidayProvider } from '../adapters/holidays/holiday-provider'
import { ScheduleEntry } from '../users/user.schema'

export interface FreeWindow {
  /** Local time in Asia/Jerusalem, `YYYY-MM-DDTHH:mm`, always on the hour. */
  start: string
  end: string
  /** How many hours the work block was moved (negative = earlier) for this window to be free. */
  shiftHours: number
}

export interface DayFreeWindows {
  date: string
  windows: FreeWindow[]
}

export interface FreeWindowsQuery {
  schedule: ScheduleEntry[]
  latitude: number
  longitude: number
  /** Number of days, starting today (Asia/Jerusalem). */
  days: number
  /** The clock; defaults to the current time. */
  now?: Date
}

const SESSION_HOURS = 2

const TIME_ZONE = 'Asia/Jerusalem'
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

const pad = (n: number) => String(n).padStart(2, '0')

/** Date (`YYYY-MM-DD`) of an instant in Asia/Jerusalem. */
function localDate(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(instant)
}

/** Hour of day (0-23) of an instant in Asia/Jerusalem. */
function localHour(instant: Date): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', hourCycle: 'h23' }).format(instant))
}

function addDays(date: string, n: number): string {
  return new Date(Date.parse(date) + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function weekdayOf(date: string) {
  return WEEKDAYS[new Date(Date.parse(date)).getUTCDay()]
}

/** `HH:mm` to minutes since midnight. */
function minutes(time: string): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
}

const DAY_MINUTES = 24 * 60

/** Whole-hour shifts within +-flex that keep the whole block inside the same calendar day. No block: only 0. */
function allowedShifts(block: { start: number; end: number } | undefined, flex: number): number[] {
  if (!block) return [0]
  const shifts: number[] = []
  for (let shift = 0 - flex; shift <= flex; shift++) {
    if (block.start + shift * 60 >= 0 && block.end + shift * 60 <= DAY_MINUTES) shifts.push(shift)
  }
  return shifts
}

@Injectable()
export class FreeTimeService {
  constructor(
    private readonly holidays: HolidayProvider,
    private readonly forecast: ForecastProvider,
  ) {}

  async getFreeWindows(query: FreeWindowsQuery): Promise<DayFreeWindows[]> {
    const now = query.now ?? new Date()
    const today = localDate(now)
    const last = addDays(today, query.days - 1)
    const holidays = new Set(await this.holidays.getHolidayDates(today, last))
    const { daily } = await this.forecast.getForecast(query.latitude, query.longitude, today, last)
    return daily.map((d) => {
      const sunriseStart = Math.ceil(minutes(d.sunrise.slice(11)) / 60)
      const firstStart = d.date === today ? Math.max(sunriseStart, localHour(now) + 1) : sunriseStart
      const lastEnd = Math.floor(minutes(d.sunset.slice(11)) / 60)
      const entry = query.schedule.find((e) => e.day === weekdayOf(d.date))
      const block = entry && !holidays.has(d.date) && !entry.dayOff && entry.start && entry.end ? { start: minutes(entry.start), end: minutes(entry.end) } : undefined
      const windows: FreeWindow[] = []
      for (const shift of allowedShifts(block, Math.floor(entry?.flexHours ?? 0))) {
        const shifted = block && { start: block.start + shift * 60, end: block.end + shift * 60 }
        for (let h = firstStart; h + SESSION_HOURS <= lastEnd; h++) {
          if (shifted && h * 60 < shifted.end && (h + SESSION_HOURS) * 60 > shifted.start) continue
          windows.push({
            start: `${d.date}T${pad(h)}:00`,
            end: `${d.date}T${pad(h + SESSION_HOURS)}:00`,
            shiftHours: shift,
          })
        }
      }
      return { date: d.date, windows }
    })
  }
}
