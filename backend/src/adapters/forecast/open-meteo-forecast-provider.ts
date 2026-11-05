import { Injectable } from '@nestjs/common'
import { Forecast, ForecastProvider } from './forecast-provider'

import { ForecastUnavailableError } from './forecast-unavailable.error'

/** Extra attempts after the first one fails. */
const RETRIES = 2

type Series = Record<string, (number | string | null)[]>

@Injectable()
export class OpenMeteoForecastProvider extends ForecastProvider {
  async getForecast(lat: number, lng: number, from: string, to: string): Promise<Forecast> {
    const common = { latitude: String(lat), longitude: String(lng), timezone: 'Asia/Jerusalem', start_date: from, end_date: to }
    const marine = await this.get('https://marine-api.open-meteo.com/v1/marine', {
      ...common,
      hourly: 'wave_height,wave_period,swell_wave_height,swell_wave_period,swell_wave_direction',
    })
    const weather = await this.get('https://api.open-meteo.com/v1/forecast', {
      ...common,
      hourly: 'wind_speed_10m,wind_direction_10m,wind_gusts_10m',
      daily: 'sunrise,sunset',
    })
    const m = marine.hourly as Series
    const w = weather.hourly as Series
    const d = weather.daily as Series
    return {
      hourly: (m.time as string[]).map((time, i) => ({
        time,
        waveHeight: m.wave_height[i] as number | null,
        wavePeriod: m.wave_period[i] as number | null,
        swellHeight: m.swell_wave_height[i] as number | null,
        swellPeriod: m.swell_wave_period[i] as number | null,
        swellDirection: m.swell_wave_direction[i] as number | null,
        windSpeed: w.wind_speed_10m[i] as number | null,
        windDirection: w.wind_direction_10m[i] as number | null,
        windGusts: w.wind_gusts_10m[i] as number | null,
      })),
      daily: (d.time as string[]).map((date, i) => ({
        date,
        sunrise: d.sunrise[i] as string,
        sunset: d.sunset[i] as string,
      })),
    }
  }

  private async get(url: string, params: Record<string, string>): Promise<Record<string, unknown>> {
    let lastError: unknown
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      try {
        const res = await fetch(`${url}?${new URLSearchParams(params)}`)
        if (!res.ok) throw new Error(`Open-Meteo request failed with status ${res.status}`)
        return (await res.json()) as Record<string, unknown>
      } catch (error) {
        lastError = error
      }
    }
    throw new ForecastUnavailableError(`Open-Meteo is unavailable after ${RETRIES + 1} attempts`, { cause: lastError })
  }
}
