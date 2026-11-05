import { ConflictException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { City, ScheduleEntry, SurfType, User } from './user.schema'

export interface UserProfile {
  surfType: SurfType
  city: City
  maxRadiusKm: number
  schedule: ScheduleEntry[]
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  async create(email: string) {
    try {
      return await this.users.create({ email })
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('A user with this email already exists')
      }
      throw error
    }
  }

  async findById(id: string) {
    return this.users.findById(id).lean().exec()
  }

  async findByEmail(email: string) {
    return this.users.findOne({ email: email.trim().toLowerCase() }).lean().exec()
  }

  async findAll() {
    return this.users.find().lean().exec()
  }

  async updateProfile(id: string, profile: UserProfile) {
    return this.users
      .findByIdAndUpdate(id, { $set: profile }, { runValidators: true, new: true })
      .lean()
      .exec()
  }
}
