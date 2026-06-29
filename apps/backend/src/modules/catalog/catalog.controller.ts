import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';

class SkillTagDto {
  @IsString() categoryId!: string;
  @IsOptional() @IsString() proofUrl?: string;
  @IsOptional() @IsString() proofNote?: string;
}
class ResolveDto {
  @IsString() decision!: 'APPROVE' | 'REJECT';
  @IsOptional() @IsString() note?: string;
}
class ServiceRequestDto {
  @IsString() proposedName!: string;
  @IsOptional() @IsString() description?: string;
}
class ApproveServiceDto {
  @IsString() categoryId!: string;
  @IsString() displayName!: string;
  @IsOptional() @IsString() iconKey?: string;
}

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  categories() {
    return this.catalog.listCategories();
  }

  // --- Skill tags -----------------------------------------------------------
  @Post('vendors/skill-tags')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  requestSkill(@Req() req: AuthedRequest, @Body() dto: SkillTagDto) {
    return this.catalog.requestSkillTag(req.user!.sub, dto);
  }

  @Get('vendors/skill-tags')
  @UseGuards(JwtAuthGuard)
  @Roles('VENDOR')
  mySkills(@Req() req: AuthedRequest) {
    return this.catalog.listMySkillTags(req.user!.sub);
  }

  @Get('admin/skill-tags')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  pendingSkills() {
    return this.catalog.pendingSkillTags();
  }

  @Post('admin/skill-tags/:tagId')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  resolveSkill(@Req() req: AuthedRequest, @Param('tagId') tagId: string, @Body() dto: ResolveDto) {
    return this.catalog.resolveSkillTag(tagId, req.user!.sub, dto.decision === 'APPROVE', dto.note);
  }

  // --- Service requests -----------------------------------------------------
  @Post('service-requests')
  @UseGuards(JwtAuthGuard)
  requestService(@Req() req: AuthedRequest, @Body() dto: ServiceRequestDto) {
    return this.catalog.requestService(req.user!.sub, dto);
  }

  @Get('admin/service-requests')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  pendingServices() {
    return this.catalog.pendingServiceRequests();
  }

  @Post('admin/service-requests/:requestId/approve')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  approveService(@Req() req: AuthedRequest, @Param('requestId') requestId: string, @Body() dto: ApproveServiceDto) {
    return this.catalog.approveServiceRequest(requestId, req.user!.sub, dto);
  }

  @Post('admin/service-requests/:requestId/reject')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  rejectService(@Req() req: AuthedRequest, @Param('requestId') requestId: string) {
    return this.catalog.rejectServiceRequest(requestId, req.user!.sub);
  }
}
