import { Logger } from '@nestjs/common'
import { IncompleteProfileError, RadiusService, UserNotFoundError } from './radius.service'

// Independently known: London to Paris is about 343.6 km in a straight line (great circle).
const london = { name: 'London', latitude: 51.5074, longitude: -0.1278 }
const paris = { _id: 'b1', name: 'Paris Plage', latitude: 48.8566, longitude: 2.3522, facingDegrees: 270 }

function build(user: object | null, beaches: object[]) {
  const users = { findById: jest.fn().mockResolvedValue(user) }
  const links = { findBeachesForUser: jest.fn().mockResolvedValue(beaches) }
  const service = new RadiusService(users as never, links as never)
  return { service }
}

describe('RadiusService', () => {
  it('returns a linked beach inside the radius with its distance in km', async () => {
    const { service } = build({ city: london, maxRadiusKm: 400 }, [paris])

    const result = await service.findBeachesWithinRadius('u1')

    expect(result).toEqual([{ beach: paris, distanceKm: 343.6 }])
  })

  it('excludes beaches with missing coordinates and logs each one', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation()
    const noLat = { _id: 'b2', name: 'No Lat Beach', longitude: 2.3522 }
    const nullLon = { _id: 'b3', name: 'Null Lon Beach', latitude: 48.8566, longitude: null }
    const { service } = build({ city: london, maxRadiusKm: 400 }, [noLat, paris, nullLon])

    const result = await service.findBeachesWithinRadius('u1')

    expect(result).toEqual([{ beach: paris, distanceKm: 343.6 }])
    expect(warn).toHaveBeenCalledTimes(2)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No Lat Beach'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Null Lon Beach'))
    warn.mockRestore()
  })

  it.each([
    ['no city', { maxRadiusKm: 400 }],
    ['no radius', { city: london }],
  ])('throws IncompleteProfileError for a user with %s', async (_label, user) => {
    const { service } = build(user, [paris])

    await expect(service.findBeachesWithinRadius('u1')).rejects.toThrow(IncompleteProfileError)
  })

  it('throws UserNotFoundError for an unknown user', async () => {
    const { service } = build(null, [paris])

    await expect(service.findBeachesWithinRadius('u1')).rejects.toThrow(UserNotFoundError)
  })

  it('orders beaches nearest first', async () => {
    // One degree of latitude due north is about 111.2 km.
    const north = { _id: 'b4', name: 'North Beach', latitude: 52.5074, longitude: -0.1278, facingDegrees: 90 }
    const { service } = build({ city: london, maxRadiusKm: 400 }, [paris, north])

    const result = await service.findBeachesWithinRadius('u1')

    expect(result.map((r) => [r.beach.name, r.distanceKm])).toEqual([
      ['North Beach', 111.2],
      ['Paris Plage', 343.6],
    ])
  })

  it('excludes beaches farther than the radius', async () => {
    const { service } = build({ city: london, maxRadiusKm: 300 }, [paris])

    expect(await service.findBeachesWithinRadius('u1')).toEqual([])
  })
})
