import createClient, { type ClientOptions } from 'openapi-fetch'
import type { components, paths } from './schema'

// Types are generated from docs/openapi.yaml. After the contract changes, run `pnpm api:types`.
export type User = components['schemas']['User']
export type ApiError = components['schemas']['Error']

export function createApiClient(options: ClientOptions = {}) {
  // In dev, Vite forwards /api to the backend on localhost:3000
  return createClient<paths>({ baseUrl: '/api', ...options })
}

export const apiClient = createApiClient()
