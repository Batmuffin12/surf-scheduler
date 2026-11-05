import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Beach, BeachSchema } from './beach.schema'
import { BeachesService } from './beaches.service'

@Module({
  imports: [MongooseModule.forFeature([{ name: Beach.name, schema: BeachSchema }])],
  providers: [BeachesService],
  exports: [BeachesService],
})
export class BeachesModule {}
