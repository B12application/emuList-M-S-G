const sharp = require('sharp');

function getSvg(withSubtext = false) {
  return `<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="50%" stop-color="#0c0a09"/>
      <stop offset="100%" stop-color="#050505"/>
    </linearGradient>
    <linearGradient id="goldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb"/>
      <stop offset="30%" stop-color="#fde047"/>
      <stop offset="70%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
    <linearGradient id="capsuleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#b45309" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="pillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>

  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#bgGrad2)"/>
  <rect x="20" y="20" width="472" height="472" rx="108" fill="none" stroke="#f59e0b" stroke-opacity="0.3" stroke-width="3"/>

  <!-- Central Vitamin Capsule Silhouette at 45 degree angle -->
  <g transform="translate(256, 256) rotate(-35) translate(-256, -256)">
    <!-- Pill Capsule Container -->
    <rect x="166" y="96" width="180" height="320" rx="90" fill="url(#capsuleGrad)" stroke="url(#goldGrad2)" stroke-width="8"/>
    <!-- Top Half Solid Amber (Pill Cap) -->
    <path d="M166 256 V186 C166 136.3 206.3 96 256 96 C305.7 96 346 136.3 346 186 V256 Z" fill="url(#pillGrad)"/>
    <!-- Divider Line with Glow -->
    <line x1="166" y1="256" x2="346" y2="256" stroke="#fff" stroke-width="4" stroke-opacity="0.6"/>
  </g>

  <!-- Foreground Bold Typography: B12 Centered -->
  <text x="256" y="${withSubtext ? 300 : 312}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${withSubtext ? 148 : 160}" font-weight="900" letter-spacing="-4" fill="#ffffff" filter="drop-shadow(0 8px 24px rgba(0,0,0,0.8))">
    B<tspan fill="#fbbf24">12</tspan>
  </text>
  ${withSubtext ? `<text x="256" y="342" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" letter-spacing="8" fill="#a1a1aa">DIGITAL MEMORY</text>` : ''}
</svg>`;
}

async function test() {
  await sharp(Buffer.from(getSvg(false))).resize(512, 512).png().toFile('scratch/c2_clean_512.png');
  await sharp(Buffer.from(getSvg(false))).resize(64, 64).png().toFile('scratch/c2_clean_64.png');
  await sharp(Buffer.from(getSvg(false))).resize(32, 32).png().toFile('scratch/c2_clean_32.png');
  console.log('Done test');
}

test().catch(console.error);
