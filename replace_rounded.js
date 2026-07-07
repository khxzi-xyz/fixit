const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      content = content.replace(/rounded-xl/g, 'rounded-full');
      content = content.replace(/rounded-2xl/g, 'rounded-full');
      content = content.replace(/rounded-lg/g, 'rounded-full');
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir('e:/.services_app/apps/consumer-web/src');
processDir('e:/.services_app/apps/vendor-app/src');
