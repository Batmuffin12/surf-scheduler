import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Beach } from './beach.schema'

export interface BeachData {
  name: string
  latitude: number
  longitude: number
  facingDegrees: number
}

@Injectable()
export class BeachesService {
  constructor(@InjectModel(Beach.name) private readonly beaches: Model<Beach>) {}

  async insertMany(data: BeachData[]) {
    return this.beaches.insertMany(data)
  }

  /** Inserts the beach, or updates the existing one with the same name. */
  async upsertByName(data: BeachData) {
    return this.beaches
      .findOneAndUpdate({ name: data.name }, { $set: data }, { upsert: true, new: true })
      .exec()
  }

  async findByIds(ids: string[]) {
    return this.beaches
      .find({ _id: { $in: ids } })
      .sort({ _id: 1 })
      .lean()
      .exec()
  }

  async findAll() {
    return this.beaches.find().sort({ _id: 1 }).lean().exec()
  }
}
