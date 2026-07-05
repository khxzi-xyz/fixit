import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * WhatsApp delivery channel (no Twilio budget). Uses whatsapp-web.js: the owner
 * scans a QR once (GET /api/auth/whatsapp/qr), the session persists via
 * LocalAuth, and OTP / order messages send from the owner's own WhatsApp.
 *
 * The library is loaded dynamically so the backend builds/runs even before
 * `npm i whatsapp-web.js qrcode` is run -until then, sendMessage() returns
 * false and callers fall back to the dev code.
 */
@Injectable()
export class WhatsAppService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppService.name);
  private client: any = null;
  private qr: string | null = null;
  private ready = false;

  async onModuleInit() {
    if (process.env.WHATSAPP_ENABLED !== 'true') {
      this.logger.log('WhatsApp disabled (set WHATSAPP_ENABLED=true to enable).');
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Client, LocalAuth } = require('whatsapp-web.js');
      this.client = new Client({
        authStrategy: new LocalAuth({ dataPath: process.env.WHATSAPP_SESSION_DIR ?? '.wwebjs_auth' }),
        puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
      });
      this.client.on('qr', (qr: string) => { this.qr = qr; this.ready = false; this.logger.warn('WhatsApp QR ready -scan it at GET /api/auth/whatsapp/qr'); });
      this.client.on('ready', () => { this.ready = true; this.qr = null; this.logger.log('WhatsApp client READY.'); });
      this.client.on('disconnected', () => { this.ready = false; });
      await this.client.initialize();
    } catch (e) {
      this.logger.warn(`WhatsApp not started: ${(e as Error).message}. Run "npm i whatsapp-web.js qrcode".`);
    }
  }

  status() {
    return { enabled: process.env.WHATSAPP_ENABLED === 'true', ready: this.ready, hasQr: !!this.qr };
  }

  /** Returns the current QR as a data URL (for the owner to scan), or null. */
  async qrDataUrl(): Promise<string | null> {
    if (!this.qr) return null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const qrcode = require('qrcode');
      return await qrcode.toDataURL(this.qr);
    } catch {
      return this.qr; // raw string fallback
    }
  }

  /** E.164 phone (e.g. +96890000001) → WhatsApp chat id. */
  private chatId(phone: string) {
    return `${phone.replace(/[^0-9]/g, '')}@c.us`;
  }

  /** Sends a message; returns true on success, false if not ready (caller falls back). */
  async sendMessage(phone: string, body: string): Promise<boolean> {
    if (!this.ready || !this.client) return false;
    try {
      await this.client.sendMessage(this.chatId(phone), body);
      return true;
    } catch (e) {
      this.logger.warn(`WhatsApp send failed: ${(e as Error).message}`);
      return false;
    }
  }

  async sendOtp(phone: string, code: string): Promise<boolean> {
    const msg = `*FixIt Now Security* 🛠️\n\nYour verification code is: *${code}*\n\n_This code expires in 5 minutes. Please do not share it with anyone._`;
    return this.sendMessage(phone, msg);
  }
}
