import { Test } from '@nestjs/testing'
import { FakeForecastProvider } from './fake-forecast-provider'
import { ForecastProvider } from './forecast-provider'
import { ForecastUnavailableError } from './forecast-unavailable.error'
import { ForecastModule } from './forecast.module'
import { OpenMeteoForecastProvider } from './open-meteo-forecast-provider'

describe('ForecastModule', () => {
  it('provides the Open-Meteo implementation by default', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ForecastModule] }).compile()

    expect(moduleRef.get(ForecastProvider)).toBeInstanceOf(OpenMeteoForecastProvider)
  })

  it('lets tests swap in the fake and returns only the hours and days inside the range', async () => {
    const hour = (time: string) => ({
      time, waveHeight: 1, wavePeriod: 7, swellHeight: 1, swellPeriod: 8, swellDirection: 270, windSpeed: 10, windDirection: 90, windGusts: 15,
    })
    const moduleRef = await Test.createTestingModule({ imports: [ForecastModule] })
      .overrideProvider(ForecastProvider)
      .useValue(
        new FakeForecastProvider({
          hourly: [hour('2026-11-04T23:00'), hour('2026-11-05T06:00'), hour('2026-11-06T06:00')],
          daily: [
            { date: '2026-11-04', sunrise: '2026-11-04T06:11', sunset: '2026-11-04T16:49' },
            { date: '2026-11-05', sunrise: '2026-11-05T06:12', sunset: '2026-11-05T16:48' },
          ],
        }),
      )
      .compile()

    const forecast = await moduleRef.get(ForecastProvider).getForecast(32.08, 34.77, '2026-11-05', '2026-11-05')

    expect(forecast.hourly.map((h) => h.time)).toEqual(['2026-11-05T06:00'])
    expect(forecast.daily.map((d) => d.date)).toEqual(['2026-11-05'])
  })

  it('can simulate an outage', async () => {
    const fake = new FakeForecastProvider(undefined, { unavailable: true })

    await expect(fake.getForecast(32.08, 34.77, '2026-11-05', '2026-11-05')).rejects.toBeInstanceOf(
      ForecastUnavailableError,
    )
  })
})
