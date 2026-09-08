const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Concept 1: Modern Obsidian Gold Squircle with Bold Aerodynamic "B12" Monogram
// Ultra-legible, sleek, Apple/Linear style
const svg1 = `<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="50%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#040405"/>
    </linearGradient>
    <linearGradient id="goldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="35%" stop-color="#fbbf24"/>
      <stop offset="85%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="glowGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="borderGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.6"/>
      <stop offset="40%" stop-color="#f59e0b" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#78350f" stop-opacity="0.4"/>
    </linearGradient>
    <radialGradient id="centerGlow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
    <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Base Squircle -->
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#bgGrad1)"/>
  
  <!-- Subtle ambient inner glow -->
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#centerGlow)"/>

  <!-- Sleek metallic border -->
  <rect x="18" y="18" width="476" height="476" rx="106" fill="none" stroke="url(#borderGrad1)" stroke-width="4"/>

  <!-- Logo Mark: Modern Bold Geometric "B" with dynamic cut & connected "12" -->
  <g transform="translate(48, 100)">
    <!-- Letter B: Modern geometric glyph with angled cut terminal -->
    <path fill="url(#goldGrad1)" fill-rule="evenodd" clip-rule="evenodd" d="
      M40 24
      C40 10.745 50.745 0 64 0
      H165
      C215 0 252 35 252 82
      C252 116 230 144 198 154
      C236 166 262 198 262 238
      C262 288 220 324 165 324
      H64
      C50.745 324 40 313.255 40 300
      V24
      ZM106 58
      V132
      H160
      C188 132 204 115 204 95
      C204 74 188 58 160 58
      H106
      ZM106 188
      V266
      H162
      C192 266 212 248 212 227
      C212 205 192 188 162 188
      H106
      Z"
    />

    <!-- Numerals "12": High-tech sleek pill-badge or sharp companion typography -->
    <!-- "1" -->
    <path fill="url(#goldGrad1)" d="
      M285 106
      L318 80
      H338
      V316
      C338 320.4 334.4 324 330 324
      H308
      C303.6 324 300 320.4 300 316
      V128
      L282 142
      C278.5 144.5 273.5 143.5 271 140
      L262 126
      C259.8 122.5 260.8 118 264 115.5
      L285 106
      Z"
    />

    <!-- "2" -->
    <path fill="url(#goldGrad1)" d="
      M364 126
      C364 96 388 74 422 74
      C456 74 480 96 480 126
      C480 152 462 178 432 208
      L398 244
      C392 250 392 256 398 256
      H468
      C474.6 256 480 261.4 480 268
      V276
      C480 282.6 474.6 288 468 288
      H376
      C366 288 360 278 364 270
      L416 216
      C438 192 448 174 448 152
      C448 136 436 122 422 122
      C408 122 396 134 396 150
      C396 156.6 390.6 162 384 162
      H376
      C369.4 162 364 156.6 364 150
      V126
      Z"
    />
  </g>

  <!-- Micro-dot / Vitamin Spark indicator on top right -->
  <circle cx="410" cy="100" r="14" fill="#fbbf24"/>
  <circle cx="410" cy="100" r="24" fill="#f59e0b" opacity="0.3"/>
</svg>`;

// Concept 2: "Digital Vitamin Core" - Iconic Capsule / Core Badge
// Modern, futuristic pill/shield hybrid with laser cut "B12"
const svg2 = `<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
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
  <text x="256" y="300" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="148" font-weight="900" letter-spacing="-4" fill="#ffffff" filter="drop-shadow(0 8px 24px rgba(0,0,0,0.8))">
    B<tspan fill="#fbbf24">12</tspan>
  </text>
  <text x="256" y="340" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" letter-spacing="8" fill="#a1a1aa">
    DIGITAL MEMORY
  </text>
</svg>`;

// Concept 3: "Ultra-Minimalist Geometric B12 Mark"
// Pure vector ligature of B and 12, hyper-crisp, scale-independent, favicon-first
const svg3 = `<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="goldGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="40%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="accentGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
    <linearGradient id="borderGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.1"/>
    </linearGradient>
  </defs>

  <!-- Squircle Background -->
  <rect x="16" y="16" width="480" height="480" rx="120" fill="url(#bgGrad3)"/>
  <rect x="18" y="18" width="476" height="476" rx="118" fill="none" stroke="url(#borderGrad3)" stroke-width="4"/>

  <!-- Centered Iconic "B12" Modern Typographic Badge -->
  <g transform="translate(66, 120)">
    <!-- 'B' in Brilliant Gold -->
    <path fill="url(#goldGrad3)" fill-rule="evenodd" clip-rule="evenodd" d="
      M20 16
      C20 7.16 27.16 0 36 0
      H148
      C198 0 236 34 236 78
      C236 108 216 133 186 142
      C224 152 248 182 248 222
      C248 268 206 302 152 302
      H36
      C27.16 302 20 294.84 20 286
      V16
      ZM82 54
      V122
      H144
      C168 122 182 108 182 88
      C182 68 168 54 144 54
      H82
      ZM82 176
      V248
      H146
      C172 248 190 234 190 212
      C190 190 172 176 146 176
      H82
      Z"
    />

    <!-- '1' in Crisp White/Silver -->
    <path fill="url(#accentGrad3)" d="
      M272 104
      L304 80
      H322
      V294
      C322 298.4 318.4 302 314 302
      H294
      C289.6 302 286 298.4 286 294
      V120
      L270 132
      C266.5 134.5 261.5 133.5 259 130
      L252 120
      C250 117 251 113 254 111
      L272 104
      Z"
    />

    <!-- '2' in Crisp White/Silver with Gold Accent Base -->
    <path fill="url(#accentGrad3)" d="
      M348 120
      C348 92 370 72 400 72
      C430 72 452 92 452 120
      C452 144 436 168 408 196
      L378 228
      C372 234 374 240 380 240
      H442
      C447.5 240 452 244.5 452 250
      V256
      C452 261.5 447.5 266 442 266
      H358
      C348 266 342 256 348 248
      L394 200
      C414 178 424 162 424 142
      C424 128 412 116 400 116
      C388 116 376 128 376 142
      C376 147.5 371.5 152 366 152
      H358
      C352.5 152 348 147.5 348 142
      V120
      Z"
    />
  </g>
</svg>`;

async function run() {
  await sharp(Buffer.from(svg1)).png().toFile('scratch/concept_1_gold_monogram.png');
  await sharp(Buffer.from(svg2)).png().toFile('scratch/concept_2_capsule_core.png');
  await sharp(Buffer.from(svg3)).png().toFile('scratch/concept_3_dual_tone.png');
  console.log('All concepts generated!');
}

run().catch(console.error);
