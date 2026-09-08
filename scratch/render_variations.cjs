const sharp = require('sharp');
const fs = require('fs');

// Variation A: "Obsidian Gold Pure Monogram"
// Custom precision-crafted B12 glyph, perfectly centered, optical kerning, vibrant amber gradient, luxury obsidian background with subtle radial highlight and gold rim
const svgA = `<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgObsidian" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e1e24"/>
      <stop offset="60%" stop-color="#0e0e11"/>
      <stop offset="100%" stop-color="#050507"/>
    </linearGradient>
    <radialGradient id="topHighlight" cx="50%" cy="15%" r="65%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="goldGradient" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb"/>
      <stop offset="25%" stop-color="#fde047"/>
      <stop offset="60%" stop-color="#f59e0b"/>
      <stop offset="90%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#f4f4f5"/>
      <stop offset="100%" stop-color="#a1a1aa"/>
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" stop-opacity="0.5"/>
      <stop offset="30%" stop-color="#f59e0b" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#78350f" stop-opacity="0.1"/>
    </linearGradient>
    <filter id="shadowMark" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000" flood-opacity="0.6"/>
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#f59e0b" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Background squircle (standard 22% squircle radius = 112px on 512px) -->
  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#bgObsidian)"/>
  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#topHighlight)"/>
  <rect x="17" y="17" width="478" height="478" rx="111" fill="none" stroke="url(#borderGrad)" stroke-width="3"/>

  <!-- Centered B12 Mark Group -->
  <g filter="url(#shadowMark)">
    <!-- Letter B -->
    <path fill="url(#goldGradient)" fill-rule="evenodd" clip-rule="evenodd" d="
      M 78 126
      C 78 114.95 86.95 106 98 106
      H 194
      C 238 106 270 134 270 172
      C 270 198 252 222 226 232
      C 260 242 282 268 282 306
      C 282 350 246 386 196 386
      H 98
      C 86.95 386 78 377.05 78 366
      V 126
      Z
      M 136 156
      V 218
      H 188
      C 210 218 224 204 224 187
      C 224 170 210 156 188 156
      H 136
      Z
      M 136 268
      V 336
      H 192
      C 216 336 234 322 234 302
      C 234 282 216 268 192 268
      H 136
      Z"
    />

    <!-- Digit 1 -->
    <path fill="url(#goldGradient)" d="
      M 306 200
      L 334 178
      C 336.5 176 340 177.8 340 181
      V 380
      C 340 383.3 337.3 386 334 386
      H 312
      C 308.7 386 306 383.3 306 380
      V 214
      L 294 223
      C 291 225.2 286.8 224.5 284.6 221.5
      L 278 212.5
      C 276 209.8 276.7 206 279.5 204
      L 306 200
      Z"
    />

    <!-- Digit 2 -->
    <path fill="url(#goldGradient)" d="
      M 362 214
      C 362 186 384 168 414 168
      C 444 168 466 186 466 214
      C 466 240 448 266 418 296
      L 392 322
      H 456
      C 461.5 322 466 326.5 466 332
      V 340
      C 466 345.5 461.5 350 456 350
      H 374
      C 364.5 350 359 339 365 331
      L 412 284
      C 432 264 442 246 442 228
      C 442 214 430 202 414 202
      C 398 202 386 214 386 228
      C 386 233.5 381.5 238 376 238
      H 372
      C 366.5 238 362 233.5 362 228
      V 214
      Z"
    />
  </g>

  <!-- Modern dynamic accent element: glowing vitamin energy node top-right -->
  <circle cx="414" cy="98" r="10" fill="#fde047"/>
  <circle cx="414" cy="98" r="18" fill="#f59e0b" opacity="0.3"/>
</svg>`;

// Variation B: "The Geometric Capsule B12"
// Futuristic capsule badge with dynamic diagonal slice, embossed B12 logo mark
const svgB = `<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgObsidianB" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="capsuleGradB1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="capsuleGradB2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#27272a"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>
    <filter id="shadowB" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000" flood-opacity="0.7"/>
    </filter>
  </defs>

  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#bgObsidianB)"/>
  <rect x="17" y="17" width="478" height="478" rx="111" fill="none" stroke="#f59e0b" stroke-opacity="0.25" stroke-width="2"/>

  <!-- Centered Diagonal High-Tech Capsule / Shield -->
  <g filter="url(#shadowB)" transform="translate(256, 256) rotate(-30) translate(-256, -256)">
    <!-- Main Capsule Outline -->
    <rect x="166" y="96" width="180" height="320" rx="90" fill="none" stroke="#f59e0b" stroke-width="4" stroke-opacity="0.4"/>
    <!-- Top Half Amber -->
    <path d="M 168 254 V 186 C 168 137.4 207.4 98 256 98 C 304.6 98 344 137.4 344 186 V 254 Z" fill="url(#capsuleGradB1)"/>
    <!-- Bottom Half Charcoal -->
    <path d="M 168 258 V 326 C 168 374.6 207.4 414 256 414 C 304.6 414 344 374.6 344 326 V 258 Z" fill="url(#capsuleGradB2)"/>
    <!-- Center Dividing Core Line with Glow -->
    <line x1="164" y1="256" x2="348" y2="256" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
  </g>

  <!-- Bold Central Typographic B12 (Horizontal overlay) -->
  <g filter="url(#shadowB)">
    <!-- B -->
    <text x="180" y="305" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="160" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="-3">B</text>
    <!-- 12 in Bright Glowing Gold -->
    <text x="325" y="305" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="160" font-weight="900" fill="#fbbf24" text-anchor="middle" letter-spacing="-4">12</text>
  </g>
</svg>`;

// Variation C: "Iconic Futuristic Monogram"
// Cutting-edge tech ligature: The 'B' is constructed from geometric architectural blocks that also incorporate the '1' and '2' in optical synergy, with glowing circuit tracks
const svgC = `<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgC" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090b"/>
      <stop offset="50%" stop-color="#111115"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="goldC" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="goldCSoft" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
  </defs>

  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#bgC)"/>
  <rect x="17" y="17" width="478" height="478" rx="111" fill="none" stroke="url(#goldC)" stroke-opacity="0.35" stroke-width="3"/>

  <!-- Glowing background polygon -->
  <circle cx="256" cy="256" r="180" fill="#f59e0b" opacity="0.08" filter="blur(30px)"/>

  <!-- Intertwined Geometric B12 Mark -->
  <g transform="translate(100, 116)">
    <!-- Vertical Pillar 1 (Left of B and also acting as the numeral 1) -->
    <path fill="url(#goldC)" d="
      M 32 30
      L 64 0
      H 90
      V 280
      H 40
      C 35.5 280 32 276.5 32 272
      V 30
      Z"
    />

    <!-- Upper Loop of B -->
    <path fill="url(#goldC)" fill-rule="evenodd" clip-rule="evenodd" d="
      M 112 0
      H 196
      C 238 0 268 28 268 68
      C 268 108 238 136 196 136
      H 112
      V 0
      Z
      M 158 42
      V 94
      H 192
      C 208 42 222 54 222 68
      C 222 82 208 94 192 94
      H 158
      V 42
      Z"
    />

    <!-- Lower Loop of B that transitions into a dynamic 2 base -->
    <path fill="url(#goldCSoft)" fill-rule="evenodd" clip-rule="evenodd" d="
      M 112 144
      H 204
      C 250 144 282 174 282 216
      C 282 258 250 280 204 280
      H 112
      V 144
      Z
      M 158 186
      V 238
      H 200
      C 218 238 234 226 234 212
      C 234 198 218 186 200 186
      H 158
      Z"
    />
  </g>
</svg>`;

async function main() {
  await sharp(Buffer.from(svgA)).png().toFile('scratch/var_A.png');
  await sharp(Buffer.from(svgB)).png().toFile('scratch/var_B.png');
  await sharp(Buffer.from(svgC)).png().toFile('scratch/var_C.png');
  console.log('Variations rendered!');
}

main().catch(console.error);
