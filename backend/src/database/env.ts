export interface Env {
  MONGODB_URI: string
}

/** Validation schema for @nestjs/config: fails fast at startup on a bad environment. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const uri = raw.MONGODB_URI
  if (typeof uri !== 'string' || !/^mongodb(\+srv)?:\/\//.test(uri)) {
    throw new Error('MONGODB_URI is required and must be a mongodb:// or mongodb+srv:// connection string')
  }
  return { MONGODB_URI: uri }
}
