import { Body, Controller, Get, Param, Put, UseGuards, Req } from '@nestjs/common';
import { ArrayNotEmpty, IsArray, IsIn, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

class UpsertVendorDto {
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) categoryIds!: string[];
  @IsOptional() @IsInt() @Min(1000) radiusMeters?: number;
  @IsOptional() @IsString() licenseDocUrl?: string;
  @IsOptional() @IsString() insuranceDocUrl?: string;
  @IsOptional() @IsString() insuranceExpiry?: string;
  @IsOptional() @IsString() serviceAreaWkt?: string;
}

class VerificationDto {
  @IsIn(['PENDING', 'VERIFIED', 'SUSPENDED']) status!: 'PENDING' | 'VERIFIED' | 'SUSPENDED';
}

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  me(@Req() req: AuthedRequest) {
    return this.vendors.getProfile(req.user!.sub);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  upsert(@Req() req: AuthedRequest, @Body() dto: UpsertVendorDto) {
    return this.vendors.upsertProfile(req.user!.sub, dto);
  }

  @Get('compliance')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  compliance() {
    return this.vendors.complianceList();
  }

  @Put(':vendorId/verification')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  verify(@Param('vendorId') vendorId: string, @Body() dto: VerificationDto) {
    return this.vendors.setVerification(vendorId, dto.status);
  }
}
