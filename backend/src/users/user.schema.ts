import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export const SURF_TYPES = ['SUP', 'WAVE', 'BOTH'] as const
export type SurfType = (typeof SURF_TYPES)[number]

export const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const
export type Weekday = (typeof WEEKDAYS)[number]

/** The user's chosen city: the anchor point for the maximum radius. */
@Schema({ _id: false })
export class City {
  @Prop({ required: true })
  name!: string

  @Prop({ required: true })
  latitude!: number

  @Prop({ required: true })
  longitude!: number
}

/** One weekday of the work schedule. A day off has no times. Times are Asia/Jerusalem "HH:mm". */
@Schema({ _id: false })
export class ScheduleEntry {
  @Prop({ required: true, enum: WEEKDAYS })
  day!: Weekday

  @Prop({ required: true })
  dayOff!: boolean

  @Prop()
  start?: string

  @Prop()
  end?: string

  @Prop({ min: 0 })
  flexHours?: number
}

@Schema({ collection: 'users', timestamps: { createdAt: true, updatedAt: false } })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string

  @Prop({ enum: SURF_TYPES })
  surfType?: SurfType

  @Prop({ type: SchemaFactory.createForClass(City) })
  city?: City

  @Prop({ min: 0 })
  maxRadiusKm?: number

  @Prop({ type: [SchemaFactory.createForClass(ScheduleEntry)], default: undefined })
  schedule?: ScheduleEntry[]

  createdAt!: Date
}

export type UserDocument = HydratedDocument<User>
export const UserSchema = SchemaFactory.createForClass(User)
