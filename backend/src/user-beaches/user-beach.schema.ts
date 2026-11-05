import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose'

/** Links one user to one beach (a user has many beaches). */
@Schema({ collection: 'user_beaches' })
export class UserBeach {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Beach', required: true })
  beachId!: Types.ObjectId
}

export const UserBeachSchema = SchemaFactory.createForClass(UserBeach)
UserBeachSchema.index({ userId: 1, beachId: 1 }, { unique: true })
