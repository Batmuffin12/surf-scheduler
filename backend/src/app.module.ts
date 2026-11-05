import { Module } from '@nestjs/common'
import { ForecastModule } from './adapters/forecast/forecast.module'
import { HolidaysModule } from './adapters/holidays/holidays.module'
import { BeachesModule } from './beaches/beaches.module'
import { DatabaseModule } from './database/database.module'
import { ForecastSyncModule } from './forecast-sync/forecast-sync.module'
import { FreeTimeModule } from './free-time/free-time.module'
import { HealthController } from './health.controller'
import { RadiusModule } from './radius/radius.module'
import { UserBeachesModule } from './user-beaches/user-beaches.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    BeachesModule,
    UserBeachesModule,
    RadiusModule,
    ForecastModule,
    ForecastSyncModule,
    HolidaysModule,
    FreeTimeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
