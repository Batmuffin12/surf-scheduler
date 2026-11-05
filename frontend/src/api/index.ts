import { apiClient as defaultClient } from './client.ts'
import { findMockUser, MOCK_BEACHES, MOCK_PROFILE, mockGrade, mockSuggestions, mockUserId, saveMockUser } from './mockData.ts'
import type { BeachGrade, Profile, Suggestion, User } from './types.ts'

export type * from './types.ts'

/** An endpoint the backend doesn't have yet (not in docs/openapi.yaml). Run the app with `pnpm dev:mock`. */
export class NotAvailableYetError extends Error {
  constructor(what: string) {
    super(`${what} is not available from the server yet. Run the app with pnpm dev:mock to use mock data.`)
    this.name = 'NotAvailableYetError'
  }
}

/** The server answered with an error, e.g. 400 for a malformed email. `message` comes from the server. */
export class ApiRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

type ApiOptions = {
  useMocks: boolean
  /** Fake latency for mock replies, so loading states are visible */
  mockDelayMs?: number
  client?: typeof defaultClient
}

export function createApi({ useMocks, mockDelayMs = 300, client = defaultClient }: ApiOptions) {
  const delay = () => new Promise((resolve) => setTimeout(resolve, mockDelayMs))
  // Mock "database": profiles saved during this page session
  const mockProfiles = new Map<string, Profile>()

  return {
    async signIn(email: string): Promise<User> {
      if (useMocks) {
        await delay()
        // Mimics the backend's 400 for a malformed email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new ApiRequestError(400, 'Enter a valid email address, like you@example.com')
        }
        const existing = findMockUser(mockUserId(email))
        if (existing) return existing
        const user = { id: mockUserId(email), email, createdAt: new Date().toISOString() }
        saveMockUser(user)
        return user
      }
      const { data, error, response } = await client.POST('/users', { body: { email } })
      if (data) return data
      // 409: the email exists, so this is a returning user. Looking them up needs issue #6.
      if (response.status === 409) throw new NotAvailableYetError('Signing in with an existing email')
      throw new ApiRequestError(response.status, error?.message ?? `Server answered ${response.status}`)
    },

    /** Load a signed-in user by id, e.g. after a page reload. Rejects with status 404 if unknown. */
    async getUser(userId: string): Promise<User> {
      if (useMocks) {
        await delay()
        const user = findMockUser(userId)
        if (!user) throw new ApiRequestError(404, 'No such user')
        return user
      }
      const { data, error, response } = await client.GET('/users/{userId}', { params: { path: { userId } } })
      if (data) return data
      throw new ApiRequestError(response.status, error?.message ?? `Server answered ${response.status}`)
    },

    async getProfile(userId: string): Promise<Profile> {
      if (useMocks) {
        await delay()
        return structuredClone(mockProfiles.get(userId) ?? MOCK_PROFILE)
      }
      throw new NotAvailableYetError('Loading a profile')
    },

    async saveProfile(userId: string, profile: Profile): Promise<Profile> {
      if (useMocks) {
        await delay()
        mockProfiles.set(userId, structuredClone(profile))
        return structuredClone(profile)
      }
      throw new NotAvailableYetError('Saving a profile')
    },

    /** Grade of each of the user's beaches at time `at` (ISO date-time), for the map and timeline. */
    async getBeachGrades(_userId: string, at: string): Promise<BeachGrade[]> {
      if (useMocks) {
        await delay()
        return MOCK_BEACHES.map((beach) => ({ beach, ...mockGrade(beach, new Date(at)) }))
      }
      throw new NotAvailableYetError('Beach grades')
    },

    /** Best 2-hour sessions in the next 3 days, best grade first. */
    async getSuggestions(_userId: string, now = new Date()): Promise<Suggestion[]> {
      if (useMocks) {
        await delay()
        return mockSuggestions(now)
      }
      throw new NotAvailableYetError('Suggestions')
    },
  }
}

/** The API the app uses. `pnpm dev:mock` (VITE_USE_MOCKS=true) answers everything with mock data. */
export const api = createApi({ useMocks: import.meta.env.VITE_USE_MOCKS === 'true' })

export type Api = ReturnType<typeof createApi>
