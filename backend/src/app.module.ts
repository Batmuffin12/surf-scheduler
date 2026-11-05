import { Module } from '@nestjs/common'
import { ForecastModule } from './adapters/forecast/forecast.module'
import { HolidaysModule } from './adapters/holidays/holidays.module'
import { HealthController } from './health.controller'

@Module({ imports: [ForecastModule, HolidaysModule], controllers: [HealthController] })
export class AppModule {}
