import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { JWT_User } from 'src/types/authPayload';
import { Request } from 'express';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { FindBookmarkDto } from './dto/AllBookmark.dto';
import { AddBookmarkDto } from './dto/bookmark.dto';

@Controller('bookmark')
@UseGuards(JwtAuthGuard)
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post()
  async add(@Body() body: AddBookmarkDto, @Req() req: Request) {
    const { id } = req.user as JWT_User;
    return await this.bookmarkService.create(body.workspaceId, id);
  }

  @Serialize(FindBookmarkDto)
  @Get()
  async findAllBookmarks(@Req() req: Request) {
    const { id } = req.user as JWT_User;
    const result = await this.bookmarkService.findAll(id);
    return result;
  }

  @Delete(':id')
  async remove(
    @Param('id') workspaceId: string,
    @Req() req: Request,
  ): Promise<{ isSuccess: boolean }> {
    const { id: userId } = req.user as JWT_User;
    return await this.bookmarkService.remove(workspaceId, userId);
  }
}
