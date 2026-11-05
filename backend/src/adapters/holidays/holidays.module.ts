import { Module } from '@nestjs/common'
import { HebcalHolidayProvider } from './hebcal-holiday-provider'
import { HolidayProvider } from './holiday-provider'

@Module({
  providers: [{ provide: HolidayProvider, useClass: HebcalHolidayProvider }],
  exports: [HolidayProvider],
})
export class HolidaysModule {}
