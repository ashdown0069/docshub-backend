import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from './users.schema';
@Schema({
  timestamps: true,
})
export class Item {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, required: true })
  fileSize: number;

  @Prop({
    type: String,
    enum: ['File', 'Folder'],
    required: true,
  })
  itemType: 'File' | 'Folder';

  @Prop({
    type: Date,
    default: null,
  })
  isDeleted: Date | null;

  //for file type
  @Prop({
    sparse: true,
  })
  fileExtension: string;
  @Prop({ type: String, sparse: true })
  src: string | null;
  @Prop({
    type: Boolean,
    sparse: true,
  }) //if the file is locked, only owner and managers can download file
  isLocked: boolean;
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    sparse: true,
  }) //file uploader only
  uploader: User | Types.ObjectId | null;

  //materialized path
  @Prop({ type: String, default: '/' })
  path: string;
  @Prop({ type: Number, default: 0 })
  depth: number;
  @Prop({
    type: Types.ObjectId,
    default: null,
  })
  parentId: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

export const BrowserItemSchema = SchemaFactory.createForClass(Item);
