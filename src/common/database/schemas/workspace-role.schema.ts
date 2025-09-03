import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type WorkspaceRoleDocument = HydratedDocument<WorkspaceRole>;

//for file browser
//admin, manager, member
@Schema({
  timestamps: true,
})
export class WorkspaceRole {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  })
  workspace: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  owner: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['owner', 'manager', 'member'],
    required: true,
  })
  role: 'owner' | 'manager' | 'member';

  //owner가 manager에게 권한 줄지 선택
  @Prop({
    required: true,
  })
  canRemoveMembers: boolean;

  //true일 경우 멤버의 경우 밑의 값 매니저가 변경가능
  @Prop({
    required: true,
  })
  canManage: boolean;

  @Prop({
    required: true,
  })
  canDownload: boolean;

  @Prop({
    required: true,
  })
  canUpload: boolean;

  @Prop({
    required: true,
  })
  canRename: boolean;

  @Prop({
    required: true,
  })
  canShare: boolean;

  @Prop({
    required: true,
  })
  canDelete: boolean;

  @Prop({
    required: true,
  })
  canLock: boolean;

  @Prop({
    required: true,
  })
  canMove: boolean;
}

export const WorkspaceRoleSchema = SchemaFactory.createForClass(WorkspaceRole);
