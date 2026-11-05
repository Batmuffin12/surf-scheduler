import { Forecast, ForecastProvider } from './forecast-provider'
import { ForecastUnavailableError } from './forecast-unavailable.error'

/** In-memory forecast for tests. Ignores the coordinate; filters by the date range. */
export class FakeForecastProvider extends ForecastProvider {
  constructor(
    private readonly forecast: Forecast = { hourly: [], daily: [] },
    private readonly options: { unavailable?: boolean } = {},
  ) {
    super()
  }

  async getForecast(_lat: number, _lng: number, from: string, to: string): Promise<Forecast> {
    if (this.options.unavailable) throw new ForecastUnavailableError('Fake forecast is unavailable')
    return {
      hourly: this.forecast.hourly.filter((h) => h.time.slice(0, 10) >= from && h.time.slice(0, 10) <= to),
      daily: this.forecast.daily.filter((d) => d.date >= from && d.date <= to),
    }
  }
}
