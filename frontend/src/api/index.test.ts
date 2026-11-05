import { describe, expect, test, vi } from 'vitest'
import { createApiClient } from './client.ts'
import { ApiRequestError, createApi } from './index.ts'

describe('mock mode', () => {
  const api = createApi({ useMocks: true, mockDelayMs: 0 })

  test('signing in returns a user with the entered email', async () => {
    const user = await api.signIn('surfer@example.com')

    expect(user.email).toBe('surfer@example.com')
    expect(user.id).toBeTruthy()
  })

  test('beach grades are whole numbers from 1 to 10 and change over time', async () => {
    const morning = await api.getBeachGrades('user-1', '2026-11-06T08:00:00+02:00')
    const evening = await api.getBeachGrades('user-1', '2026-11-06T16:00:00+02:00')

    expect(morning.length).toBeGreaterThan(0)
    for (const { grade } of [...morning, ...evening]) {
      expect(Number.isInteger(grade) && grade >= 1 && grade <= 10).toBe(true)
    }
    expect(morning.map((g) => g.grade)).not.toEqual(evening.map((g) => g.grade))
  })

  test('the same beach and time always gets the same grade', async () => {
    const first = await api.getBeachGrades('user-1', '2026-11-06T10:00:00+02:00')
    const again = await api.getBeachGrades('user-1', '2026-11-06T10:00:00+02:00')

    expect(again).toEqual(first)
  })

  test('a saved profile is returned when loading it again', async () => {
    const profile = await api.getProfile('user-1')
    const changed = { ...profile, surfType: 'SUP' as const, radiusKm: 15 }

    await api.saveProfile('user-1', changed)

    expect(await api.getProfile('user-1')).toEqual(changed)
  })

  test('suggestions are 2-hour sessions in the next 3 days, best grade first', async () => {
    const now = new Date('2026-11-06T07:00:00+02:00')
    const suggestions = await api.getSuggestions('user-1', now)

    expect(suggestions.length).toBeGreaterThan(0)
    const grades = suggestions.map((s) => s.grade)
    expect(grades).toEqual([...grades].sort((a, b) => b - a))
    for (const s of suggestions) {
      expect(new Date(s.end).getTime() - new Date(s.start).getTime()).toBe(2 * 60 * 60 * 1000)
      expect(new Date(s.start) >= now).toBe(true)
      expect(new Date(s.end) <= new Date('2026-11-09T07:00:00+02:00')).toBe(true)
    }
  })
})

describe('real mode', () => {
  function apiAnswering(status: number, body: unknown) {
    const fetch = vi.fn(async (_request: Request) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
    )
    const api = createApi({ useMocks: false, client: createApiClient({ baseUrl: 'http://localhost/api', fetch }) })
    return { api, fetch }
  }

  test('signing in a new email creates the user with POST /users', async () => {
    const created = { id: '3f1c2a7e-9b4d-4e8a-a1c2-5d6e7f8a9b0c', email: 'surfer@example.com', createdAt: '2026-11-05T09:00:00Z' }
    const { api, fetch } = apiAnswering(201, created)

    const user = await api.signIn('surfer@example.com')

    const request = fetch.mock.calls[0][0]
    expect(request.method).toBe('POST')
    expect(request.url).toBe('http://localhost/api/users')
    expect(await request.json()).toEqual({ email: 'surfer@example.com' })
    expect(user).toEqual(created)
  })

  test("a malformed email is rejected with the server's message", async () => {
    const { api } = apiAnswering(400, { message: 'email must be a valid email address' })

    const attempt = api.signIn('not-an-email')

    await expect(attempt).rejects.toBeInstanceOf(ApiRequestError)
    await expect(attempt).rejects.toThrow('email must be a valid email address')
  })
})
