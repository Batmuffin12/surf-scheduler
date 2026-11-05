import { ForecastRangeError } from './forecast-range.error'
import { ForecastUnavailableError } from './forecast-unavailable.error'
import { OpenMeteoForecastProvider } from './open-meteo-forecast-provider'

const marineBody = {
  hourly: {
    time: ['2026-11-05T00:00', '2026-11-05T01:00'],
    wave_height: [0.66, 0.7],
    wave_period: [5.1, 5.3],
    swell_wave_height: [0.4, 0.5],
    swell_wave_period: [6.2, 6.4],
    swell_wave_direction: [281, 283],
  },
}
const weatherBody = {
  hourly: {
    time: ['2026-11-05T00:00', '2026-11-05T01:00'],
    wind_speed_10m: [2.9, 3],
    wind_direction_10m: [97, 104],
    wind_gusts_10m: [6.5, 4.7],
  },
  daily: {
    time: ['2026-11-05'],
    sunrise: ['2026-11-05T06:12'],
    sunset: ['2026-11-05T16:48'],
  },
}

function json(body: object) {
  return new Response(JSON.stringify(body), { status: 200 })
}

function isMarine(input: unknown) {
  return String(input).startsWith('https://marine-api.open-meteo.com/')
}

function mockOpenMeteo() {
  return jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input) => (isMarine(input) ? json(marineBody) : json(weatherBody)))
}

describe('OpenMeteoForecastProvider', () => {
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('merges marine and weather data into hourly rows plus daily sun times', async () => {
    mockOpenMeteo()

    const forecast = await new OpenMeteoForecastProvider().getForecast(32.08, 34.77, '2026-11-05', '2026-11-05')

    expect(forecast).toEqual({
      hourly: [
        { time: '2026-11-05T00:00', waveHeight: 0.66, wavePeriod: 5.1, swellHeight: 0.4, swellPeriod: 6.2, swellDirection: 281, windSpeed: 2.9, windDirection: 97, windGusts: 6.5 },
        { time: '2026-11-05T01:00', waveHeight: 0.7, wavePeriod: 5.3, swellHeight: 0.5, swellPeriod: 6.4, swellDirection: 283, windSpeed: 3, windDirection: 104, windGusts: 4.7 },
      ],
      daily: [{ date: '2026-11-05', sunrise: '2026-11-05T06:12', sunset: '2026-11-05T16:48' }],
    })
  })

  it('retries a failing request and succeeds when the third attempt works', async () => {
    let marineCalls = 0
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (!isMarine(input)) return json(weatherBody)
      marineCalls++
      return marineCalls < 3 ? new Response('busy', { status: 503 }) : json(marineBody)
    })

    jest.useFakeTimers()
    const pending = new OpenMeteoForecastProvider().getForecast(32.08, 34.77, '2026-11-05', '2026-11-05')
    await jest.runAllTimersAsync()
    const forecast = await pending

    expect(forecast.hourly).toHaveLength(2)
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('throws ForecastUnavailableError after the original try and 2 retries', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('down', { status: 500 }))

    jest.useFakeTimers()
    const result = expect(
      new OpenMeteoForecastProvider().getForecast(32.08, 34.77, '2026-11-05', '2026-11-05'),
    ).rejects.toBeInstanceOf(ForecastUnavailableError)
    await jest.runAllTimersAsync()

    await result
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('throws ForecastUnavailableError when the network fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'))

    jest.useFakeTimers()
    const result = expect(
      new OpenMeteoForecastProvider().getForecast(32.08, 34.77, '2026-11-05', '2026-11-05'),
    ).rejects.toBeInstanceOf(ForecastUnavailableError)
    await jest.runAllTimersAsync()

    await result
  })

  it('waits 500 ms before the first retry and 1 s before the second', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('down', { status: 500 }))
    jest.useFakeTimers()
    const result = expect(
      new OpenMeteoForecastProvider().getForecast(32.08, 34.77, '2026-11-05', '2026-11-05'),
    ).rejects.toBeInstanceOf(ForecastUnavailableError)

    await jest.advanceTimersByTimeAsync(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(499)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(999)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    await result
  })

  it('accepts a range of exactly 16 days', async () => {
    mockOpenMeteo()

    await expect(
      new OpenMeteoForecastProvider().getForecast(32.08, 34.77, '2026-11-05', '2026-11-20'),
    ).resolves.toBeDefined()
  })

  it('rejects a range longer than 16 days with ForecastRangeError, without fetching', async () => {
    const fetchMock = mockOpenMeteo()

    const result = new OpenMeteoForecastProvider().getForecast(32.08, 34.77, '2026-11-05', '2026-11-21')

    await expect(result).rejects.toBeInstanceOf(ForecastRangeError)
    await expect(result).rejects.toThrow(/16 days/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('asks Open-Meteo for the coordinate and date range in Asia/Jerusalem, hourly marine and wind plus daily sun times', async () => {
    const fetchMock = mockOpenMeteo()

    await new OpenMeteoForecastProvider().getForecast(32.08, 34.77, '2026-11-05', '2026-11-10')

    const urls = fetchMock.mock.calls.map(([input]) => new URL(String(input)))
    const marine = urls.find((u) => u.origin === 'https://marine-api.open-meteo.com')!
    const weather = urls.find((u) => u.origin === 'https://api.open-meteo.com')!
    expect(marine.pathname).toBe('/v1/marine')
    expect(Object.fromEntries(marine.searchParams)).toEqual({
      latitude: '32.08',
      longitude: '34.77',
      timezone: 'Asia/Jerusalem',
      start_date: '2026-11-05',
      end_date: '2026-11-10',
      hourly: 'wave_height,wave_period,swell_wave_height,swell_wave_period,swell_wave_direction',
    })
    expect(weather.pathname).toBe('/v1/forecast')
    expect(Object.fromEntries(weather.searchParams)).toEqual({
      latitude: '32.08',
      longitude: '34.77',
      timezone: 'Asia/Jerusalem',
      start_date: '2026-11-05',
      end_date: '2026-11-10',
      hourly: 'wind_speed_10m,wind_direction_10m,wind_gusts_10m',
      daily: 'sunrise,sunset',
    })
  })
})
