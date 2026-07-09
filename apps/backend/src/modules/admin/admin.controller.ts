import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CouponsService } from '../rewards/coupons.service';

class CreateCouponDto {
  @IsOptional() @IsString() code?: string;
  @IsIn(['CREDIT', 'PLAN_DAYS']) kind!: 'CREDIT' | 'PLAN_DAYS';
  @IsOptional() @IsNumber() @Min(0.001) amountOmr?: number;
  @IsOptional() @IsString() planId?: string;
  @IsOptional() @IsInt() @Min(1) days?: number;
  @IsOptional() @IsInt() @Min(1) maxUses?: number;
  @IsOptional() @IsString() expiresAt?: string; // omit for "never"
  @IsOptional() @IsIn(['ALL', 'CONSUMER', 'VENDOR']) audience?: 'ALL' | 'CONSUMER' | 'VENDOR';
  @IsOptional() @IsBoolean() isPublic?: boolean;
  @IsOptional() @IsString() note?: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly coupons: CouponsService,
  ) {}

  /** Coupon maker: gift wallet credit or plan days, with use caps + expiry. */
  @Post('coupons')
  createCoupon(@Req() req: any, @Body() dto: CreateCouponDto) {
    if (req.user?.role !== 'ADMIN') throw new UnauthorizedException('Admin only');
    return this.coupons.create(req.user.sub, dto);
  }

  @Get('coupons')
  listCoupons(@Req() req: any) {
    if (req.user?.role !== 'ADMIN') throw new UnauthorizedException('Admin only');
    return this.coupons.listAll();
  }

  @Delete('coupons/:id')
  deleteCoupon(@Req() req: any, @Param('id') id: string) {
    if (req.user?.role !== 'ADMIN') throw new UnauthorizedException('Admin only');
    return this.coupons.remove(id);
  }

  @Get('referrals')
  listReferrals(@Req() req: any) {
    if (req.user?.role !== 'ADMIN') throw new UnauthorizedException('Admin only');
    return this.coupons.listReferrals();
  }

  @Get('metrics')
  async getMetrics(@Req() req: any) {
    if (req.user?.role !== 'ADMIN') throw new UnauthorizedException('Admin only');
    return this.adminService.getMetrics();
  }

  @Get('users')
  async getUsers(@Req() req: any) {
    if (req.user?.role !== 'ADMIN') throw new UnauthorizedException('Admin only');
    return this.adminService.getUsers();
  }

  @Post('users/:id/update')
  async updateUser(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req.user?.role !== 'ADMIN') throw new UnauthorizedException('Admin only');
    return this.adminService.updateUser(id, body);
  }

  @Get('kyc')
  async getKycQueue(@Req() req: any) {
    if (req.user?.role !== 'ADMIN') throw new UnauthorizedException('Admin only');
    return this.adminService.getKycQueue();
  }

  @Post('kyc/:documentId')
  async reviewKyc(
    @Req() req: any,
    @Param('documentId') documentId: string,
    @Body() body: { approve: boolean; reason?: string }
  ) {
    if (req.user?.role !== 'ADMIN') throw new UnauthorizedException('Admin only');
    return this.adminService.reviewKyc(documentId, body.approve, body.reason);
  }
}
