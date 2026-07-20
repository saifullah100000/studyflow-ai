import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('pdf')
export class PdfController {

  constructor(
    private readonly pdfService: PdfService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate/:noteId')
  async generatePdf(
    @Param('noteId') noteId: string,
    @Req() req: AuthenticatedRequest,
  ) {

    const userId = req.user.sub;

    return this.pdfService.generateForNote(
      userId,
      noteId,
    );
  }
}