import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SystemLogsService {
  private readonly logger = new Logger(SystemLogsService.name);

  async logError(errorData: any) {
    // In a real application, this would save the error to the database or an external logging service
    this.logger.error(`[TELEMETRY] ${JSON.stringify(errorData)}`);
    return { success: true };
  }
}
