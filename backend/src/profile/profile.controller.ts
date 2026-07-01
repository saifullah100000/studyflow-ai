import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import type { PublicUser } from '../users/users.service';
import { UsersService } from '../users/users.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() request: AuthenticatedRequest): Promise<PublicUser> {
    const user = await this.usersService.findPublicById(request.user.sub);

    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    return user;
  }
}
