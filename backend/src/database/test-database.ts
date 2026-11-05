import { Test, TestingModule } from '@nestjs/testing'
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Connection } from 'mongoose'

export interface TestDatabase {
  module: TestingModule
  stop(): Promise<void>
  clear(): Promise<void>
}

export async function startTestDatabase(imports: unknown[]): Promise<TestDatabase> {
  const mongod = await MongoMemoryServer.create({ binary: { version: '7.0.14' } })
  const module = await Test.createTestingModule({
    imports: [MongooseModule.forRoot(mongod.getUri()), ...(imports as [])],
  }).compile()
  await module.init()
  const connection = module.get<Connection>(getConnectionToken())
  return {
    module,
    clear: async () => {
      await Promise.all(Object.values(connection.collections).map((c) => c.deleteMany({})))
    },
    stop: async () => {
      await module.close()
      await mongod.stop()
    },
  }
}
