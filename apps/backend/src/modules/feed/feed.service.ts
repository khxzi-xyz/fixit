import { Injectable } from '@nestjs/common';

export interface FeedPost {
  post_id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_avatar: string;
  category_id: string;
  title: string;
  description: string;
  before_image: string;
  after_image: string;
  likes_count: number;
  is_liked?: boolean;
  job_price_omr: number;
  created_at: string;
}

const FEED_POSTS: FeedPost[] = [
  {
    post_id: 'feed-1',
    vendor_id: 'v-101',
    vendor_name: 'Al-Batinah Cooling & Electrical',
    vendor_avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    category_id: 'AC_REPAIR',
    title: 'Complete Split AC Compressor Overhaul & Deep Coil Wash',
    description: 'Brought an old 3-ton compressor back to ice-cold efficiency for a villa in Seeb. Replaced burned out capacitor and flushed coils.',
    before_image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    after_image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
    likes_count: 84,
    job_price_omr: 18.0,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    post_id: 'feed-2',
    vendor_id: 'v-102',
    vendor_name: 'Muscat Pro Plumbing Services',
    vendor_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    category_id: 'PLUMBING',
    title: 'Luxury Bathroom Mixer & Hidden Pipe Leak Repair',
    description: 'Located a concealed wall leak using thermal imaging and installed a solid brass German mixer tap without breaking tiles.',
    before_image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
    after_image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&auto=format&fit=crop&q=80',
    likes_count: 142,
    job_price_omr: 25.0,
    created_at: new Date(Date.now() - 17280000).toISOString(),
  },
  {
    post_id: 'feed-3',
    vendor_id: 'v-103',
    vendor_name: 'Oman Precision Auto Mechanics',
    vendor_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    category_id: 'MECHANIC',
    title: 'Toyota Prado Desert Suspension Lift & Brake Overhaul',
    description: 'Installed heavy-duty Bilstein shocks and ceramic brake pads for high-temperature dune driving stability.',
    before_image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
    after_image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80',
    likes_count: 219,
    job_price_omr: 45.0,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

@Injectable()
export class FeedService {
  private posts = [...FEED_POSTS];

  getFeed(): FeedPost[] {
    return this.posts;
  }

  toggleLike(postId: string): FeedPost {
    const post = this.posts.find((p) => p.post_id === postId);
    if (post) {
      post.is_liked = !post.is_liked;
      post.likes_count += post.is_liked ? 1 : -1;
    }
    return post ?? FEED_POSTS[0];
  }
}
