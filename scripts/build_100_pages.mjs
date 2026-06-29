import fs from 'fs';
import path from 'path';

const consumerRoutes = [
  '/welcome', '/auth/choice', '/auth/user/login', '/auth/user/otp', '/auth/user/register',
  '/home', '/catalog', '/job/new', '/job/bids', '/job/escrow', '/job/verify', '/job/complete',
  '/wallet', '/profile', '/settings', '/disputes', '/vouchers', '/diagnostics', '/market', '/high-ticket'
];

const providerRoutes = [
  '/welcome', '/auth/vendor/login', '/auth/vendor/otp', '/auth/vendor/register',
  '/dashboard', '/bids', '/bids/active', '/jobs', '/jobs/active', '/jobs/verify', '/wallet',
  '/availability', '/profile', '/settings', '/disputes'
];

const adminRoutes = [
  '/dashboard', '/users', '/vendors', '/jobs', '/disputes', '/escrow-queue',
  '/catalog-requests', '/price-estimates', '/risk-matrix', '/settings'
];

function createPages(baseDir, routes) {
  routes.forEach(route => {
    let routePath = route === '/' ? '/index' : route;
    let fullPath = path.join(baseDir, 'src/app', routePath);
    fs.mkdirSync(fullPath, { recursive: true });
    fs.writeFileSync(path.join(fullPath, 'page.tsx'), `
export default function Page() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">FixIt Enterprise</h1>
      <h2 className="text-2xl text-blue-400">{ \`${route} Page\` }</h2>
    </div>
  );
}
`);
  });
}

createPages('e:/.services_app/apps/consumer-web', consumerRoutes);
createPages('e:/.services_app/apps/vendor-web', providerRoutes);
createPages('e:/.services_app/apps/admin-web', adminRoutes);

console.log('Successfully scaffolded enterprise pages for Consumer, Provider, and Admin apps.');
