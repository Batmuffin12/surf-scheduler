import { FakeForecastProvider } from '../adapters/forecast/fake-forecast-provider'
import { FakeHolidayProvider } from '../adapters/holidays/fake-holiday-provider'
import { ScheduleEntry } from '../users/user.schema'
import { FreeTimeService } from './free-time.service'

// 2026-11-09 is a Monday. Israel is on UTC+2 in November (no DST).
const MON_0030 = new Date('2026-11-08T22:30:00Z') // Monday 00:30 Asia/Jerusalem

function daylight(date: string, sunrise: string, sunset: string) {
  return { date, sunrise: `${date}T${sunrise}`, sunset: `${date}T${sunset}` }
}

function build(options: { holidays?: string[]; daily?: ReturnType<typeof daylight>[] }) {
  return new FreeTimeService(
    new FakeHolidayProvider(options.holidays ?? []),
    new FakeForecastProvider({ hourly: [], daily: options.daily ?? [] }),
  )
}

const query = { latitude: 32.08, longitude: 34.77 }

describe('FreeTimeService', () => {
  it('on a day off, offers every whole-hour 2-hour window between sunrise and sunset', async () => {
    const service = build({ daily: [daylight('2026-11-09', '06:12', '17:40')] })
    const schedule: ScheduleEntry[] = [{ day: 'MON', dayOff: true }]

    const days = await service.getFreeWindows({ ...query, schedule, days: 1, now: MON_0030 })

    // Sunrise 06:12 -> first start 07:00. Sunset 17:40 -> last end 17:00, so last start 15:00.
    expect(days).toEqual([
      {
        date: '2026-11-09',
        windows: [7, 8, 9, 10, 11, 12, 13, 14, 15].map((h) => ({
          start: `2026-11-09T${String(h).padStart(2, '0')}:00`,
          end: `2026-11-09T${String(h + 2).padStart(2, '0')}:00`,
          shiftHours: 0,
        })),
      },
    ])
  })

  it('on a work day without flex, offers only the daylight windows outside the work block, over several days', async () => {
    const service = build({
      daily: [daylight('2026-11-09', '06:12', '17:40'), daylight('2026-11-10', '06:30', '16:30')],
    })
    const schedule: ScheduleEntry[] = [
      { day: 'MON', dayOff: false, start: '09:00', end: '17:00', flexHours: 0 },
      { day: 'TUE', dayOff: true },
    ]

    const days = await service.getFreeWindows({ ...query, schedule, days: 2, now: MON_0030 })

    // Monday: work 09-17. Before work only 07-09 fits (sunrise 06:12); after work 17-19 is past sunset 17:40.
    expect(days[0]).toEqual({
      date: '2026-11-09',
      windows: [{ start: '2026-11-09T07:00', end: '2026-11-09T09:00', shiftHours: 0 }],
    })
    // Tuesday (day off): sunrise 06:30 -> first start 07:00; sunset 16:30 -> last end 16:00, last start 14:00.
    expect(days[1].date).toBe('2026-11-10')
    expect(days[1].windows.map((w) => w.start)).toEqual(
      [7, 8, 9, 10, 11, 12, 13, 14].map((h) => `2026-11-10T${String(h).padStart(2, '0')}:00`),
    )
  })

  it('a holiday makes the whole day free, whatever the work schedule says', async () => {
    const service = build({ holidays: ['2026-11-09'], daily: [daylight('2026-11-09', '06:12', '17:40')] })
    const schedule: ScheduleEntry[] = [{ day: 'MON', dayOff: false, start: '09:00', end: '17:00', flexHours: 2 }]

    const [monday] = await service.getFreeWindows({ ...query, schedule, days: 1, now: MON_0030 })

    // Same as an ordinary day off: starts 07..15, no shifts.
    expect(monday.windows.map((w) => [w.shiftHours, w.start.slice(11)])).toEqual(
      [7, 8, 9, 10, 11, 12, 13, 14, 15].map((h) => [0, `${String(h).padStart(2, '0')}:00`]),
    )
  })

  it('today only offers windows that start after the current hour', async () => {
    const service = build({
      daily: [daylight('2026-11-09', '06:12', '17:40'), daylight('2026-11-10', '06:12', '17:40')],
    })
    const schedule: ScheduleEntry[] = [
      { day: 'MON', dayOff: true },
      { day: 'TUE', dayOff: true },
    ]
    const mon1030 = new Date('2026-11-09T08:30:00Z') // 10:30 Asia/Jerusalem

    const days = await service.getFreeWindows({ ...query, schedule, days: 2, now: mon1030 })

    // 10:30 -> the 10:00 hour has started, so the first start is 11:00. Tomorrow is untouched.
    expect(days[0].windows.map((w) => w.start.slice(11))).toEqual(['11:00', '12:00', '13:00', '14:00', '15:00'])
    expect(days[1].windows[0].start).toBe('2026-11-10T07:00')
  })

  it('never shifts a work block across midnight, but keeps the other shifts', async () => {
    const service = build({ daily: [daylight('2026-11-09', '06:12', '17:40')] })
    const schedule: ScheduleEntry[] = [{ day: 'MON', dayOff: false, start: '18:00', end: '23:00', flexHours: 3 }]

    const [monday] = await service.getFreeWindows({ ...query, schedule, days: 1, now: MON_0030 })

    // Block 18-23: +1h gives 19-24 (still same day); +2h would end at 25:00 -> not allowed, nor +3h.
    // -3h gives 15-20. So the shifts are -3..+1.
    expect([...new Set(monday.windows.map((w) => w.shiftHours))]).toEqual([-3, -2, -1, 0, 1])
    // With block 15-20 (shift -3), the free daylight windows end by 15:00: starts 07..13.
    expect(monday.windows.filter((w) => w.shiftHours === -3).map((w) => w.start.slice(11))).toEqual([
      '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    ])
  })

  it('with flex, tags each window with the shift of the work block that frees it', async () => {
    const service = build({ daily: [daylight('2026-11-09', '06:12', '17:40')] })
    const schedule: ScheduleEntry[] = [{ day: 'MON', dayOff: false, start: '09:00', end: '17:00', flexHours: 2 }]

    const [monday] = await service.getFreeWindows({ ...query, schedule, days: 1, now: MON_0030 })

    // Daylight windows start 07..15 (sunrise 06:12, sunset 17:40). Listed by shift, then start.
    // -2h: block 07-15 -> only 15-17.   -1h: block 08-16 -> nothing fits (16-18 is past sunset).
    //  0h: block 09-17 -> 07-09.        +1h: block 10-18 -> 07-09, 08-10.
    // +2h: block 11-19 -> 07-09, 08-10, 09-11.
    expect(monday.windows.map((w) => [w.shiftHours, w.start.slice(11), w.end.slice(11)])).toEqual([
      [-2, '15:00', '17:00'],
      [0, '07:00', '09:00'],
      [1, '07:00', '09:00'],
      [1, '08:00', '10:00'],
      [2, '07:00', '09:00'],
      [2, '08:00', '10:00'],
      [2, '09:00', '11:00'],
    ])
  })
})
