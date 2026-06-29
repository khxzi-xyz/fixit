import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { BountyService } from './bounty.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

class OfferDto {
  @IsIn(['ACCEPT', 'COUNTER']) move!: 'ACCEPT' | 'COUNTER';
  @IsOptional() @IsNumber() price?: number;
}
class AcceptCounterDto {
  @IsString() offerId!: string;
}

@Controller()
export class BountyController {
  constructor(private readonly bounty: BountyService) {}

  @Get('vendors/bid-tokens')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  tokens(@Req() req: AuthedRequest) {
    return this.bounty.ensureTokens(req.user!.sub).then((count) => ({ tokens: count }));
  }

  @Get('jobs/:jobId/bounty-offers')
  @UseGuards(JwtAuthGuard)
  listOffers(@Param('jobId') jobId: string) {
    return this.bounty.listOffers(jobId);
  }

  @Post('jobs/:jobId/bounty-offers')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  makeOffer(@Req() req: AuthedRequest, @Param('jobId') jobId: string, @Body() dto: OfferDto) {
    return this.bounty.makeOffer(req.user!.sub, jobId, dto.move, dto.price);
  }

  @Post('jobs/:jobId/bounty-offers/accept')
  @UseGuards(JwtAuthGuard)
  @Roles('CONSUMER')
  acceptCounter(@Req() req: AuthedRequest, @Param('jobId') jobId: string, @Body() dto: AcceptCounterDto) {
    return this.bounty.acceptCounter(req.user!.sub, jobId, dto.offerId);
  }
}
