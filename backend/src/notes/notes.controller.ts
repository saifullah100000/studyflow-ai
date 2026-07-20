import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateNoteDto } from './dto/create-note.dto';
import { ListNotesQueryDto } from './dto/list-notes-query.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';
import { PdfService } from '../pdf/pdf.service';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.notesService.create(request.user.sub, createNoteDto);
  }

  @Post(':id/generate-pdf')
  async generatePdf(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) noteId: string,
    @Res() response: Response,
  ): Promise<void> {
    const pdf = await this.pdfService.generateForNote(request.user.sub, noteId);

    response
      .status(HttpStatus.OK)
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdf.filename}"`,
        'Content-Length': String(pdf.buffer.byteLength),
      })
      .send(Buffer.from(pdf.buffer));
  }

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListNotesQueryDto,
  ) {
    return this.notesService.findAll(request.user.sub, query);
  }

  @Get(':id')
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) noteId: string,
  ) {
    return this.notesService.findOne(request.user.sub, noteId);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) noteId: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    return this.notesService.update(request.user.sub, noteId, updateNoteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) noteId: string,
  ): Promise<void> {
    await this.notesService.remove(request.user.sub, noteId);
  }
}
