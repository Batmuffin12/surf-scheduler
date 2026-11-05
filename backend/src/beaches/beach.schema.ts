import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

@Schema({ collection: 'beaches' })
export class Beach {
  @Prop({ required: true })
  name!: string

  @Prop({ required: true })
  latitude!: number

  @Prop({ required: true })
  longitude!: number

  /** Compass bearing (0-360) the beach faces seaward; used to judge wind direction. */
  @Prop({ required: true, min: 0, max: 360 })
  facingDegrees!: number
}

export type BeachDocument = HydratedDocument<Beach>
export const BeachSchema = SchemaFactory.createForClass(Beach)
