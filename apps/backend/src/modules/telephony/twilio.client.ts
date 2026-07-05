import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ProxySession {
  sessionSid: string;
  proxyNumber: string | null;
  simulated: boolean;
}

/**
 * Twilio Proxy wrapper for masked-relay calling (PRD §1.A; ideas.md "Masked
 * Telephony"). Each party reaches the other through a proxy number, so real
 * numbers are never exposed and the platform retains a moderation hook.
 *
 * Configure: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PROXY_SERVICE_SID.
 * Without creds it returns a SIMULATED session so the flow is testable.
 * Uses the Twilio REST API directly (no SDK dependency).
 */
@Injectable()
export class TwilioClient {
  private readonly logger = new Logger(TwilioClient.name);

  constructor(private readonly config: ConfigService) { }

  get configured(): boolean {
    return Boolean(
      this.config.get('TWILIO_ACCOUNT_SID') &&
      this.config.get('TWILIO_AUTH_TOKEN') &&
      this.config.get('TWILIO_PROXY_SERVICE_SID'),
    );
  }

  private auth(): { sid: string; header: string } {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID')!;
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN')!;
    return { sid, header: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64') };
  }

  /** Create a Proxy session and add both participants by real number. */
  async createMaskedSession(consumerPhone: string, vendorPhone: string): Promise<ProxySession> {
    if (!this.configured) {
      this.logger.warn('Twilio unconfigured -returning SIMULATED masked session');
      return { sessionSid: `SIM-${Date.now()}`, proxyNumber: null, simulated: true };
    }
    const { header } = this.auth();
    const serviceSid = this.config.get<string>('TWILIO_PROXY_SERVICE_SID')!;
    const base = `https://proxy.twilio.com/v1/Services/${serviceSid}`;

    const session = await this.post(`${base}/Sessions`, header, { Mode: 'voice' });
    const sessionSid = session.sid as string;

    for (const number of [consumerPhone, vendorPhone]) {
      await this.post(`${base}/Sessions/${sessionSid}/Participants`, header, { Identifier: number });
    }
    return { sessionSid, proxyNumber: (session.proxy_identifier as string) ?? null, simulated: false };
  }

  private async post(url: string, authHeader: string, params: Record<string, string>) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });
    if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
    return res.json() as Promise<Record<string, unknown>>;
  }
}
