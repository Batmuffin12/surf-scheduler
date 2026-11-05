import { Injectable } from '@nestjs/common'
import { HolidayProvider } from './holiday-provider'

interface HebcalItem {
  date: string
  yomtov?: boolean
}

@Injectable()
export class HebcalHolidayProvider extends HolidayProvider {
  async getHolidayDates(from: string, to: string): Promise<string[]> {
    // `i=on` is Hebcal's Israel schedule flag; `maj=on` limits to main holidays.
    const query = new URLSearchParams({ v: '1', cfg: 'json', maj: 'on', i: 'on', start: from, end: to })
    const res = await fetch(`https://www.hebcal.com/hebcal?${query}`)
    if (!res.ok) throw new Error(`Hebcal request failed with status ${res.status}`)
    const body = (await res.json()) as { items: HebcalItem[] }
    // `yomtov` marks the days people do not work.
    return body.items.filter((i) => i.yomtov).map((i) => i.date)
  }
}
