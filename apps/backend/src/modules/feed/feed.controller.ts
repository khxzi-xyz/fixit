import { Controller, Get, Param, Post } from '@nestjs/common';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  getFeed() {
    return this.feedService.getFeed();
  }

  @Post(':id/like')
  toggleLike(@Param('id') id: string) {
    return this.feedService.toggleLike(id);
  }
}
