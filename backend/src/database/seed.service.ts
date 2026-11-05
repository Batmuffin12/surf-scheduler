import { Injectable } from '@nestjs/common'
import { BeachData, BeachesService } from '../beaches/beaches.service'
import { UserBeachesService } from '../user-beaches/user-beaches.service'
import { UsersService } from '../users/users.service'

@Injectable()
export class SeedService {
  constructor(
    private readonly users: UsersService,
    private readonly beaches: BeachesService,
    private readonly links: UserBeachesService,
  ) {}

  async run(beachData: BeachData[]) {
    const inserted = []
    for (const data of beachData) inserted.push(await this.beaches.upsertByName(data))
    const users = await this.users.findAll()
    for (const user of users) {
      for (const beach of inserted) {
        await this.links.link(user._id.toString(), beach.id)
      }
    }
  }
}
