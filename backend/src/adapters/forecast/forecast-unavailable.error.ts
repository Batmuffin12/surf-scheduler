/** Thrown when the forecast source still fails after retrying. */
export class ForecastUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ForecastUnavailableError'
  }
}
