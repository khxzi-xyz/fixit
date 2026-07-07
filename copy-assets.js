const fs = require('fs');
const path = require('path');

const files = [
    "status-invisible-offline-gray.png",
    "status-dnd-gray.png",
    "status-idle-gray.png",
    "status-online-gray.png",
    "red-lock-ids.png",
    "inviterbadge.png",
    "ima-vendor-shop-white.png",
    "ids-verified-approved-badge.png",
    "docs-applicationunderreview-ids.png",
    "docs-approved-ids.png",
    "docs-denied-ids.png",
    "goldenverifiedbadgepro.png",
    "bluetickverifiedbadge.png",
    "badge-user-denied-ids.png",
    "928205-membericon-badge.png",
    "verifieddeveloperbadgeblue.png"
];

const destPaths = [
    'apps/consumer-web/public/badges',
    'apps/consumer-web/public/status',
    'apps/vendor-app/public/badges',
    'apps/vendor-app/public/status',
];

destPaths.forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));

files.forEach(f => {
    const src = path.join(__dirname, f);
    if (fs.existsSync(src)) {
        if (f.startsWith('status')) {
            fs.copyFileSync(src, path.join(__dirname, 'apps/consumer-web/public/status', f));
            fs.copyFileSync(src, path.join(__dirname, 'apps/vendor-app/public/status', f));
        } else {
            fs.copyFileSync(src, path.join(__dirname, 'apps/consumer-web/public/badges', f));
            fs.copyFileSync(src, path.join(__dirname, 'apps/vendor-app/public/badges', f));
        }
    }
});
console.log('Done');
