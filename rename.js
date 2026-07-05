const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (f === 'node_modules' || f === 'dist' || f === '.git') return;
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

let count1 = 0;
let count2 = 0;

walk(__dirname, (filePath) => {
  if (!filePath.match(/\.(ts|tsx|js|jsx|json|md|html|css|sql)$/)) return;
  if (filePath.endsWith('rename.js')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  if (newContent.includes('FixIt One')) {
    newContent = newContent.replace(/FixIt One/g, 'FixIt Now');
    count1++;
  }
  if (newContent.includes('fixit.one')) {
    newContent = newContent.replace(/fixit\.one/g, 'fixit-now.xyz');
    count2++;
  }
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated', filePath);
  }
});

console.log(`Replaced 'FixIt One' in ${count1} files.`);
console.log(`Replaced 'fixit.one' in ${count2} files.`);
