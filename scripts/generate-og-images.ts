/**
 * generate-og-images.ts
 *
 * Build-time OG image generation using Satori + Resvg.
 * Generates multiple OG images for different pages with
 * optional per-page background images and accent colors.
 *
 * Run: npx tsx scripts/generate-og-images.ts
 *
 * @author    Jo Zapf <https://jozapf.de>
 * @license   MIT
 * @version   1.0.0
 * @since     2025-12
 * @see       https://github.com/JoZapf/nextjs-static-og-generator
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// ============================================================================
// CONFIGURATION
// ============================================================================

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const OUTPUT_DIR = join(PROJECT_ROOT, 'public', 'og');
const FONTS_DIR = join(PROJECT_ROOT, 'assets', 'fonts');

// Default background image (used when page has no bgImage override)
const DEFAULT_BG_PATH = join(PROJECT_ROOT, 'assets', 'bg', 'og-background.jpg');
const DEFAULT_BG_URL = 'https://assets.jozapf.de/jpg/og_image_v2_1200x630_jozapf_de.jpg';

// ============================================================================
// PAGE CONFIGURATIONS - Add your pages here
// ============================================================================

interface PageConfig {
  slug: string;        // Used for filename: og-{slug}.png
  title: string;       // Main headline
  subtitle: string;    // Secondary text
  description: string; // Longer description
  badge: string;       // Top badge text
  // Optional: Per-page background image (path relative to project root)
  bgImage?: string;
  // Optional: Override colors per page
  accentColors?: {
    start: string;
    middle: string;
    end: string;
  };
}

const PAGES: PageConfig[] = [
  // Homepage
  {
    slug: 'home',
    title: 'Dynamic OG Generator',
    subtitle: 'Build-Time Social Media Images',
    description: 'Generate beautiful Open Graph images at build time for Next.js static export projects. No server required.',
    badge: 'github.com',
  },
  // Documentation page
  {
    slug: 'docs',
    title: 'Documentation',
    subtitle: 'Setup & Configuration Guide',
    description: 'Learn how to integrate the Dynamic OG Generator into your Next.js project with step-by-step instructions.',
    badge: 'docs',
    accentColors: {
      start: '#3b82f6',  // Blue
      middle: '#8b5cf6', // Purple
      end: '#ec4899',    // Pink
    },
  },
  // Example blog post
  {
    slug: 'blog-getting-started',
    title: 'Getting Started',
    subtitle: 'Your First OG Image in 5 Minutes',
    description: 'A quick tutorial on creating professional social media preview images for your static website.',
    badge: 'blog',
    accentColors: {
      start: '#10b981',  // Green
      middle: '#14b8a6', // Teal
      end: '#06b6d4',    // Cyan
    },
  },

  // ── Example: Per-page background image ──────────────
  // {
  //   slug: 'special-page',
  //   title: 'Special Page',
  //   subtitle: 'With Custom Background',
  //   description: 'This page uses its own background image.',
  //   badge: 'example',
  //   bgImage: 'assets/bg/special-background.jpg',
  // },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function downloadFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const request = (url: string) => {
      https.get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            request(redirectUrl);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    };
    request(url);
  });
}

function loadImageAsBase64(imagePath: string): string {
  const imageBuffer = readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const ext = imagePath.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  const mimeType = mimeTypes[ext || 'jpg'] || 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}

// ============================================================================
// OG IMAGE TEMPLATE
// ============================================================================
//
// Visual layer stack (bottom to top):
//
//   1. Background Image    – full-bleed photo, covers entire 1200×630 canvas
//   2. Dark Overlay         – semi-transparent gradient, dims the photo for text contrast
//   3. Glassmorphism Card   – centered frosted card (1100×550), holds all text
//   4. Glossy Overlay       – subtle top-half shine on the card (faux light reflection)
//   5. Content elements     – badge, title, subtitle, divider, description
//
// Color system:
//   rgba(r,g,b, ALPHA) – alpha controls opacity: 0.0 = invisible, 1.0 = fully opaque
//   #ffffff = white, used at varying alpha levels for the glass effect
//
// Text opacity hierarchy (highest → lowest visual weight):
//   Title       #ffffff      = 100% white
//   Badge       rgba 0.9     =  90% white
//   Subtitle    rgba 0.85    =  85% white
//   Description rgba 0.7     =  70% white
//
// Satori constraint: no CSS classes, no shorthand – every style must be an inline object.
// ============================================================================

function createOGTemplate(page: PageConfig, bgImageDataUrl: string) {
  // Accent colors for the divider line – overridable per page via accentColors
  const colors = page.accentColors || {
    start: '#e26b34',  // Orange (default, left)
    middle: '#336851', // Green  (default, center)
    end: '#1b3c65',    // Blue   (default, right)
  };

  return {
    type: 'div',
    props: {
      // ROOT CONTAINER – the full 1200×630 canvas
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',       // vertical center
        justifyContent: 'center',   // horizontal center
        position: 'relative',       // anchor for absolute children
        fontFamily: 'Montserrat',
        overflow: 'hidden',         // clip anything outside canvas
      },
      children: [

        // ── LAYER 1: BACKGROUND IMAGE ──────────────────────────────────
        // Fills entire canvas. objectFit:'cover' crops to fit (no distortion).
        // Which image is used depends on bgImage per page or the default.
        {
          type: 'img',
          props: {
            src: bgImageDataUrl,
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            },
          },
        },

        // ── LAYER 2: DARK OVERLAY ──────────────────────────────────────
        // Semi-transparent gradient over the photo. Makes white text readable.
        // Direction: 135deg = top-left → bottom-right diagonal.
        //
        // Color stops:
        //   rgba(26,26,46, 0.88)  – dark navy,    88% opaque (top-left)
        //   rgba(22,33,62, 0.85)  – dark blue,    85% opaque (center)
        //   rgba(15,52,96, 0.82)  – deeper blue,  82% opaque (bottom-right)
        //
        // ↑ Increase alpha values → darker overlay → more contrast, less photo visible.
        // ↓ Decrease alpha values → lighter overlay → more photo visible, less contrast.
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(26,26,46,0.88) 0%, rgba(22,33,62,0.85) 50%, rgba(15,52,96,0.82) 100%)',
            },
          },
        },

        // ── LAYER 3: GLASSMORPHISM CARD ────────────────────────────────
        // A frosted-glass card that sits centered on the canvas.
        // 1100×550 inside 1200×630 = 50px visible edge on each side.
        {
          type: 'div',
          props: {
            style: {
              width: 1100,                // card width in px
              height: 550,                // card height in px
              borderRadius: 32,           // rounded corners (more pronounced than main project)
              padding: '48px 56px',       // inner spacing (top/bottom, left/right)
              display: 'flex',
              flexDirection: 'column',    // stack children vertically
              alignItems: 'center',       // center children horizontally
              justifyContent: 'center',   // center children vertically
              position: 'relative',       // anchor for glossy overlay + badge

              // Card fill: white at 12% → 5% opacity = visible frosted tint
              // 145deg = top-left to bottom-right, slightly steeper than the dark overlay
              background: 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',

              // Card border: white at 18% opacity = faint edge line
              border: '1px solid rgba(255,255,255,0.18)',

              // Drop shadow: black 50% opacity, 25px blur, pushed down
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            },
            children: [

              // ── LAYER 4: GLOSSY OVERLAY ──────────────────────────────
              // Covers the top 50% of the card. Simulates light hitting a glass surface.
              // Gradient: white at 15% opacity at top → 2% at 60% height → fully transparent.
              // Increase 0.15/0.02 for a shinier look, decrease for subtler effect.
              {
                type: 'div',
                props: {
                  style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '50%',                  // covers top half of card
                    borderRadius: '32px 32px 0 0',  // match card's top corners
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 60%, transparent 100%)',
                  },
                },
              },

              // ── BADGE ────────────────────────────────────────────────
              // Small pill label pinned to top of card. Shows domain/label.
              // White bg at 15% opacity, border at 25% opacity.
              // Text: white at 90% opacity, Montserrat Medium (500).
              {
                type: 'div',
                props: {
                  style: {
                    position: 'absolute',
                    top: 28,               // 28px from card top
                    display: 'flex',
                    padding: '10px 28px',  // vertical, horizontal padding
                    borderRadius: 50,      // fully rounded pill shape
                    background: 'rgba(255,255,255,0.15)',   // 15% white fill
                    border: '1px solid rgba(255,255,255,0.25)', // 25% white edge
                    fontSize: 20,
                    fontWeight: 500,       // Medium weight
                    color: 'rgba(255,255,255,0.9)',  // 90% white text
                    letterSpacing: '0.5px',
                  },
                  children: page.badge,
                },
              },

              // ── TITLE ────────────────────────────────────────────────
              // Main headline. Largest text on the image.
              // 64px, Bold (700), fully opaque white.
              // letterSpacing: -1px tightens character spacing for a modern look.
              {
                type: 'div',
                props: {
                  style: {
                    marginTop: 32,
                    fontSize: 64,          // ~35 chars max before overflow
                    fontWeight: 700,       // Bold
                    color: '#ffffff',       // 100% white – highest visual weight
                    textAlign: 'center',
                    lineHeight: 1.1,       // tight line spacing
                    letterSpacing: '-1px', // slightly condensed
                  },
                  children: page.title,
                },
              },

              // ── SUBTITLE ─────────────────────────────────────────────
              // Secondary text below title.
              // 32px, Medium (500), white at 85% opacity = slightly dimmer than title.
              {
                type: 'div',
                props: {
                  style: {
                    marginTop: 8,
                    fontSize: 32,          // ~50 chars max before overflow
                    fontWeight: 500,       // Medium
                    color: 'rgba(255,255,255,0.85)', // 85% white – visual hierarchy below title
                    textAlign: 'center',
                    lineHeight: 1.3,
                  },
                  children: page.subtitle,
                },
              },

              // ── DIVIDER ──────────────────────────────────────────────
              // Thin horizontal accent line between subtitle and description.
              // 120px wide, 3px tall. Uses accentColors (per-page or default).
              // Default gradient: orange → green → blue (brand colors).
              {
                type: 'div',
                props: {
                  style: {
                    marginTop: 32,
                    width: 120,
                    height: 3,
                    borderRadius: 2,
                    background: `linear-gradient(90deg, ${colors.start} 0%, ${colors.middle} 50%, ${colors.end} 100%)`,
                  },
                },
              },

              // ── DESCRIPTION ──────────────────────────────────────────
              // Longer text below divider. Wraps at 900px max width (~2 lines).
              // 24px, Regular (400), white at 70% opacity = clearly subordinate to title/subtitle.
              // ~150 chars max before it starts to look crowded.
              {
                type: 'div',
                props: {
                  style: {
                    marginTop: 28,
                    maxWidth: 900,         // text wrap boundary
                    fontSize: 24,
                    fontWeight: 400,       // Regular
                    color: 'rgba(255,255,255,0.7)', // 70% white – lowest in text hierarchy
                    textAlign: 'center',
                    lineHeight: 1.5,       // comfortable reading spacing
                  },
                  children: page.description,
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// ============================================================================
// SINGLE IMAGE GENERATION
// ============================================================================

async function generateOGImage(
  page: PageConfig,
  bgImageDataUrl: string,
  fonts: { name: string; data: Buffer; weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900; style: 'normal' }[]
): Promise<string> {
  const filename = `og-${page.slug}.png`;
  
  const svg = await satori(createOGTemplate(page, bgImageDataUrl) as React.ReactNode, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: OG_WIDTH },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  const outputPath = join(OUTPUT_DIR, filename);
  writeFileSync(outputPath, pngBuffer);
  
  return filename;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n🖼️  OG Image Generator');
  console.log('═'.repeat(50));
  console.log(`   Generating ${PAGES.length} image(s)...\n`);

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  console.log(`✓ Output directory: ${OUTPUT_DIR}`);

  // ── Load background images ──────────────────────────
  // Collect unique background image paths
  const bgPaths = new Set<string>();
  bgPaths.add(DEFAULT_BG_PATH); // Always load default
  for (const page of PAGES) {
    if (page.bgImage) {
      bgPaths.add(join(PROJECT_ROOT, page.bgImage));
    }
  }

  // Load/download default background
  const bgCache = new Map<string, string>();

  if (existsSync(DEFAULT_BG_PATH)) {
    console.log('✓ Loading default background image...');
    bgCache.set(DEFAULT_BG_PATH, loadImageAsBase64(DEFAULT_BG_PATH));
  } else {
    console.log('⬇️  Downloading default background image...');
    try {
      const buffer = await downloadFile(DEFAULT_BG_URL);
      const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      bgCache.set(DEFAULT_BG_PATH, dataUrl);

      // Save for future builds
      const bgDir = dirname(DEFAULT_BG_PATH);
      if (!existsSync(bgDir)) mkdirSync(bgDir, { recursive: true });
      writeFileSync(DEFAULT_BG_PATH, buffer);
      console.log('   ✓ Saved locally for future builds');
    } catch (error) {
      console.error('   ❌ Failed to download background image');
      console.log('   Using gradient-only fallback');
      bgCache.set(DEFAULT_BG_PATH, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    }
  }

  // Load per-page background images
  for (const page of PAGES) {
    if (page.bgImage) {
      const fullPath = join(PROJECT_ROOT, page.bgImage);
      if (!bgCache.has(fullPath)) {
        if (existsSync(fullPath)) {
          console.log(`✓ Loading background for "${page.slug}"...`);
          bgCache.set(fullPath, loadImageAsBase64(fullPath));
        } else {
          console.warn(`⚠️  Background not found for "${page.slug}": ${page.bgImage}`);
          console.log(`   Falling back to default background`);
        }
      }
    }
  }

  // ── Load fonts ──────────────────────────────────────
  const fontFiles = ['Montserrat-Bold.ttf', 'Montserrat-Medium.ttf', 'Montserrat-Regular.ttf'];
  const fonts: { name: string; data: Buffer; weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900; style: 'normal' }[] = [];

  for (const fontFile of fontFiles) {
    const fontPath = join(FONTS_DIR, fontFile);
    if (!existsSync(fontPath)) {
      console.error(`❌ Font not found: ${fontPath}`);
      console.log('   Run "npm run setup" first to download fonts.');
      process.exit(1);
    }
    
    const weight = (fontFile.includes('Bold') ? 700 : fontFile.includes('Medium') ? 500 : 400) as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
    fonts.push({
      name: 'Montserrat',
      data: readFileSync(fontPath),
      weight,
      style: 'normal',
    });
  }
  console.log('✓ Fonts loaded');

  // ── Generate OG images ──────────────────────────────
  console.log('\n📄 Generating images:');
  
  const generated: string[] = [];
  for (const page of PAGES) {
    // Resolve background: per-page override → default
    let bgDataUrl = bgCache.get(DEFAULT_BG_PATH) || '';
    if (page.bgImage) {
      const fullPath = join(PROJECT_ROOT, page.bgImage);
      bgDataUrl = bgCache.get(fullPath) || bgDataUrl;
    }

    process.stdout.write(`   → ${page.slug}...`);
    try {
      const filename = await generateOGImage(page, bgDataUrl, fonts);
      generated.push(filename);
      console.log(` ✓ ${filename}`);
    } catch (error) {
      console.log(` ❌ Failed`);
      console.error(`     ${error}`);
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log(`✅ Generated ${generated.length}/${PAGES.length} OG images:`);
  generated.forEach(f => console.log(`   • public/og/${f}`));
  console.log('');
}

main().catch(console.error);
