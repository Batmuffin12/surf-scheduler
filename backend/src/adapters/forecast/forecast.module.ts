import { Module } from '@nestjs/common'
import { ForecastProvider } from './forecast-provider'
import { OpenMeteoForecastProvider } from './open-meteo-forecast-provider'

@Module({
  providers: [{ provide: ForecastProvider, useClass: OpenMeteoForecastProvider }],
  exports: [ForecastProvider],
})
export class ForecastModule {}
