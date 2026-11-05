import { BeachesModule } from './beaches.module'
import { BeachesService } from './beaches.service'
import { beachFixtures } from './beach.fixtures'
import { startTestDatabase, TestDatabase } from '../database/test-database'

describe('BeachesService', () => {
  let db: TestDatabase
  let beaches: BeachesService

  beforeAll(async () => {
    db = await startTestDatabase([BeachesModule])
    beaches = db.module.get(BeachesService)
  })
  afterAll(() => db.stop())
  beforeEach(() => db.clear())

  it('returns the beaches that were inserted, with their coordinates and orientation', async () => {
    await beaches.insertMany(beachFixtures)

    const all = await beaches.findAll()

    expect(
      all.map((b) => ({
        name: b.name,
        latitude: b.latitude,
        longitude: b.longitude,
        facingDegrees: b.facingDegrees,
      })),
    ).toEqual([
      { name: 'Gordon Beach', latitude: 32.0817, longitude: 34.7677, facingDegrees: 270 },
      { name: 'Hilton Beach', latitude: 32.0912, longitude: 34.7685, facingDegrees: 280 },
      { name: 'Herzliya Marina', latitude: 32.1642, longitude: 34.7948, facingDegrees: 265 },
    ])
  })
})
