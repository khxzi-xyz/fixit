import { Controller, Get, Logger } from '@nestjs/common';
import { TranslationService } from './translation.service';

@Controller('translation')
export class TranslationController {
  private readonly logger = new Logger(TranslationController.name);

  constructor(private readonly translationService: TranslationService) {}

  @Get('dictionary')
  async getDictionary() {
    return this.translationService.getDictionary();
  }
}
