import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  getFavorites(@Req() req: any) {
    const userId = req.user?.sub ?? req.user?.user_id ?? 'usr-demo';
    return this.favoritesService.getFavorites(userId);
  }

  @Post('toggle')
  toggleFavorite(@Req() req: any, @Body() body: any) {
    const userId = req.user?.sub ?? req.user?.user_id ?? 'usr-demo';
    return this.favoritesService.toggleFavorite(userId, body);
  }
}
