/** DI token (and interface) for the holiday source. Dates are `YYYY-MM-DD` in Asia/Jerusalem. */
export abstract class HolidayProvider {
  /** Days people do not work, from `from` to `to` inclusive. Shabbat is not included. */
  abstract getHolidayDates(from: string, to: string): Promise<string[]>
}
