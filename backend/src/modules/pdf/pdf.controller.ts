import { Controller, Get, Param, UseGuards, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import { PdfService } from './pdf.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('pdf')
@UseGuards(AuthGuard, RolesGuard)
export class PdfController {
  constructor(private pdfService: PdfService) {}

  @Get('invoices/:id')
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE, UserRole.COMMERCIAL)
  async generateInvoice(@Param('id') id: string, @Res() res: Response) {
    try {
      const { filePath, hash } = await this.pdfService.generateInvoice(id);

      // Vérifier si le fichier existe
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException('Erreur lors de la génération du PDF');
      }

      // Envoyer le fichier
      res.download(filePath, `facture-${id}.pdf`, (err) => {
        if (err) {
          // Gérer l'erreur si nécessaire
        }
      });
    } catch (error) {
      throw new BadRequestException(error.message || 'Erreur lors de la génération du PDF');
    }
  }

  @Get('credit-notes/:id')
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE)
  async generateCreditNote(@Param('id') id: string, @Res() res: Response) {
    try {
      const { filePath, hash } = await this.pdfService.generateCreditNote(id);

      if (!fs.existsSync(filePath)) {
        throw new BadRequestException('Erreur lors de la génération du PDF');
      }

      res.download(filePath, `avoir-${id}.pdf`);
    } catch (error) {
      throw new BadRequestException(error.message || 'Erreur lors de la génération de l\'avoir');
    }
  }
}
