/**
 * FixIt Now -WhatsApp Web login (terminal QR).
 *
 * Run:  node scripts/whatsapp-login.js
 *
 * Prints a QR code in the terminal. Open WhatsApp on the owner's phone →
 * Settings → Linked Devices → Link a Device → scan it. The session is saved to
 * the same LocalAuth folder the backend uses (WHATSAPP_SESSION_DIR, default
 * ".wwebjs_auth"), so once linked here, the running backend sends OTP/order
 * messages from that WhatsApp account -no Twilio, no per-message cost.
 *
 * One-time deps:  npm i whatsapp-web.js qrcode-terminal
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const fs = require('fs');

function getBrowserPath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}
let Client, LocalAuth, qrcodeTerminal;
try {
  ({ Client, LocalAuth } = require('whatsapp-web.js'));
  qrcodeTerminal = require('qrcode-terminal');
} catch (e) {
  console.error('\n[!] Missing deps. Run:  npm i whatsapp-web.js qrcode-terminal\n');
  process.exit(1);
}

const dataPath = process.env.WHATSAPP_SESSION_DIR || path.join(process.cwd(), '.wwebjs_auth');

const client = new Client({
  authStrategy: new LocalAuth({ dataPath }),
  puppeteer: {
    headless: true,
    executablePath: getBrowserPath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
});

client.on('qr', (qr) => {
  console.log('\n=== Scan this QR with WhatsApp (Linked Devices) ===\n');
  qrcodeTerminal.generate(qr, { small: true });
  console.log('\nWaiting for scan…  (session will be saved to ' + dataPath + ')\n');
});

client.on('authenticated', () => console.log('[✓] Authenticated.'));
client.on('ready', () => {
  console.log('\n[✓] WhatsApp is READY and linked. Session saved.');
  console.log('    Set WHATSAPP_ENABLED=true in .env and (re)start the backend to send OTPs.\n');
  setTimeout(() => process.exit(0), 1500);
});
client.on('auth_failure', (m) => { console.error('[x] Auth failure:', m); process.exit(1); });

console.log('Starting WhatsApp client… (first run downloads a headless browser, ~1–2 min)');
client.initialize();
