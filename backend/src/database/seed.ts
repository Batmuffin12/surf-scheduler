import { NestFactory } from '@nestjs/core'
import { Module } from '@nestjs/common'
import { beachFixtures } from '../beaches/beach.fixtures'
import { DatabaseModule } from './database.module'
import { SeedModule } from './seed.module'
import { SeedService } from './seed.service'

@Module({ imports: [DatabaseModule, SeedModule] })
class SeedAppModule {}

async function main() {
  const app = await NestFactory.createApplicationContext(SeedAppModule)
  await app.get(SeedService).run(beachFixtures)
  await app.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
