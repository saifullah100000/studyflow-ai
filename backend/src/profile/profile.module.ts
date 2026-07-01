import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ProfileController } from './profile.controller';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ProfileController],
})
export class ProfileModule {}
