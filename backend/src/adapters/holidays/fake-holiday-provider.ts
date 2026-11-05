import { HolidayProvider } from './holiday-provider'

/** In-memory holidays for tests. Dates are `YYYY-MM-DD`. */
export class FakeHolidayProvider extends HolidayProvider {
  constructor(private readonly dates: string[] = []) {
    super()
  }

  async getHolidayDates(from: string, to: string): Promise<string[]> {
    return this.dates.filter((d) => d >= from && d <= to)
  }
}
