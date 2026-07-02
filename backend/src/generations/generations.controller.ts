import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateGenerationDto } from './dto/create-generation.dto';
import { GenerationsService } from './generations.service';
@Controller('generations')
@UseGuards(JwtAuthGuard)
export class GenerationsController {
  constructor(private readonly generationsService: GenerationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createGenerationDto: CreateGenerationDto,
  ) {
    return this.generationsService.create(
      request.user.sub,
      createGenerationDto,
    );
  }
}
