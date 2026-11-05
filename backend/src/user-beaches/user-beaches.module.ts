import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { BeachesModule } from '../beaches/beaches.module'
import { UserBeach, UserBeachSchema } from './user-beach.schema'
import { UserBeachesService } from './user-beaches.service'

@Module({
  imports: [MongooseModule.forFeature([{ name: UserBeach.name, schema: UserBeachSchema }]), BeachesModule],
  providers: [UserBeachesService],
  exports: [UserBeachesService],
})
export class UserBeachesModule {}
