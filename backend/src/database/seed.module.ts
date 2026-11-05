import { Module } from '@nestjs/common'
import { BeachesModule } from '../beaches/beaches.module'
import { UserBeachesModule } from '../user-beaches/user-beaches.module'
import { UsersModule } from '../users/users.module'
import { SeedService } from './seed.service'

@Module({
  imports: [UsersModule, BeachesModule, UserBeachesModule],
  providers: [SeedService],
})
export class SeedModule {}
