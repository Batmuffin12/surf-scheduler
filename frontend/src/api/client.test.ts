import { expect, test, vi } from 'vitest'
import { createApiClient } from './client.ts'

test('creating a user sends POST /api/users with the email and returns the created user', async () => {
  const created = { id: '3f1c2a7e-9b4d-4e8a-a1c2-5d6e7f8a9b0c', email: 'surfer@example.com', createdAt: '2026-11-05T09:00:00Z' }
  const fetch = vi.fn(async (_request: Request) =>
    new Response(JSON.stringify(created), { status: 201, headers: { 'Content-Type': 'application/json' } }),
  )
  const api = createApiClient({ baseUrl: 'http://localhost/api', fetch })

  const { data } = await api.POST('/users', { body: { email: 'surfer@example.com' } })

  const request = fetch.mock.calls[0][0]
  expect(request.method).toBe('POST')
  expect(request.url).toBe('http://localhost/api/users')
  expect(await request.json()).toEqual({ email: 'surfer@example.com' })
  expect(data).toEqual(created)
})
