import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types, HydratedDocument } from 'mongoose';
import { Workspace } from './workspace.schema';
import { BrowserItemSchema, Item } from './file-browser-item.schema';
import {
  FileBrowserDownloadRecord,
  FileBrowserDownloadRecordSchema,
} from './file-browser-record';

@Schema({
  timestamps: true,
})
export class FileBrowser {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  })
  workspace: Types.ObjectId | Workspace;

  @Prop()
  enableDownloadRecord: boolean;

  @Prop({
    type: [FileBrowserDownloadRecordSchema],
    default: [],
  })
  downloadRecord: FileBrowserDownloadRecord[];

  @Prop({
    type: [BrowserItemSchema],
    default: [],
  })
  browser: Item[];
}

export type FileBrowserOverride = {
  browser: Types.DocumentArray<Item>;
};

export const FileBrowserSchema = SchemaFactory.createForClass(FileBrowser);
export type FileBrowserDocument = HydratedDocument<
  FileBrowser,
  FileBrowserOverride
>;
