import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { EmergencyService } from './emergency.service';

@Controller('emergency')
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Post('dispatch')
  triggerEmergency(
    @Req() req: any,
    @Body() body: { type: 'PIPE_BURST' | 'ELECTRICAL_FIRE' | 'AC_HEATWAVE' | 'LOCKOUT' | 'GAS_LEAK'; lat: number; lng: number; address: string },
  ) {
    const userId = req.user?.sub ?? req.user?.user_id ?? 'usr-demo';
    return this.emergencyService.triggerEmergency(userId, body);
  }

  @Get(':id')
  getActiveDispatch(@Param('id') id: string) {
    return this.emergencyService.getActiveDispatch(id);
  }
}
