import { INestApplication, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { ServerOptions } from 'socket.io';

/**
 * Redis pub/sub adapter for Socket.IO so broadcasts fan out across every
 * gateway instance (PRD §3.A "backed by Redis pub/sub for horizontal scaling").
 * Falls back to the default in-memory adapter if REDIS_URL is unset.
 *
 * Requires `@socket.io/redis-adapter` (add when wiring multi-instance scaling).
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  constructor(app: INestApplication, private readonly redisUrl?: string) {
    super(app);
  }

  async connect(): Promise<void> {
    if (!this.redisUrl) {
      this.logger.warn('REDIS_URL unset -using in-memory Socket.IO adapter (single instance only)');
      return;
    }
    const pub = new Redis(this.redisUrl);
    const sub = pub.duplicate();
    this.adapterConstructor = createAdapter(pub, sub);
    this.logger.log('Socket.IO Redis adapter connected');
  }

  createIOServer(port: number, options?: ServerOptions): unknown {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      (server as { adapter: (a: unknown) => void }).adapter(this.adapterConstructor);
    }
    return server;
  }
}
