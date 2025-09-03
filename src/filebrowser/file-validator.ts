import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { extname } from 'path';

export function getFileValidator(): PipeTransform {
  return new ParseFilePipeDocument();
}

@Injectable()
export class ParseFilePipeDocument implements PipeTransform {
  private readonly allowedExtensions = [
    '.doc',
    '.docx',
    '.ppt',
    '.pptx',
    '.pdf',
    '.csv',
    '.txt',
    '.xls',
    '.xlsx',
  ];

  transform(values: Express.Multer.File[]): Express.Multer.File[] {
    if (!values || !Array.isArray(values)) {
      throw new BadRequestException({
        message: 'No file uploaded',
        key: 'noFile',
      });
    }

    values.forEach((file) => {
      const extension = extname(file.originalname);
      if (!this.allowedExtensions.includes(extension)) {
        throw new BadRequestException({
          message: `File type ${extension} not supported`,
          key: 'invalidFileType',
        });
      }
    });

    return values;
  }
}
