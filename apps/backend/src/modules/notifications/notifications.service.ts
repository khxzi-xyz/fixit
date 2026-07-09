import { Injectable, Logger } from '@nestjs/common';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging, Message, MulticastMessage } from 'firebase-admin/messaging';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private initialized = false;

  constructor() {
    try {
      if (!getApps().length) {
        // Fallback to application default credentials if available
        // Or if you want to use a service account key path from ENV
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        if (serviceAccountPath) {
          initializeApp({
            credential: cert(require(serviceAccountPath)),
          });
          this.initialized = true;
          this.logger.log('Firebase Admin initialized with service account key.');
        } else {
          initializeApp();
          this.initialized = true;
          this.logger.log('Firebase Admin initialized with default credentials.');
        }
      } else {
        this.initialized = true;
      }
    } catch (error) {
      this.logger.warn(`Failed to initialize Firebase Admin: ${error}`);
    }
  }

  async sendPushNotification(token: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.initialized || !token) return false;

    try {
      const message: Message = {
        token,
        notification: {
          title,
          body,
        },
        data: data || {},
      };

      const response = await getMessaging().send(message);
      this.logger.debug(`Successfully sent push message: ${response}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending push notification: ${error}`);
      return false;
    }
  }

  async sendMulticastPushNotification(tokens: string[], title: string, body: string, data?: Record<string, string>) {
    if (!this.initialized || !tokens || tokens.length === 0) return false;

    try {
      const message: MulticastMessage = {
        tokens,
        notification: {
          title,
          body,
        },
        data: data || {},
      };

      const response = await getMessaging().sendEachForMulticast(message);
      this.logger.debug(`${response.successCount} messages were sent successfully`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending multicast push notification: ${error}`);
      return false;
    }
  }
}
