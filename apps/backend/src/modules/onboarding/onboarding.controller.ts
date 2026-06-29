import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

class DocDto {
  @IsIn(['NATIONAL_ID', 'PASSPORT', 'COMMERCIAL_REGISTRATION', 'TRADE_LICENSE', 'INSURANCE', 'OTHER']) documentType!: string;
  @IsString() dataUrl!: string;
}
class ResolveDto { @IsIn(['APPROVE', 'REJECT']) decision!: string; @IsOptional() @IsString() reason?: string; }
class AddrDto { @IsString() label!: string; @IsOptional() @IsNumber() lat?: number; @IsOptional() @IsNumber() lng?: number; @IsOptional() @IsString() details?: string; }
class TicketDto { @IsString() subject!: string; @IsOptional() @IsString() body?: string; }
class ReplyDto { @IsString() reply!: string; }

@Controller()
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly svc: OnboardingService) {}

  // KYC (vendor)
  @Post('vendor/kyc/document') @Roles('VENDOR')
  upload(@Req() r: AuthedRequest, @Body() d: DocDto) { return this.svc.uploadDocument(r.user!.sub, d.documentType, d.dataUrl); }
  @Get('vendor/kyc/documents') @Roles('VENDOR')
  myDocs(@Req() r: AuthedRequest) { return this.svc.myDocuments(r.user!.sub); }
  @Post('vendor/kyc/submit') @Roles('VENDOR')
  submit(@Req() r: AuthedRequest) { return this.svc.submitForReview(r.user!.sub); }

  // KYC (admin)
  @Get('admin/kyc') @Roles('ADMIN')
  queue() { return this.svc.kycQueue(); }
  @Post('admin/kyc/:documentId') @Roles('ADMIN')
  resolve(@Req() r: AuthedRequest, @Param('documentId') id: string, @Body() d: ResolveDto) {
    return this.svc.resolveDocument(id, r.user!.sub, d.decision === 'APPROVE', d.reason);
  }

  // Addresses
  @Get('addresses') addresses(@Req() r: AuthedRequest) { return this.svc.addresses(r.user!.sub); }
  @Post('addresses') addAddr(@Req() r: AuthedRequest, @Body() d: AddrDto) { return this.svc.addAddress(r.user!.sub, d.label, d.lat, d.lng, d.details); }
  @Delete('addresses/:id') delAddr(@Req() r: AuthedRequest, @Param('id') id: string) { return this.svc.deleteAddress(r.user!.sub, id); }

  // Support
  @Get('support/tickets') tickets(@Req() r: AuthedRequest) { return this.svc.myTickets(r.user!.sub); }
  @Post('support/tickets') createTicket(@Req() r: AuthedRequest, @Body() d: TicketDto) { return this.svc.createTicket(r.user!.sub, d.subject, d.body); }
  @Get('admin/support') @Roles('ADMIN') supportQueue() { return this.svc.ticketQueue(); }
  @Post('admin/support/:id') @Roles('ADMIN') reply(@Param('id') id: string, @Body() d: ReplyDto) { return this.svc.replyTicket(id, d.reply); }
}
