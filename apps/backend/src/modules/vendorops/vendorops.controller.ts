import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { VendorOpsService } from './vendorops.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

class StaffDto { @IsString() name!: string; @IsOptional() @IsString() phone?: string; @IsOptional() @IsString() vehicle?: string; }
class CampaignDto { @IsOptional() @IsString() bannerUrl?: string; @IsOptional() @IsString() headline?: string; @IsOptional() @IsString() targetUrl?: string; }
class AdResolveDto { @IsString() decision!: string; }

@Controller()
export class VendorOpsController {
  constructor(private readonly svc: VendorOpsService) {}

  @Get('vendor/analytics') @UseGuards(JwtAuthGuard) @Roles('VENDOR')
  analytics(@Req() r: AuthedRequest) { return this.svc.analytics(r.user!.sub); }

  @Get('vendor/team') @UseGuards(JwtAuthGuard) @Roles('VENDOR')
  team(@Req() r: AuthedRequest) { return this.svc.listStaff(r.user!.sub); }
  @Post('vendor/team') @UseGuards(JwtAuthGuard) @Roles('VENDOR')
  addStaff(@Req() r: AuthedRequest, @Body() d: StaffDto) { return this.svc.addStaff(r.user!.sub, d.name, d.phone, d.vehicle); }
  @Delete('vendor/team/:id') @UseGuards(JwtAuthGuard) @Roles('VENDOR')
  delStaff(@Req() r: AuthedRequest, @Param('id') id: string) { return this.svc.removeStaff(r.user!.sub, id); }

  @Get('vendor/ads') @UseGuards(JwtAuthGuard) @Roles('VENDOR')
  ads(@Req() r: AuthedRequest) { return this.svc.myCampaigns(r.user!.sub); }
  @Post('vendor/ads') @UseGuards(JwtAuthGuard) @Roles('VENDOR')
  createAd(@Req() r: AuthedRequest, @Body() d: CampaignDto) { return this.svc.createCampaign(r.user!.sub, d); }

  /** Public homepage banners (no auth). */
  @Get('ads/active')
  banners() { return this.svc.activeBanners(); }
  @Post('ads/:id/click')
  click(@Param('id') id: string) { return this.svc.recordClick(id); }

  @Get('admin/ads') @UseGuards(JwtAuthGuard) @Roles('ADMIN')
  adQueue() { return this.svc.adQueue(); }
  @Post('admin/ads/:id') @UseGuards(JwtAuthGuard) @Roles('ADMIN')
  resolveAd(@Param('id') id: string, @Body() d: AdResolveDto) { return this.svc.resolveCampaign(id, d.decision === 'APPROVE'); }
}
