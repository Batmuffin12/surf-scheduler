import { Module } from '@nestjs/common'
import { ForecastModule } from '../adapters/forecast/forecast.module'
import { HolidaysModule } from '../adapters/holidays/holidays.module'
import { FreeTimeService } from './free-time.service'

@Module({
  imports: [HolidaysModule, ForecastModule],
  providers: [FreeTimeService],
  exports: [FreeTimeService],
})
export class FreeTimeModule {}
