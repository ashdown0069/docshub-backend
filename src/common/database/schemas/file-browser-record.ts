import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({
  timestamps: true,
  _id: false,
})
export class FileBrowserDownloadRecord {
  @Prop({ type: Types.ObjectId })
  fileId: string | Types.ObjectId;

  @Prop()
  name: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  downloader: string | Types.ObjectId;
}

export const FileBrowserDownloadRecordSchema = SchemaFactory.createForClass(
  FileBrowserDownloadRecord,
);
