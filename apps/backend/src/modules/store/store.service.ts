import { Injectable, NotFoundException } from '@nestjs/common';

export interface StoreProduct {
  product_id: string;
  name: string;
  category_id: string;
  description: string;
  price_omr: number;
  in_stock: number;
  image_url: string;
  rating: number;
  badge?: string;
  delivery_time_mins: number;
}

export interface StoreOrder {
  order_id: string;
  user_id: string;
  items: Array<{ product_id: string; quantity: number; price_omr: number; name: string }>;
  total_omr: number;
  status: 'PENDING' | 'DISPATCHED' | 'DELIVERED';
  delivery_address: string;
  created_at: string;
}

const PRODUCTS: StoreProduct[] = [
  {
    product_id: 'p-1',
    name: 'Universal AC Capacitor 45uF',
    category_id: 'AC_REPAIR',
    description: 'Heavy duty CBB65 dual run capacitor for split and window AC units.',
    price_omr: 4.5,
    in_stock: 42,
    image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80',
    rating: 4.9,
    badge: 'Best Seller',
    delivery_time_mins: 30,
  },
  {
    product_id: 'p-2',
    name: 'Heavy Duty Pipe Wrench 14"',
    category_id: 'PLUMBING',
    description: 'Forged steel jaw pipe wrench with ergonomic grip for professional plumbers.',
    price_omr: 8.9,
    in_stock: 18,
    image_url: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=500&auto=format&fit=crop&q=80',
    rating: 4.8,
    delivery_time_mins: 25,
  },
  {
    product_id: 'p-3',
    name: 'Schneider 32A Double Pole Breaker',
    category_id: 'ELECTRICIAN',
    description: 'High-sensitivity MCB circuit breaker for home distribution boards.',
    price_omr: 6.2,
    in_stock: 30,
    image_url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=500&auto=format&fit=crop&q=80',
    rating: 5.0,
    badge: 'Popular',
    delivery_time_mins: 35,
  },
  {
    product_id: 'p-4',
    name: 'Shell Helix Ultra 5W-40 Motor Oil (4L)',
    category_id: 'MECHANIC',
    description: 'Fully synthetic motor oil engineered for extreme desert climate heat protection.',
    price_omr: 14.5,
    in_stock: 25,
    image_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=80',
    rating: 4.9,
    badge: 'Must Have',
    delivery_time_mins: 20,
  },
  {
    product_id: 'p-5',
    name: 'Kärcher High Pressure Washer Spray Gun',
    category_id: 'CLEANING',
    description: 'Quick connect replacement spray gun for high pressure water washers.',
    price_omr: 12.0,
    in_stock: 15,
    image_url: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500&auto=format&fit=crop&q=80',
    rating: 4.7,
    delivery_time_mins: 30,
  },
];

@Injectable()
export class StoreService {
  private orders: StoreOrder[] = [];

  getProducts(query?: string, categoryId?: string): StoreProduct[] {
    let list = PRODUCTS;
    if (categoryId && categoryId !== 'ALL') {
      list = list.filter((p) => p.category_id === categoryId);
    }
    if (query?.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return list;
  }

  getProductById(id: string): StoreProduct {
    const p = PRODUCTS.find((x) => x.product_id === id);
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  placeOrder(userId: string, dto: { items: Array<{ product_id: string; quantity: number }>; delivery_address: string }): StoreOrder {
    let total = 0;
    const orderItems: Array<{ product_id: string; quantity: number; price_omr: number; name: string }> = [];

    for (const item of dto.items) {
      const prod = this.getProductById(item.product_id);
      total += prod.price_omr * item.quantity;
      orderItems.push({
        product_id: prod.product_id,
        quantity: item.quantity,
        price_omr: prod.price_omr,
        name: prod.name,
      });
    }

    const order: StoreOrder = {
      order_id: `ord-${Date.now()}`,
      user_id: userId,
      items: orderItems,
      total_omr: Number(total.toFixed(3)),
      status: 'DISPATCHED',
      delivery_address: dto.delivery_address || 'Muscat, Oman',
      created_at: new Date().toISOString(),
    };

    this.orders.unshift(order);
    return order;
  }

  getUserOrders(userId: string): StoreOrder[] {
    return this.orders.filter((o) => o.user_id === userId);
  }
}
