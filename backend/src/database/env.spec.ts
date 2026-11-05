import { validateEnv } from './env'

describe('validateEnv', () => {
  it('accepts a config with a MongoDB connection string', () => {
    const env = validateEnv({ MONGODB_URI: 'mongodb://surf:secret@localhost:27017/surf?authSource=admin' })

    expect(env.MONGODB_URI).toBe('mongodb://surf:secret@localhost:27017/surf?authSource=admin')
  })

  it('rejects a config without MONGODB_URI', () => {
    expect(() => validateEnv({})).toThrow('MONGODB_URI')
  })

  it('rejects a MONGODB_URI that is not a mongodb connection string', () => {
    expect(() => validateEnv({ MONGODB_URI: 'http://localhost' })).toThrow('MONGODB_URI')
  })
})
