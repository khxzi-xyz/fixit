import { Injectable } from '@nestjs/common';

export interface FavoriteVendor {
  vendor_id: string;
  display_name: string;
  primary_category: string;
  avatar_url: string;
  rating: number;
  completed_jobs: number;
  is_verified: boolean;
  phone: string;
  note?: string;
  saved_at: string;
}

const DEMO_FAVORITES: FavoriteVendor[] = [
  {
    vendor_id: 'v-101',
    display_name: 'Ahmed Al-Balushi (Master Electrician)',
    primary_category: 'ELECTRICIAN',
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    rating: 4.9,
    completed_jobs: 148,
    is_verified: true,
    phone: '+96895123456',
    note: 'Our trusted electrician for villa DB board maintenance',
    saved_at: new Date(Date.now() - 864000000).toISOString(),
  },
  {
    vendor_id: 'v-102',
    display_name: 'Sultan Cooling Systems',
    primary_category: 'AC_REPAIR',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5.0,
    completed_jobs: 210,
    is_verified: true,
    phone: '+96896987654',
    note: 'Fast 30-min AC gas top up crew',
    saved_at: new Date(Date.now() - 1728000000).toISOString(),
  },
];

@Injectable()
export class FavoritesService {
  private favoritesMap: Map<string, FavoriteVendor[]> = new Map();

  getFavorites(userId: string): FavoriteVendor[] {
    if (!this.favoritesMap.has(userId)) {
      this.favoritesMap.set(userId, [...DEMO_FAVORITES]);
    }
    return this.favoritesMap.get(userId) || [];
  }

  toggleFavorite(userId: string, vendor: Partial<FavoriteVendor> & { vendor_id: string }): { is_favorite: boolean; favorites: FavoriteVendor[] } {
    const list = this.getFavorites(userId);
    const idx = list.findIndex((f) => f.vendor_id === vendor.vendor_id);
    let isFav = false;

    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      isFav = true;
      list.unshift({
        vendor_id: vendor.vendor_id,
        display_name: vendor.display_name || 'Verified FixIt Pro',
        primary_category: vendor.primary_category || 'GENERAL',
        avatar_url: vendor.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        rating: vendor.rating || 5.0,
        completed_jobs: vendor.completed_jobs || 12,
        is_verified: true,
        phone: vendor.phone || '+96895000000',
        note: vendor.note,
        saved_at: new Date().toISOString(),
      });
    }

    this.favoritesMap.set(userId, list);
    return { is_favorite: isFav, favorites: list };
  }
}
