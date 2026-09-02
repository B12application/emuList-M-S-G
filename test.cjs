const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('dist/index.html', 'utf8');
const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
if (!match) {
  console.log('Could not find JS file in index.html');
  process.exit(1);
}

const jsFile = match[1];
console.log('Found JS:', jsFile);

const jsContent = fs.readFileSync(path.join('dist', jsFile.replace(/^\//, '')), 'utf8');
try {
  new Function(jsContent);
  console.log('JS parsed successfully');
} catch(e) {
  console.error('Parse error:', e);
}
