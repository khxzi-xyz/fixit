import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsNumber, IsString, Min } from 'class-validator';
import { PartsFundingService } from './parts-funding.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

class RequestPartsDto {
  @IsString() description!: string;
  @IsNumber() @Min(0.001) amount!: number;
}
class MarkInstalledDto {
  @IsString() photoUrl!: string;
  @IsString() serial!: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class PartsFundingController {
  constructor(private readonly partsFunding: PartsFundingService) {}

  @Get('jobs/:jobId/parts-funding')
  list(@Param('jobId') jobId: string) {
    return this.partsFunding.listForJob(jobId);
  }

  @Post('jobs/:jobId/parts-funding')
  @Roles('VENDOR')
  request(@Req() req: AuthedRequest, @Param('jobId') jobId: string, @Body() dto: RequestPartsDto) {
    return this.partsFunding.request(jobId, req.user!.sub, dto.description, dto.amount);
  }

  @Post('parts-funding/:requestId/approve')
  @Roles('CONSUMER')
  approve(@Req() req: AuthedRequest, @Param('requestId') requestId: string) {
    return this.partsFunding.approve(requestId, req.user!.sub);
  }

  @Post('parts-funding/:requestId/decline')
  @Roles('CONSUMER')
  decline(@Req() req: AuthedRequest, @Param('requestId') requestId: string) {
    return this.partsFunding.decline(requestId, req.user!.sub);
  }

  @Post('parts-funding/:requestId/installed')
  @Roles('VENDOR')
  installed(@Req() req: AuthedRequest, @Param('requestId') requestId: string, @Body() dto: MarkInstalledDto) {
    return this.partsFunding.markInstalled(requestId, req.user!.sub, dto.photoUrl, dto.serial);
  }
}
