import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { FilebrowserModule } from './filebrowser/filebrowser.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { JwtModule } from '@nestjs/jwt';
import { BookmarkModule } from './workspaces/workspace-membership/bookmark/bookmark.module';
import { MongooseCommonModule } from './common/database/mongooseCommon.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    MongooseCommonModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_KEY'),
        signOptions: {
          expiresIn: '1d',
        },
      }),
    }),
    UsersModule,
    FilebrowserModule,
    WorkspacesModule,
    BookmarkModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
      }),
    },
  ],
})
export class AppModule {}
