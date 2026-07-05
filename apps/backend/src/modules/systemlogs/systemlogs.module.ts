import { Module } from '@nestjs/common';
import { SystemLogsController } from './systemlogs.controller';
import { SystemLogsService } from './systemlogs.service';

@Module({
  controllers: [SystemLogsController],
  providers: [SystemLogsService],
})
export class SystemLogsModule {}
