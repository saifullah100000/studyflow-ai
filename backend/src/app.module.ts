import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { GenerationsModule } from './generations/generations.module';
import { NotesModule } from './notes/notes.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),

    PrismaModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    NotesModule,
    GenerationsModule,
    ProfileModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
