/** Thrown when the requested date range is longer than Open-Meteo's 16-day limit. */
export class ForecastRangeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForecastRangeError'
  }
}
