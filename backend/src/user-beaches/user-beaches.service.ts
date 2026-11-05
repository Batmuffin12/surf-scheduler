import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { BeachesService } from '../beaches/beaches.service'
import { UserBeach } from './user-beach.schema'

@Injectable()
export class UserBeachesService {
  constructor(
    @InjectModel(UserBeach.name) private readonly links: Model<UserBeach>,
    private readonly beaches: BeachesService,
  ) {}

  async link(userId: string, beachId: string) {
    await this.links.updateOne({ userId, beachId }, { $setOnInsert: { userId, beachId } }, { upsert: true }).exec()
  }

  async findBeachesForUser(userId: string) {
    const links = await this.links.find({ userId }).lean().exec()
    return this.beaches.findByIds(links.map((l) => l.beachId.toString()))
  }
}
