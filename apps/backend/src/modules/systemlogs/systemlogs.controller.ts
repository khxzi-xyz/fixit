import { Controller, Post, Body, Logger } from '@nestjs/common';
import { SystemLogsService } from './systemlogs.service';

@Controller('admin/system-logs')
export class SystemLogsController {
  private readonly logger = new Logger(SystemLogsController.name);

  constructor(private readonly systemLogsService: SystemLogsService) {}

  @Post('report-error')
  async reportError(@Body() body: any) {
    this.logger.warn(`Received client telemetry error: ${JSON.stringify(body)}`);
    return this.systemLogsService.logError(body);
  }
}
