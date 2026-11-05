import { Test } from '@nestjs/testing'
import { FakeHolidayProvider } from './fake-holiday-provider'
import { HebcalHolidayProvider } from './hebcal-holiday-provider'
import { HolidayProvider } from './holiday-provider'
import { HolidaysModule } from './holidays.module'

describe('HolidaysModule', () => {
  it('provides the Hebcal implementation by default', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [HolidaysModule] }).compile()

    expect(moduleRef.get(HolidayProvider)).toBeInstanceOf(HebcalHolidayProvider)
  })

  it('lets tests swap in the fake and returns only dates inside the range', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [HolidaysModule] })
      .overrideProvider(HolidayProvider)
      .useValue(new FakeHolidayProvider(['2026-09-12', '2026-09-21', '2026-10-03']))
      .compile()

    const dates = await moduleRef.get(HolidayProvider).getHolidayDates('2026-09-13', '2026-10-03')

    expect(dates).toEqual(['2026-09-21', '2026-10-03'])
  })
})
