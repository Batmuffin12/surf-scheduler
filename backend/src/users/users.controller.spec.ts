import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { UsersModule } from './users.module'
import { startTestDatabase, TestDatabase } from '../database/test-database'

describe('users API', () => {
  let db: TestDatabase
  let app: INestApplication

  beforeAll(async () => {
    db = await startTestDatabase([UsersModule])
    app = db.module.createNestApplication()
    await app.init()
  })
  afterAll(async () => {
    await app.close()
    await db.stop()
  })
  beforeEach(() => db.clear())

  describe('GET /users?email=', () => {
    it('returns the same user object as create, matching the email trimmed and case-insensitively', async () => {
      const created = await request(app.getHttpServer()).post('/users').send({ email: 'surfer@example.com' })

      const res = await request(app.getHttpServer()).get('/users').query({ email: ' Surfer@Example.com ' })

      expect(res.status).toBe(200)
      expect(res.body).toEqual(created.body)
    })

    it('answers 404 for an unknown email', async () => {
      const res = await request(app.getHttpServer()).get('/users').query({ email: 'nobody@example.com' })

      expect(res.status).toBe(404)
      expect(res.body.message).toBe('No such user')
    })

    it('answers 400 when the email is missing or malformed', async () => {
      const res = await request(app.getHttpServer()).get('/users').query({ email: 'nope' })

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('A valid email is required')
    })
  })

  describe('GET /users/:id', () => {
    it('returns the user', async () => {
      const created = await request(app.getHttpServer()).post('/users').send({ email: 'surfer@example.com' })

      const res = await request(app.getHttpServer()).get(`/users/${created.body.id}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual(created.body)
    })

    it.each(['000000000000000000000000', 'not-an-id'])('answers 404 for %s', async (id) => {
      const res = await request(app.getHttpServer()).get(`/users/${id}`)

      expect(res.status).toBe(404)
      expect(res.body.message).toBe('No such user')
    })
  })

  describe('PUT /users/:id/profile', () => {
    const profile = {
      surfType: 'BOTH',
      city: { name: 'Tel Aviv', latitude: 32.0853, longitude: 34.7818 },
      maxRadiusKm: 25,
      schedule: [
        { day: 'SUN', dayOff: false, start: '08:00', end: '18:00', flexHours: 2 },
        { day: 'MON', dayOff: false, start: '09:00', end: '17:00', flexHours: 0 },
        { day: 'TUE', dayOff: true },
        { day: 'WED', dayOff: false, start: '08:00', end: '18:00', flexHours: 3 },
        { day: 'THU', dayOff: false, start: '08:00', end: '18:00', flexHours: 1 },
        { day: 'FRI', dayOff: true },
        { day: 'SAT', dayOff: true },
      ],
    }
    const workDay = (patch: object) => ({ ...profile.schedule[0], ...patch })
    const withSchedule0 = (patch: object) => ({
      ...profile,
      schedule: [workDay(patch), ...profile.schedule.slice(1)],
    })
    let id: string
    beforeEach(async () => {
      id = (await request(app.getHttpServer()).post('/users').send({ email: 'surfer@example.com' })).body.id
    })

    it('saves the profile, answers 200 with the user, and the user lookup shows it', async () => {
      const res = await request(app.getHttpServer()).put(`/users/${id}/profile`).send(profile)

      expect(res.status).toBe(200)
      expect(res.body).toEqual({
        id,
        email: 'surfer@example.com',
        createdAt: expect.any(String),
        ...profile,
      })
      const again = await request(app.getHttpServer()).get(`/users/${id}`)
      expect(again.body).toEqual(res.body)
    })

    it('accepts a day off sent with null times and stores it without times', async () => {
      const body = { ...profile, schedule: profile.schedule.map((e) => (e.dayOff ? { ...e, start: null, end: null, flexHours: null } : e)) }

      const res = await request(app.getHttpServer()).put(`/users/${id}/profile`).send(body)

      expect(res.status).toBe(200)
      expect(res.body.schedule).toEqual(profile.schedule)
    })

    it('answers 404 for an unknown user', async () => {
      const res = await request(app.getHttpServer()).put('/users/000000000000000000000000/profile').send(profile)

      expect(res.status).toBe(404)
      expect(res.body.message).toBe('No such user')
    })

    it.each([
      ['an unknown surf type', { ...profile, surfType: 'KITE' }, 'surfType must be SUP, WAVE or BOTH'],
      ['a missing city', { ...profile, city: undefined }, 'city needs a name, latitude and longitude'],
      ['a city latitude out of range', { ...profile, city: { ...profile.city, latitude: 91 } }, 'city needs a name, latitude and longitude'],
      ['a radius over 100 km', { ...profile, maxRadiusKm: 101 }, 'maxRadiusKm must be a number from 0 to 100'],
      ['a negative radius', { ...profile, maxRadiusKm: -1 }, 'maxRadiusKm must be a number from 0 to 100'],
      ['a schedule with 6 days', { ...profile, schedule: profile.schedule.slice(1) }, 'schedule needs exactly one entry for each weekday'],
      ['a repeated weekday', { ...profile, schedule: [...profile.schedule.slice(1), profile.schedule[1]] }, 'schedule needs exactly one entry for each weekday'],
      ['a start that is not a whole hour', withSchedule0({ start: '08:30' }), 'SUN: start and end must be whole hours (HH:00)'],
      ['an end that is not a whole hour', withSchedule0({ end: '17:15' }), 'SUN: start and end must be whole hours (HH:00)'],
      ['a missing start on a working day', withSchedule0({ start: undefined }), 'SUN: start and end must be whole hours (HH:00)'],
      ['a block crossing midnight', withSchedule0({ start: '22:00', end: '02:00' }), 'SUN: end must be after start (no block crosses midnight)'],
      ['an empty block', withSchedule0({ start: '08:00', end: '08:00' }), 'SUN: end must be after start (no block crosses midnight)'],
      ['flex over 3 hours', withSchedule0({ flexHours: 4 }), 'SUN: flexHours must be a whole number from 0 to 3'],
      ['fractional flex', withSchedule0({ flexHours: 1.5 }), 'SUN: flexHours must be a whole number from 0 to 3'],
      ['times on a day off', withSchedule0({ dayOff: true }), 'SUN: a day off has no start, end or flexHours'],
    ])('answers 400 for %s', async (_name, body, message) => {
      const res = await request(app.getHttpServer()).put(`/users/${id}/profile`).send(body)

      expect(res.status).toBe(400)
      expect(res.body.message).toBe(message)
    })
  })

  describe('POST /users', () => {
    it('creates a user from an email and answers 201 with the user', async () => {
      const res = await request(app.getHttpServer()).post('/users').send({ email: 'surfer@example.com' })

      expect(res.status).toBe(201)
      expect(res.body).toEqual({
        id: expect.stringMatching(/^[0-9a-f]{24}$/),
        email: 'surfer@example.com',
        createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/),
      })
    })

    it('stores the email trimmed and lowercased', async () => {
      const res = await request(app.getHttpServer()).post('/users').send({ email: '  Surfer@Example.COM ' })

      expect(res.status).toBe(201)
      expect(res.body.email).toBe('surfer@example.com')
    })

    it('answers 409 when a user with this email already exists, ignoring case', async () => {
      await request(app.getHttpServer()).post('/users').send({ email: 'surfer@example.com' })

      const res = await request(app.getHttpServer()).post('/users').send({ email: 'SURFER@example.com' })

      expect(res.status).toBe(409)
      expect(res.body.message).toBe('A user with this email already exists')
    })

    it.each([[{}], [{ email: '' }], [{ email: 'not-an-email' }], [{ email: 42 }]])(
      'answers 400 with a message for the body %j',
      async (body) => {
        const res = await request(app.getHttpServer()).post('/users').send(body)

        expect(res.status).toBe(400)
        expect(res.body.message).toBe('A valid email is required')
      },
    )
  })
})
