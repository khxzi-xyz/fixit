import { Body, Controller, Get, Post, Query } from '@nestjs/common';

@Controller('ads')
export class AdsController {
  
  @Get()
  getAds(@Query('screen') _screen?: string) {
    return [
      {
        ad_id: 'ad-1',
        title: 'FixIt Plus is Here',
        subtitle: 'Get 5% cashback on every job',
        background_color: '#1B6EF3',
        cta_label: 'Learn More',
        ad_type: 'BANNER',
      }
    ];
  }

  @Post('leads')
  submitLead(@Body() body: any) {
    return { success: true, lead_id: `lead-${Date.now()}`, ...body };
  }
}

@Controller('advertise')
export class AdvertiseController {
  @Post('leads')
  submitLead(@Body() body: any) {
    return { success: true, lead_id: `lead-${Date.now()}`, ...body };
  }
}
