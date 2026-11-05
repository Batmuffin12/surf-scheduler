import { Module } from '@nestjs/common'
import { HolidaysModule } from './adapters/holidays/holidays.module'
import { HealthController } from './health.controller'

@Module({ imports: [HolidaysModule], controllers: [HealthController] })
export class AppModule {}
