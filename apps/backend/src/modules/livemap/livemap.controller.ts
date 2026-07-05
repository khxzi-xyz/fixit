import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { LiveMapService } from './livemap.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

class AvailabilityDto {
  @IsIn([true, false]) isAvailable!: boolean;
  @IsOptional() @IsNumber() @Min(-90) @Max(90) lat?: number;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) lng?: number;
  @IsOptional() @IsNumber() heading?: number;
}
class LocationDto {
  @IsNumber() @Min(-90) @Max(90) lat!: number;
  @IsNumber() @Min(-180) @Max(180) lng!: number;
  @IsOptional() @IsNumber() heading?: number;
}
class DirectBountyDto {
  @IsString() vendorId!: string;
  @IsNumber() @Min(0) offeredPrice!: number;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() note?: string;
}
class RespondBountyDto {
  @IsIn(['ACCEPT', 'DECLINE', 'COUNTER']) action!: 'ACCEPT' | 'DECLINE' | 'COUNTER';
  @IsOptional() @IsNumber() counterPrice?: number;
}

@Controller()
export class LiveMapController {
  constructor(private readonly map: LiveMapService) {}

  // --- Availability ---------------------------------------------------------
  @Post('availability')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  setAvailability(@Req() req: AuthedRequest, @Body() dto: AvailabilityDto) {
    return this.map.setAvailability(req.user!.sub, dto.isAvailable, dto.lat, dto.lng, dto.heading);
  }

  @Post('availability/location')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  updateLocation(@Req() req: AuthedRequest, @Body() dto: LocationDto) {
    return this.map.updateLocation(req.user!.sub, dto.lat, dto.lng, dto.heading);
  }

  @Get('map/nearby')
  @UseGuards(JwtAuthGuard)
  nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.map.nearbyVendors(Number(lat), Number(lng), radius ? Number(radius) : 15000, categoryId);
  }

  // --- Per-job tracking -----------------------------------------------------
  @Post('jobs/:jobId/tracking/start')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  startTracking(@Req() req: AuthedRequest, @Param('jobId') jobId: string) {
    return this.map.startTracking(jobId, req.user!.sub);
  }

  @Post('jobs/:jobId/tracking/ping')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  ping(@Req() req: AuthedRequest, @Param('jobId') jobId: string, @Body() dto: LocationDto) {
    return this.map.ping(jobId, req.user!.sub, dto.lat, dto.lng);
  }

  @Post('jobs/:jobId/tracking/arrive')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  arrive(@Req() req: AuthedRequest, @Param('jobId') jobId: string) {
    return this.map.arrive(jobId, req.user!.sub);
  }

  /** Consumer reports their location so the vendor's map shows the destination. */
  @Post('jobs/:jobId/tracking/destination')
  @UseGuards(JwtAuthGuard)
  setDestination(@Param('jobId') jobId: string, @Body() dto: LocationDto) {
    return this.map.setDestination(jobId, dto.lat, dto.lng);
  }

  @Get('jobs/:jobId/tracking')
  @UseGuards(JwtAuthGuard)
  session(@Param('jobId') jobId: string) {
    return this.map.getActiveSession(jobId);
  }

  // --- Direct Strike-Bounty -------------------------------------------------
  @Post('direct-bounties')
  @UseGuards(JwtAuthGuard)
  @Roles('CONSUMER')
  sendBounty(@Req() req: AuthedRequest, @Body() dto: DirectBountyDto) {
    return this.map.sendDirectBounty(req.user!.sub, dto);
  }

  @Get('direct-bounties')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  listBounties(@Req() req: AuthedRequest) {
    return this.map.listDirectBounties(req.user!.sub);
  }

  @Post('direct-bounties/:bountyId/respond')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  respondBounty(@Req() req: AuthedRequest, @Param('bountyId') bountyId: string, @Body() dto: RespondBountyDto) {
    return this.map.respondDirectBounty(bountyId, req.user!.sub, dto.action, dto.counterPrice);
  }
}
