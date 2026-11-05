import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { Model } from 'mongoose'
import { Forecast, ForecastProvider } from '../adapters/forecast/forecast-provider'
import { ForecastUnavailableError } from '../adapters/forecast/forecast-unavailable.error'
import { Beach } from '../beaches/beach.schema'

export interface StoredForecast {
  forecast: Forecast
  updatedAt: Date
}

const JOB_NAME = 'forecast-sync'
const DEFAULT_CRON = '0 * * * *'
const MAX_FORECAST_DAYS = 16
const DEFAULT_FORECAST_DAYS = 4

/** Days to fetch, today included: `FORECAST_SYNC_DAYS`, default 4, at most 16. */
function forecastDays(): number {
  const configured = Number(process.env.FORECAST_SYNC_DAYS)
  if (!Number.isInteger(configured) || configured < 1) return DEFAULT_FORECAST_DAYS
  return Math.min(configured, MAX_FORECAST_DAYS)
}

/** `YYYY-MM-DD` in Asia/Jerusalem, `offsetDays` after today. */
function jerusalemDate(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString('en-CA', {
    timeZone: 'Asia/Jerusalem',
  })
}

@Injectable()
export class ForecastSyncService {
  private readonly logger = new Logger(ForecastSyncService.name)

  constructor(
    @InjectModel(Beach.name) private readonly beaches: Model<Beach>,
    private readonly provider: ForecastProvider,
    private readonly registry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const job = new CronJob(process.env.FORECAST_SYNC_CRON || DEFAULT_CRON, () => {
      this.syncAll().catch((error) => this.logger.error('Forecast sync failed', error))
    })
    this.registry.addCronJob(JOB_NAME, job)
    job.start()
  }

  /** Fetches and stores a fresh forecast for every beach. */
  async syncAll(): Promise<void> {
    const from = jerusalemDate(0)
    const to = jerusalemDate(forecastDays() - 1)
    const beaches = await this.beaches.find().lean().exec()
    for (const beach of beaches) {
      try {
        const forecast = await this.provider.getForecast(beach.latitude, beach.longitude, from, to)
        await this.beaches.updateOne({ _id: beach._id }, { $set: { forecast, forecastUpdatedAt: new Date() } })
      } catch (error) {
        if (!(error instanceof ForecastUnavailableError)) throw error
        this.logger.warn(`Forecast unavailable for ${beach.name}; keeping the previous one`)
      }
    }
  }

  async getStoredForecast(beachId: string): Promise<StoredForecast | null> {
    const beach = await this.beaches.findById(beachId).lean().exec()
    if (!beach?.forecast || !beach.forecastUpdatedAt) return null
    return { forecast: beach.forecast, updatedAt: beach.forecastUpdatedAt }
  }
}
