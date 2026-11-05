import { Test, TestingModule } from '@nestjs/testing'
import { MongooseModule } from '@nestjs/mongoose'
import { SchedulerRegistry } from '@nestjs/schedule'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Forecast, ForecastProvider } from '../adapters/forecast/forecast-provider'
import { ForecastUnavailableError } from '../adapters/forecast/forecast-unavailable.error'
import { FakeForecastProvider } from '../adapters/forecast/fake-forecast-provider'
import { BeachesModule } from '../beaches/beaches.module'
import { BeachesService } from '../beaches/beaches.service'
import { beachFixtures } from '../beaches/beach.fixtures'
import { ForecastSyncModule } from './forecast-sync.module'
import { ForecastSyncService } from './forecast-sync.service'

const hour = (time: string, waveHeight: number | null) => ({
  time,
  waveHeight,
  wavePeriod: waveHeight === null ? null : 8,
  swellHeight: waveHeight === null ? null : 0.7,
  swellPeriod: waveHeight === null ? null : 9,
  swellDirection: waveHeight === null ? null : 280,
  windSpeed: 12,
  windDirection: 90,
  windGusts: 20,
})

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })

describe('ForecastSyncService', () => {
  let mongod: MongoMemoryServer
  let module: TestingModule
  let beaches: BeachesService
  let sync: ForecastSyncService

  async function start(provider: ForecastProvider) {
    mongod = await MongoMemoryServer.create({ binary: { version: '7.0.14' } })
    module = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(mongod.getUri()), BeachesModule, ForecastSyncModule],
    })
      .overrideProvider(ForecastProvider)
      .useValue(provider)
      .compile()
    await module.init()
    beaches = module.get(BeachesService)
    sync = module.get(ForecastSyncService)
  }
  afterEach(async () => {
    await module.close()
    await mongod.stop()
  })

  it('stores the fetched forecast and updatedAt on every beach', async () => {
    await start(new FakeForecastProvider({ hourly: [hour(`${today}T09:00`, 1.2)], daily: [] }))
    await beaches.insertMany(beachFixtures)

    await sync.syncAll()

    for (const beach of await beaches.findAll()) {
      const stored = await sync.getStoredForecast(beach._id.toString())
      expect(stored?.forecast.hourly).toEqual([hour(`${today}T09:00`, 1.2)])
      expect(stored?.updatedAt).toBeInstanceOf(Date)
    }
  })

  describe('schedule', () => {
    afterEach(() => {
      delete process.env.FORECAST_SYNC_CRON
    })

    it('runs every hour by default', async () => {
      await start(new FakeForecastProvider())

      const job = module.get(SchedulerRegistry).getCronJob('forecast-sync')

      expect(job.cronTime.source).toBe('0 * * * *')
    })

    it('runs on the FORECAST_SYNC_CRON expression when set', async () => {
      process.env.FORECAST_SYNC_CRON = '*/30 * * * *'
      await start(new FakeForecastProvider())

      const job = module.get(SchedulerRegistry).getCronJob('forecast-sync')

      expect(job.cronTime.source).toBe('*/30 * * * *')
    })
  })

  describe('forecast window', () => {
    const asked: { from: string; to: string }[] = []
    const recorder = new (class extends ForecastProvider {
      async getForecast(_lat: number, _lng: number, from: string, to: string): Promise<Forecast> {
        asked.push({ from, to })
        return { hourly: [], daily: [] }
      }
    })()
    const dayOffset = (n: number) =>
      new Date(Date.now() + n * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })

    beforeEach(() => {
      asked.length = 0
    })
    afterEach(() => {
      delete process.env.FORECAST_SYNC_DAYS
    })

    it('asks for today and the following 3 days by default', async () => {
      await start(recorder)
      await beaches.insertMany(beachFixtures.slice(0, 1))

      await sync.syncAll()

      expect(asked).toEqual([{ from: dayOffset(0), to: dayOffset(3) }])
    })

    it('uses FORECAST_SYNC_DAYS, capped at the 16-day forecast limit', async () => {
      process.env.FORECAST_SYNC_DAYS = '30'
      await start(recorder)
      await beaches.insertMany(beachFixtures.slice(0, 1))

      await sync.syncAll()

      expect(asked).toEqual([{ from: dayOffset(0), to: dayOffset(15) }])
    })
  })

  it('stores wind only for a beach whose marine values are null (coordinates on land)', async () => {
    const landHour = { ...hour(`${today}T09:00`, null) }
    await start(new FakeForecastProvider({ hourly: [landHour], daily: [] }))
    await beaches.insertMany(beachFixtures.slice(0, 1))

    await sync.syncAll()

    const [beach] = await beaches.findAll()
    expect((await sync.getStoredForecast(beach._id.toString()))?.forecast.hourly).toEqual([
      {
        time: `${today}T09:00`,
        waveHeight: null,
        wavePeriod: null,
        swellHeight: null,
        swellPeriod: null,
        swellDirection: null,
        windSpeed: 12,
        windDirection: 90,
        windGusts: 20,
      },
    ])
  })

  it('keeps the previous forecast of a beach that fails and still updates the others', async () => {
    let waveHeight = 1.2
    let gordonDown = false
    const provider = new (class extends ForecastProvider {
      async getForecast(lat: number): Promise<Forecast> {
        if (gordonDown && lat === 32.0817) throw new ForecastUnavailableError('down')
        return { hourly: [hour(`${today}T09:00`, waveHeight)], daily: [] }
      }
    })()
    await start(provider)
    await beaches.insertMany(beachFixtures)
    await sync.syncAll()
    const [gordon, hilton] = await beaches.findAll()

    gordonDown = true
    waveHeight = 3.3
    await sync.syncAll()

    expect((await sync.getStoredForecast(gordon._id.toString()))?.forecast.hourly[0].waveHeight).toBe(1.2)
    expect((await sync.getStoredForecast(hilton._id.toString()))?.forecast.hourly[0].waveHeight).toBe(3.3)
  })
})
