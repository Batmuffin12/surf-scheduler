export interface HourlyForecast {
  /** Local time in Asia/Jerusalem, `YYYY-MM-DDTHH:mm`. */
  time: string
  /** Metres. `null` when Open-Meteo has no value for this hour. */
  waveHeight: number | null
  /** Seconds. */
  wavePeriod: number | null
  swellHeight: number | null
  swellPeriod: number | null
  /** Degrees the swell comes from. */
  swellDirection: number | null
  /** km/h at 10 m. */
  windSpeed: number | null
  /** Degrees the wind comes from. */
  windDirection: number | null
  /** km/h. */
  windGusts: number | null
}

export interface DailyForecast {
  /** `YYYY-MM-DD` in Asia/Jerusalem. */
  date: string
  /** Local time, `YYYY-MM-DDTHH:mm`. */
  sunrise: string
  sunset: string
}

export interface Forecast {
  hourly: HourlyForecast[]
  daily: DailyForecast[]
}

/** DI token (and interface) for the forecast source. Metric units, Asia/Jerusalem times. */
export abstract class ForecastProvider {
  /**
   * Forecast for a coordinate from `from` to `to` inclusive (`YYYY-MM-DD`, at most 16 days ahead).
   * @throws ForecastUnavailableError when the source cannot be reached after retrying.
   */
  abstract getForecast(lat: number, lng: number, from: string, to: string): Promise<Forecast>
}
