/**
 * download-fonts.ts
 *
 * Downloads Montserrat font files from Google Fonts for offline builds.
 * Run: npx tsx scripts/download-fonts.ts
 *
 * @author    Jo Zapf <https://jozapf.de>
 * @license   MIT
 * @version   1.0.0
 * @since     2025-12
 * @see       https://github.com/JoZapf/nextjs-static-og-generator
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const FONTS_DIR = join(PROJECT_ROOT, 'assets', 'fonts');

// Google Fonts direct download URLs (TTF format)
const FONTS = [
  {
    name: 'Montserrat-Regular.ttf',
    url: 'https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Regular.ttf',
  },
  {
    name: 'Montserrat-Medium.ttf',
    url: 'https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Medium.ttf',
  },
  {
    name: 'Montserrat-Bold.ttf',
    url: 'https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Bold.ttf',
  },
];

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = dest;
    
    const request = (url: string) => {
      https.get(url, (response) => {
        // Handle redirects (GitHub uses them)
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            request(redirectUrl);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          writeFileSync(file, Buffer.concat(chunks));
          resolve();
        });
        response.on('error', reject);
      }).on('error', reject);
    };

    request(url);
  });
}

async function main() {
  console.log('\n🔤 Font Downloader');
  console.log('═'.repeat(40));

  // Create fonts directory
  if (!existsSync(FONTS_DIR)) {
    mkdirSync(FONTS_DIR, { recursive: true });
    console.log(`✓ Created: ${FONTS_DIR}`);
  }

  // Download each font
  for (const font of FONTS) {
    const destPath = join(FONTS_DIR, font.name);
    
    if (existsSync(destPath)) {
      console.log(`⏭️  Skipping ${font.name} (already exists)`);
      continue;
    }

    console.log(`⬇️  Downloading ${font.name}...`);
    try {
      await downloadFile(font.url, destPath);
      console.log(`   ✓ Saved: ${font.name}`);
    } catch (error) {
      console.error(`   ❌ Failed: ${error}`);
      process.exit(1);
    }
  }

  console.log('\n' + '═'.repeat(40));
  console.log('✅ Fonts ready!\n');
}

main();
