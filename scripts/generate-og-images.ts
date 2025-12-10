/**
 * generate-og-images.ts
 * 
 * Build-time OG image generation using Satori + Resvg.
 * Generates multiple OG images for different pages.
 * 
 * Run: npx tsx scripts/generate-og-images.ts
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
const BG_IMAGE_PATH = join(PROJECT_ROOT, 'assets', 'bg', 'og-background.jpg');

// Background image URL (fallback if local file doesn't exist)
const BG_IMAGE_URL = 'https://assets.jozapf.de/jpg/og_image_v2_1200x630_jozapf_de.jpg';

// ============================================================================
// PAGE CONFIGURATIONS - Add your pages here
// ============================================================================

interface PageConfig {
  slug: string;        // Used for filename: og-{slug}.png
  title: string;       // Main headline
  subtitle: string;    // Secondary text
  description: string; // Longer description
  badge: string;       // Top badge text
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

function createOGTemplate(page: PageConfig, bgImageDataUrl: string) {
  const colors = page.accentColors || {
    start: '#e26b34',  // Orange (default)
    middle: '#336851', // Green
    end: '#1b3c65',    // Blue
  };

  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        fontFamily: 'Montserrat',
        overflow: 'hidden',
      },
      children: [
        // Background Image
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
        // Dark overlay
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
        // Main Card
        {
          type: 'div',
          props: {
            style: {
              width: 1100,
              height: 550,
              borderRadius: 32,
              padding: '48px 56px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            },
            children: [
              // Glossy overlay
              {
                type: 'div',
                props: {
                  style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    borderRadius: '32px 32px 0 0',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 60%, transparent 100%)',
                  },
                },
              },
              // Badge
              {
                type: 'div',
                props: {
                  style: {
                    position: 'absolute',
                    top: 28,
                    display: 'flex',
                    padding: '10px 28px',
                    borderRadius: 50,
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    fontSize: 20,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.9)',
                    letterSpacing: '0.5px',
                  },
                  children: page.badge,
                },
              },
              // Title
              {
                type: 'div',
                props: {
                  style: {
                    marginTop: 32,
                    fontSize: 64,
                    fontWeight: 700,
                    color: '#ffffff',
                    textAlign: 'center',
                    lineHeight: 1.1,
                    letterSpacing: '-1px',
                  },
                  children: page.title,
                },
              },
              // Subtitle
              {
                type: 'div',
                props: {
                  style: {
                    marginTop: 8,
                    fontSize: 32,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.85)',
                    textAlign: 'center',
                    lineHeight: 1.3,
                  },
                  children: page.subtitle,
                },
              },
              // Divider (with custom colors)
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
              // Description
              {
                type: 'div',
                props: {
                  style: {
                    marginTop: 28,
                    maxWidth: 900,
                    fontSize: 24,
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.7)',
                    textAlign: 'center',
                    lineHeight: 1.5,
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
  fonts: { name: string; data: Buffer; weight: number; style: 'normal' }[]
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

  // Load or download background image
  let bgImageDataUrl: string;
  if (existsSync(BG_IMAGE_PATH)) {
    console.log('✓ Loading local background image...');
    bgImageDataUrl = loadImageAsBase64(BG_IMAGE_PATH);
  } else {
    console.log('⬇️  Downloading background image...');
    try {
      const buffer = await downloadFile(BG_IMAGE_URL);
      bgImageDataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      
      // Save for future builds
      const bgDir = dirname(BG_IMAGE_PATH);
      if (!existsSync(bgDir)) mkdirSync(bgDir, { recursive: true });
      writeFileSync(BG_IMAGE_PATH, buffer);
      console.log('   ✓ Saved locally for future builds');
    } catch (error) {
      console.error('   ❌ Failed to download background image');
      console.log('   Using gradient-only fallback');
      bgImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }
  }

  // Load fonts
  const fontFiles = ['Montserrat-Bold.ttf', 'Montserrat-Medium.ttf', 'Montserrat-Regular.ttf'];
  const fonts: { name: string; data: Buffer; weight: number; style: 'normal' }[] = [];

  for (const fontFile of fontFiles) {
    const fontPath = join(FONTS_DIR, fontFile);
    if (!existsSync(fontPath)) {
      console.error(`❌ Font not found: ${fontPath}`);
      console.log('   Run "npm run setup" first to download fonts.');
      process.exit(1);
    }
    
    const weight = fontFile.includes('Bold') ? 700 : fontFile.includes('Medium') ? 500 : 400;
    fonts.push({
      name: 'Montserrat',
      data: readFileSync(fontPath),
      weight,
      style: 'normal',
    });
  }
  console.log('✓ Fonts loaded');

  // Generate OG images for all pages
  console.log('\n📄 Generating images:');
  
  const generated: string[] = [];
  for (const page of PAGES) {
    process.stdout.write(`   → ${page.slug}...`);
    try {
      const filename = await generateOGImage(page, bgImageDataUrl, fonts);
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
