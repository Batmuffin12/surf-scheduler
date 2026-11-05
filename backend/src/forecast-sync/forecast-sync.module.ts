import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ScheduleModule } from '@nestjs/schedule'
import { ForecastModule } from '../adapters/forecast/forecast.module'
import { Beach, BeachSchema } from '../beaches/beach.schema'
import { ForecastSyncService } from './forecast-sync.service'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ForecastModule,
    MongooseModule.forFeature([{ name: Beach.name, schema: BeachSchema }]),
  ],
  providers: [ForecastSyncService],
  exports: [ForecastSyncService],
})
export class ForecastSyncModule {}
