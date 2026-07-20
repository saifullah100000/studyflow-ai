import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    StorageModule,
    PrismaModule,
  ],
  controllers: [
    PdfController,
  ],
  providers: [
    PdfService,
  ],
  exports: [
    PdfService,
  ],
})
export class PdfModule {}