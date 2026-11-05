import { Module } from '@nestjs/common'
import { UserBeachesModule } from '../user-beaches/user-beaches.module'
import { UsersModule } from '../users/users.module'
import { RadiusService } from './radius.service'

@Module({
  imports: [UsersModule, UserBeachesModule],
  providers: [RadiusService],
  exports: [RadiusService],
})
export class RadiusModule {}
