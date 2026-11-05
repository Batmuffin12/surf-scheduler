import { BeachesModule } from '../beaches/beaches.module'
import { BeachesService } from '../beaches/beaches.service'
import { beachFixtures } from '../beaches/beach.fixtures'
import { UserBeachesModule } from '../user-beaches/user-beaches.module'
import { UserBeachesService } from '../user-beaches/user-beaches.service'
import { UsersModule } from '../users/users.module'
import { UsersService } from '../users/users.service'
import { SeedModule } from './seed.module'
import { SeedService } from './seed.service'
import { startTestDatabase, TestDatabase } from './test-database'

describe('SeedService', () => {
  let db: TestDatabase
  let users: UsersService
  let beaches: BeachesService
  let links: UserBeachesService
  let seed: SeedService

  beforeAll(async () => {
    db = await startTestDatabase([UsersModule, BeachesModule, UserBeachesModule, SeedModule])
    users = db.module.get(UsersService)
    beaches = db.module.get(BeachesService)
    links = db.module.get(UserBeachesService)
    seed = db.module.get(SeedService)
  })
  afterAll(() => db.stop())
  beforeEach(() => db.clear())

  it('inserts the beaches and links all of them to every user', async () => {
    const first = await users.create('first@example.com')
    const second = await users.create('second@example.com')

    await seed.run(beachFixtures)

    const expected = ['Gordon Beach', 'Hilton Beach', 'Herzliya Marina']
    expect((await links.findBeachesForUser(first.id)).map((b) => b.name)).toEqual(expected)
    expect((await links.findBeachesForUser(second.id)).map((b) => b.name)).toEqual(expected)
  })

  it('can run again without duplicating beaches or links', async () => {
    const user = await users.create('first@example.com')

    await seed.run(beachFixtures)
    await seed.run(beachFixtures)

    expect(await beaches.findAll()).toHaveLength(3)
    expect(await links.findBeachesForUser(user.id)).toHaveLength(3)
  })
})
