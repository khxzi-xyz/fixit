import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';

/**
 * Realtime gateway (PRD §3.A — WebSocket gateway). Carries:
 *  - live chat (post-funding)
 *  - milestone status updates
 *  - bid-arrival notifications
 *  - admin moderation/dispute queue pushes
 *
 * Rooms: `job:<jobId>` for the two parties on a job, `admin` for the Command
 * Center. For horizontal scaling, attach the Redis adapter (see redis.adapter)
 * so broadcasts fan out across all gateway instances.
 */
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/rt' })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_job')
  joinJob(@ConnectedSocket() client: Socket, @MessageBody() body: { jobId: string }) {
    client.join(`job:${body.jobId}`);
    return { joined: `job:${body.jobId}` };
  }

  @SubscribeMessage('join_admin')
  joinAdmin(@ConnectedSocket() client: Socket) {
    client.join('admin');
    return { joined: 'admin' };
  }

  @SubscribeMessage('join_user')
  joinUser(@ConnectedSocket() client: Socket, @MessageBody() body: { userId: string }) {
    client.join(`user:${body.userId}`);
    return { joined: `user:${body.userId}` };
  }

  /** Live map room — consumers watching available vendors in their area. */
  @SubscribeMessage('join_map')
  joinMap(@ConnectedSocket() client: Socket) {
    client.join('map');
    return { joined: 'map' };
  }

  /** Marketplace listing room — buyers watching an auction. */
  @SubscribeMessage('join_listing')
  joinListing(@ConnectedSocket() client: Socket, @MessageBody() body: { listingId: string }) {
    client.join(`listing:${body.listingId}`);
    return { joined: `listing:${body.listingId}` };
  }

  // --- Server-side broadcast helpers (called by services) -------------------

  emitChatMessage(jobId: string, message: unknown) {
    this.server.to(`job:${jobId}`).emit('chat_message', message);
  }

  emitMilestoneUpdate(jobId: string, milestone: unknown) {
    this.server.to(`job:${jobId}`).emit('milestone_update', milestone);
  }

  emitBidArrival(jobId: string, bid: unknown) {
    this.server.to(`job:${jobId}`).emit('bid_arrival', bid);
  }

  emitModerationFlag(payload: unknown) {
    this.server.to('admin').emit('moderation_flag', payload);
  }

  emitDisputeOpened(payload: unknown) {
    this.server.to('admin').emit('dispute_opened', payload);
  }

  emitWarrantyUpdate(jobId: string, payload: unknown) {
    this.server.to(`job:${jobId}`).emit('warranty_update', payload);
  }

  emitPartsFundingUpdate(jobId: string, payload: unknown) {
    this.server.to(`job:${jobId}`).emit('parts_funding_update', payload);
  }

  // --- Wallet -----------------------------------------------------------------
  emitWalletUpdate(userId: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit('wallet_update', payload);
  }

  emitNotification(userId: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit('notification', payload);
  }

  // --- Live map / tracking ----------------------------------------------------
  /** A vendor's live pin moved or availability flipped — fan out to the map room. */
  emitVendorLocationUpdate(payload: unknown) {
    this.server.to('map').emit('vendor_location_update', payload);
  }

  emitAvailabilityUpdate(payload: unknown) {
    this.server.to('map').emit('availability_update', payload);
  }

  /** Per-job en-route tracking ping (only between On-My-Way and Arrived). */
  emitTrackingPing(jobId: string, payload: unknown) {
    this.server.to(`job:${jobId}`).emit('tracking_ping', payload);
  }

  emitTrackingStatus(jobId: string, payload: unknown) {
    this.server.to(`job:${jobId}`).emit('tracking_status', payload);
  }

  // --- Bounties ---------------------------------------------------------------
  emitDirectBounty(vendorUserId: string, payload: unknown) {
    this.server.to(`user:${vendorUserId}`).emit('direct_bounty', payload);
  }

  emitBountyUpdate(jobId: string, payload: unknown) {
    this.server.to(`job:${jobId}`).emit('bounty_update', payload);
  }

  // --- Completion / Triple-Verify --------------------------------------------
  emitCompletionUpdate(jobId: string, payload: unknown) {
    this.server.to(`job:${jobId}`).emit('completion_update', payload);
  }

  // --- Marketplace / auctions -------------------------------------------------
  emitListingUpdate(listingId: string, payload: unknown) {
    this.server.to(`listing:${listingId}`).emit('listing_update', payload);
  }

  emitNewListing(payload: unknown) {
    this.server.to('map').emit('new_listing', payload);
  }
}
