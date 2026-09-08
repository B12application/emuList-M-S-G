const sharp = require('sharp');
const fs = require('fs');

const svg = `<svg viewBox="0 0 100 100" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#18181b" rx="22"/>
  <path d="M14 28L26 16H36V84H14V28Z" fill="#f59e0b"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M44 16H68C80.1503 16 90 25.8497 90 38C90 45.5 86.2 52.1 80.5 56C87.4 60.1 92 67.5 92 76C92 80.4 88.4 84 84 84H44V16ZM58 30H66C70.4183 30 74 33.5817 74 38C74 42.4183 70.4183 46 66 46H58V30ZM58 58H68C72.4183 58 76 61.5817 76 66C76 70.4183 72.4183 74 68 74H58V58Z" fill="#f59e0b"/>
</svg>`;

sharp(Buffer.from(svg)).png().toFile('scratch/current_b12_svg.png').then(() => {
  console.log('Saved scratch/current_b12_svg.png');
});
