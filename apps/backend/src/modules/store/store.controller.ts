import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('products')
  getProducts(@Query('q') q?: string, @Query('category') category?: string) {
    return this.storeService.getProducts(q, category);
  }

  @Get('products/:id')
  getProductById(@Param('id') id: string) {
    return this.storeService.getProductById(id);
  }

  @Post('orders')
  placeOrder(@Req() req: any, @Body() body: { items: Array<{ product_id: string; quantity: number }>; delivery_address: string }) {
    const userId = req.user?.sub ?? req.user?.user_id ?? 'usr-demo';
    return this.storeService.placeOrder(userId, body);
  }

  @Get('orders/me')
  getUserOrders(@Req() req: any) {
    const userId = req.user?.sub ?? req.user?.user_id ?? 'usr-demo';
    return this.storeService.getUserOrders(userId);
  }
}
