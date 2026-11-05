import { Injectable, Logger } from '@nestjs/common'
import { UserBeachesService } from '../user-beaches/user-beaches.service'
import { UsersService } from '../users/users.service'

const EARTH_RADIUS_KM = 6371

interface Point {
  latitude: number
  longitude: number
}

/** The user has no city or no maximum radius yet; the API layer maps this to 422. */
export class IncompleteProfileError extends Error {
  constructor(userId: string) {
    super(`User ${userId} has no city or no maximum radius`)
    this.name = 'IncompleteProfileError'
  }
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User ${userId} not found`)
    this.name = 'UserNotFoundError'
  }
}

/** Straight-line (great-circle) distance in km between two points. */
function haversineKm(a: Point, b: Point): number {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLon = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

@Injectable()
export class RadiusService {
  private readonly logger = new Logger(RadiusService.name)

  constructor(
    private readonly users: UsersService,
    private readonly links: UserBeachesService,
  ) {}

  /** The user's linked beaches within their radius of their city, nearest first. */
  async findBeachesWithinRadius(userId: string) {
    const user = await this.users.findById(userId)
    if (!user) throw new UserNotFoundError(userId)
    const { city, maxRadiusKm } = user
    if (!city || !isNumber(maxRadiusKm)) throw new IncompleteProfileError(userId)

    const beaches = await this.links.findBeachesForUser(userId)
    const result = []
    for (const beach of beaches) {
      if (!isNumber(beach.latitude) || !isNumber(beach.longitude)) {
        this.logger.warn(`Excluding beach "${beach.name}" (${beach._id}): missing coordinates`)
        continue
      }
      const distanceKm = haversineKm(city, beach)
      if (distanceKm <= maxRadiusKm) result.push({ beach, distanceKm: Math.round(distanceKm * 10) / 10 })
    }
    return result.sort((a, b) => a.distanceKm - b.distanceKm)
  }
}
