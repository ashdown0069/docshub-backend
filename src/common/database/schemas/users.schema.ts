import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Workspace } from './workspace.schema';

export type UserDocument = HydratedDocument<User>;

// @Schema({
//   id: false,
// })
// export class joinedWorkspace {
//   @Prop({
//     type: MongooseSchema.Types.ObjectId,
//     ref: 'Workspace',
//     required: true,
//   })
//   workspace: Workspace | Types.ObjectId;

//   @Prop({ type: Boolean, default: false })
//   isBookmarked: boolean;
// }

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  nickname: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'free' })
  plan: 'free' | 'team' | 'enterprise';

  @Prop({ default: 0 })
  createdWorkspaceCount: number;

  @Prop({ type: String })
  dbRefreshToken: string | null;

  @Prop({ type: Date, default: null })
  isDeleted: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

export interface UserTypes extends User {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
