import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MarketplaceService } from './marketplace.service';
import { HighTicketService } from './highticket.service';
import { DiagnosticsService } from './diagnostics.service';
import { JunkService } from './junk.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

// --- Goods (Module 19) ------------------------------------------------------
class CreateListingDto {
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) photos?: string[];
  @IsOptional() @IsString() categoryLabel?: string;
  @IsIn(['FIXED', 'AUCTION']) saleKind!: 'FIXED' | 'AUCTION';
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsNumber() startingBid?: number;
  @IsOptional() @IsNumber() auctionHours?: number;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
}
class BidDto { @IsNumber() @Min(0) amount!: number; }
class HandoffDto { @IsString() handoffCode!: string; }

// --- High-ticket (Module 20) ------------------------------------------------
class CreateHighTicketDto {
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) photos?: string[];
  @IsIn(['VEHICLE', 'ELECTRONICS', 'PROPERTY', 'OTHER']) itemClass!: 'VEHICLE' | 'ELECTRONICS' | 'PROPERTY' | 'OTHER';
  @IsNumber() askingPrice!: number;
}
class HighTicketOfferDto {
  @IsNumber() amount!: number;
  @IsIn(['BUYER', 'SELLER']) party!: 'BUYER' | 'SELLER';
}

// --- Diagnostics (Module 18) ------------------------------------------------
class BuyPassDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() description?: string;
}
class VisitDto {
  @IsIn(['CANNOT_DIAGNOSE', 'DIAGNOSED']) outcome!: 'CANNOT_DIAGNOSE' | 'DIAGNOSED';
  @IsOptional() @IsString() note?: string;
}
class QuoteDto { @IsNumber() totalPrice!: number; }

// --- Junk (Module 22) -------------------------------------------------------
class CreateJunkDto {
  @IsString() title!: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
}
class JunkBidDto {
  @IsNumber() @Min(0) amount!: number;
  @IsOptional() @IsString() pickupEta?: string;
}
class AcceptBidDto { @IsString() bidId!: string; }
class PickupDto { @IsString() pickupCode!: string; }

@Controller()
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
  constructor(
    private readonly goods: MarketplaceService,
    private readonly highTicket: HighTicketService,
    private readonly diagnostics: DiagnosticsService,
    private readonly junk: JunkService,
  ) {}

  // --- Goods ---------------------------------------------------------------
  @Post('marketplace/listings')
  createListing(@Req() req: AuthedRequest, @Body() dto: CreateListingDto) {
    return this.goods.create(req.user!.sub, dto);
  }
  @Get('marketplace/listings')
  listListings(@Query('status') status?: string) {
    return this.goods.list(status ?? 'ACTIVE');
  }
  @Get('marketplace/listings/:id')
  getListing(@Param('id') id: string) {
    return this.goods.get(id);
  }
  @Post('marketplace/listings/:id/buy')
  buyNow(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.goods.buyNow(req.user!.sub, id);
  }
  @Post('marketplace/listings/:id/bid')
  bidGoods(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: BidDto) {
    return this.goods.placeBid(req.user!.sub, id, dto.amount);
  }
  @Post('marketplace/listings/:id/close')
  closeAuction(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.goods.closeAuction(id, req.user!.sub);
  }
  @Post('marketplace/listings/:id/handoff')
  handoff(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: HandoffDto) {
    return this.goods.confirmHandoff(req.user!.sub, id, dto.handoffCode);
  }

  // --- High-ticket ---------------------------------------------------------
  @Post('high-ticket/listings')
  createHT(@Req() req: AuthedRequest, @Body() dto: CreateHighTicketDto) {
    return this.highTicket.create(req.user!.sub, dto);
  }
  @Get('high-ticket/listings')
  listHT() {
    return this.highTicket.list();
  }
  @Get('high-ticket/listings/:id')
  getHT(@Param('id') id: string) {
    return this.highTicket.get(id);
  }
  @Post('high-ticket/listings/:id/offer')
  offerHT(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: HighTicketOfferDto) {
    return this.highTicket.makeOffer(req.user!.sub, id, dto.amount, dto.party);
  }
  @Post('high-ticket/offers/:offerId/lock')
  lockHT(@Req() req: AuthedRequest, @Param('offerId') offerId: string) {
    return this.highTicket.lockLead(req.user!.sub, offerId);
  }
  @Post('high-ticket/listings/:id/complete')
  completeHT(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.highTicket.completeSale(req.user!.sub, id);
  }

  // --- Diagnostics ---------------------------------------------------------
  @Post('diagnostics/passes')
  @Roles('CONSUMER')
  buyPass(@Req() req: AuthedRequest, @Body() dto: BuyPassDto) {
    return this.diagnostics.buyPass(req.user!.sub, dto);
  }
  @Get('diagnostics/passes')
  @Roles('CONSUMER')
  myPasses(@Req() req: AuthedRequest) {
    return this.diagnostics.myPasses(req.user!.sub);
  }
  @Get('diagnostics/passes/:id')
  getPass(@Param('id') id: string) {
    return this.diagnostics.getPass(id);
  }
  @Post('diagnostics/passes/:id/visit')
  @Roles('VENDOR')
  visit(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: VisitDto) {
    return this.diagnostics.logVisit(req.user!.sub, id, dto.outcome, dto.note);
  }
  @Post('diagnostics/passes/:id/accept-quote')
  @Roles('CONSUMER')
  acceptQuote(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: QuoteDto) {
    return this.diagnostics.acceptQuote(req.user!.sub, id, dto.totalPrice);
  }

  // --- Junk ----------------------------------------------------------------
  @Post('junk/listings')
  createJunk(@Req() req: AuthedRequest, @Body() dto: CreateJunkDto) {
    return this.junk.create(req.user!.sub, dto);
  }
  @Get('junk/listings')
  listJunk() {
    return this.junk.list();
  }
  @Get('junk/listings/:id/bids')
  junkBids(@Param('id') id: string) {
    return this.junk.listBids(id);
  }
  @Post('junk/listings/:id/bid')
  bidJunk(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: JunkBidDto) {
    return this.junk.placeBid(req.user!.sub, id, dto.amount, dto.pickupEta);
  }
  @Post('junk/listings/:id/accept')
  acceptJunk(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: AcceptBidDto) {
    return this.junk.acceptBid(req.user!.sub, id, dto.bidId);
  }
  @Post('junk/listings/:id/pickup')
  pickupJunk(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: PickupDto) {
    return this.junk.confirmPickup(req.user!.sub, id, dto.pickupCode);
  }
}
