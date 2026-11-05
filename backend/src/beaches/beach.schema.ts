import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import type { Forecast } from '../adapters/forecast/forecast-provider'

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

  /** Latest forecast stored by the forecast sync; the beach collection is the forecast cache. */
  @Prop({ type: Object })
  forecast?: Forecast

  /** When `forecast` was last refreshed. */
  @Prop()
  forecastUpdatedAt?: Date
}

export type BeachDocument = HydratedDocument<Beach>
export const BeachSchema = SchemaFactory.createForClass(Beach)
