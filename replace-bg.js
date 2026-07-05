const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('bg-primary/10')) {
        const newContent = content.replace(/bg-primary\/10/g, 'bg-slate-100 dark:bg-slate-800');
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
      if (content.includes('bg-primary/5')) {
        const newContent = content.replace(/bg-primary\/5/g, 'bg-slate-50 dark:bg-slate-900');
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

replaceInDir('E:\\.services_app\\apps\\consumer-web\\src');
console.log('Replacement complete.');
