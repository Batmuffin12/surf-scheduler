import { Module } from '@nestjs/common'
import { ForecastModule } from './adapters/forecast/forecast.module'
import { HolidaysModule } from './adapters/holidays/holidays.module'
import { BeachesModule } from './beaches/beaches.module'
import { DatabaseModule } from './database/database.module'
import { HealthController } from './health.controller'
import { UserBeachesModule } from './user-beaches/user-beaches.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    BeachesModule,
    UserBeachesModule,
    ForecastModule,
    HolidaysModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
