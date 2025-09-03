import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from './users.schema';
import { WorkspaceRole } from './workspace-role.schema';

export type WorkspaceDocument = HydratedDocument<Workspace>;

@Schema({
  timestamps: true,
})
export class Workspace {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String })
  description: string | null;

  @Prop()
  isLocked: boolean;

  @Prop({ type: String })
  password: string | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  owner: User | Types.ObjectId;

  @Prop({ default: 1 })
  membersCount: number;

  @Prop({
    enum: [10, 30, 9999],
  })
  capacity: number;

  @Prop({ default: 0 })
  currentStorage: number;

  //1073741824 = 1GB
  @Prop({ default: 1073741824 })
  maxStorage: number;

  @Prop({ type: Date, default: null })
  isDeleted: Date | null;

  @Prop({ default: false })
  enableDownloadTracking: boolean;

  @Prop({
    type: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        createdAt: { type: Date, required: true },
      },
    ],
    default: [],
  })
  announcements: { title: string; description: string; createdAt: Date }[];
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
export interface WorkspaceTypes extends Workspace {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
