import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Thin PayPal REST wrapper (Orders v2). SANDBOX-FIRST.
 *
 * IMPORTANT regulatory note (PRD §1.C): the platform must NOT itself custody
 * unregulated client funds. PayPal Orders capture-on-the-platform is a
 * placeholder so the escrow state machine is testable end-to-end in sandbox.
 * For production escrow you need a licensed payment-facilitator / marketplace
 * payout arrangement (PayPal Commerce Platform marketplace, or a GCC bank-backed
 * escrow API) confirmed by legal counsel before going live.
 */
@Injectable()
export class PaypalClient {
  private readonly logger = new Logger(PaypalClient.name);
  private token?: { value: string; expiresAt: number };

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    const env = this.config.get<string>('PAYPAL_ENV') ?? 'sandbox';
    return env === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) {
      return this.token.value;
    }
    const id = this.config.get<string>('PAYPAL_CLIENT_ID');
    const secret = this.config.get<string>('PAYPAL_CLIENT_SECRET');
    if (!id || !secret) {
      throw new Error('PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are required (see .env.example)');
    }
    const auth = Buffer.from(`${id}:${secret}`).toString('base64');
    const res = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) {
      throw new Error(`PayPal auth failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { access_token: string; expires_in: number };
    this.token = {
      value: json.access_token,
      expiresAt: Date.now() + json.expires_in * 1000,
    };
    return this.token.value;
  }

  /** Create an order for the full bid amount → maps to PENDING_FUNDING. */
  async createOrder(amount: string, currency = 'USD', referenceId?: string) {
    const token = await this.accessToken();
    const res = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ reference_id: referenceId, amount: { currency_code: currency, value: amount } }],
      }),
    });
    if (!res.ok) throw new Error(`createOrder failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  /** Capture an approved order → maps PENDING_FUNDING → HOLDING. */
  async captureOrder(orderId: string) {
    const token = await this.accessToken();
    const res = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`captureOrder failed: ${res.status} ${await res.text()}`);
    return res.json();
  }
}
