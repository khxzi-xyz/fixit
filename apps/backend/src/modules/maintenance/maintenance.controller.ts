import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('plans')
  getPlans() {
    return this.maintenanceService.getPlans();
  }

  @Post('subscribe')
  subscribe(@Req() req: any, @Body() body: { plan_id: string }) {
    const userId = req.user?.sub ?? req.user?.user_id ?? 'usr-demo';
    return this.maintenanceService.subscribe(userId, body.plan_id);
  }

  @Get('subscriptions')
  getUserSubscriptions(@Req() req: any) {
    const userId = req.user?.sub ?? req.user?.user_id ?? 'usr-demo';
    return this.maintenanceService.getUserSubscriptions(userId);
  }
}
