import { ConflictException } from '@nestjs/common'
import { UsersModule } from './users.module'
import { UsersService } from './users.service'
import { startTestDatabase, TestDatabase } from '../database/test-database'

describe('UsersService', () => {
  let db: TestDatabase
  let users: UsersService

  beforeAll(async () => {
    db = await startTestDatabase([UsersModule])
    users = db.module.get(UsersService)
  })
  afterAll(() => db.stop())
  beforeEach(() => db.clear())

  it('creates a user from an email and finds it again by id', async () => {
    const created = await users.create('surfer@example.com')

    const found = await users.findById(created.id)

    expect(found?.email).toBe('surfer@example.com')
  })

  it('stores the profile: surf type, city anchor, radius and one schedule entry per weekday', async () => {
    const created = await users.create('surfer@example.com')

    await users.updateProfile(created.id, {
      surfType: 'BOTH',
      city: { name: 'Tel Aviv', latitude: 32.0853, longitude: 34.7818 },
      maxRadiusKm: 25,
      schedule: [
        { day: 'SUN', dayOff: false, start: '08:00', end: '18:00', flexHours: 2 },
        { day: 'MON', dayOff: false, start: '09:00', end: '17:00', flexHours: 0 },
        { day: 'TUE', dayOff: true },
        { day: 'WED', dayOff: false, start: '08:00', end: '18:00', flexHours: 1 },
        { day: 'THU', dayOff: false, start: '08:00', end: '18:00', flexHours: 1 },
        { day: 'FRI', dayOff: true },
        { day: 'SAT', dayOff: true },
      ],
    })
    const found = await users.findById(created.id)

    expect(found?.surfType).toBe('BOTH')
    expect(found?.city).toEqual({ name: 'Tel Aviv', latitude: 32.0853, longitude: 34.7818 })
    expect(found?.maxRadiusKm).toBe(25)
    expect(found?.schedule).toEqual([
      { day: 'SUN', dayOff: false, start: '08:00', end: '18:00', flexHours: 2 },
      { day: 'MON', dayOff: false, start: '09:00', end: '17:00', flexHours: 0 },
      { day: 'TUE', dayOff: true },
      { day: 'WED', dayOff: false, start: '08:00', end: '18:00', flexHours: 1 },
      { day: 'THU', dayOff: false, start: '08:00', end: '18:00', flexHours: 1 },
      { day: 'FRI', dayOff: true },
      { day: 'SAT', dayOff: true },
    ])
  })

  it('refuses a second user with the same email, ignoring letter case', async () => {
    await users.create('surfer@example.com')

    await expect(users.create('Surfer@Example.com')).rejects.toBeInstanceOf(ConflictException)
  })
})
