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
