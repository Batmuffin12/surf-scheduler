import { BeachesModule } from '../beaches/beaches.module'
import { BeachesService } from '../beaches/beaches.service'
import { beachFixtures } from '../beaches/beach.fixtures'
import { UsersModule } from '../users/users.module'
import { UsersService } from '../users/users.service'
import { startTestDatabase, TestDatabase } from '../database/test-database'
import { UserBeachesModule } from './user-beaches.module'
import { UserBeachesService } from './user-beaches.service'

describe('UserBeachesService', () => {
  let db: TestDatabase
  let users: UsersService
  let beaches: BeachesService
  let links: UserBeachesService

  beforeAll(async () => {
    db = await startTestDatabase([UsersModule, BeachesModule, UserBeachesModule])
    users = db.module.get(UsersService)
    beaches = db.module.get(BeachesService)
    links = db.module.get(UserBeachesService)
  })
  afterAll(() => db.stop())
  beforeEach(() => db.clear())

  it('lists only the beaches linked to the user', async () => {
    const user = await users.create('surfer@example.com')
    const other = await users.create('other@example.com')
    const [gordon, hilton, herzliya] = await beaches.insertMany(beachFixtures)
    await links.link(user.id, gordon.id)
    await links.link(user.id, herzliya.id)
    await links.link(other.id, hilton.id)

    const linked = await links.findBeachesForUser(user.id)

    expect(linked.map((b) => b.name)).toEqual(['Gordon Beach', 'Herzliya Marina'])
  })
})
