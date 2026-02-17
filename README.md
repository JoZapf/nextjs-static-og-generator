# Dynamic OG Image Generator

> **Build-time Open Graph image generation for Next.js static export projects**

Generate beautiful, branded social media preview images at build time – perfect for static sites that can't use runtime image generation.

---

## 🎯 The Problem

When you share a link on LinkedIn, Twitter, or Facebook, these platforms fetch an **Open Graph (OG) image** to display as a preview. Most solutions require:

- ❌ Server-side rendering (Vercel's `@vercel/og`)
- ❌ Edge functions or serverless infrastructure
- ❌ Runtime image generation

**This project solves the problem for static sites** by generating OG images during the build process, outputting static PNG files that work anywhere.

---

## ✨ Features

- 🖼️ **Build-time generation** – No server required
- 📄 **Multi-page support** – Generate images for multiple pages
- 🎨 **Glassmorphism design** – Modern, professional look
- 🎯 **Customizable colors** – Per-page accent colors
- 🔤 **Google Fonts** – Auto-downloads Montserrat
- 🖼️ **Background images** – Layer your brand imagery
- 🐳 **Docker-ready** – One command to build
- 📦 **Static export** – Deploy anywhere

---

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone and enter the project
cd dynamic-og

# Build and generate all OG images
docker compose --profile build up

# Preview the result
docker compose --profile preview up
# → Open http://localhost:8080
```

### Without Docker

```bash
npm install
npm run build
npm run preview
# → Open http://localhost:8080
```

---

## 📄 Adding Pages

Edit `scripts/generate-og-images.ts` and add entries to the `PAGES` array:

```typescript
const PAGES: PageConfig[] = [
  // Homepage
  {
    slug: 'home',                    // → public/og/og-home.png
    title: 'My Website',
    subtitle: 'Welcome to my site',
    description: 'A longer description for the preview.',
    badge: 'mysite.com',
  },
  
  // Documentation page
  {
    slug: 'docs',                    // → public/og/og-docs.png
    title: 'Documentation',
    subtitle: 'Getting Started Guide',
    description: 'Learn how to use this project.',
    badge: 'docs',
    accentColors: {                  // Optional: custom colors
      start: '#3b82f6',
      middle: '#8b5cf6',
      end: '#ec4899',
    },
  },
  
  // Blog post
  {
    slug: 'blog-my-post',            // → public/og/og-blog-my-post.png
    title: 'My Blog Post',
    subtitle: 'An Interesting Topic',
    description: 'What this post is about.',
    badge: 'blog',
  },
  
  // Page with custom background image
  {
    slug: 'special-page',            // → public/og/og-special-page.png
    title: 'Special Page',
    subtitle: 'With Custom Background',
    description: 'This page uses its own background image.',
    badge: 'special',
    bgImage: 'assets/bg/special-background.jpg',
  },
];
```

### Configuration Options

| Property | Required | Description |
|----------|----------|-------------|
| `slug` | Yes | Filename: `og-{slug}.png` |
| `title` | Yes | Large headline text |
| `subtitle` | Yes | Secondary text below title |
| `description` | Yes | Longer description text |
| `badge` | Yes | Top badge/label |
| `bgImage` | No | Per-page background image path (relative to project root) |
| `accentColors` | No | Custom gradient colors (start, middle, end) |

---

## 📁 Project Structure

```
dynamic-og/
├── app/
│   ├── layout.tsx          # OG meta tags + Google Fonts
│   ├── page.tsx            # Displays README + generated images
│   └── globals.css         # Dark mode styling
├── scripts/
│   ├── generate-og-images.ts   # Multi-page OG generator
│   └── download-fonts.ts       # Google Fonts downloader
├── assets/
│   ├── bg/                 # Background images (auto-downloaded)
│   └── fonts/              # Fonts (auto-downloaded)
├── public/og/              # Generated OG images
├── out/                    # Static export output
├── docker-compose.yml      # Dev, build & preview profiles
└── package.json
```

---

## 🐳 Docker Commands

| Command | Description |
|---------|-------------|
| `docker compose --profile dev up` | Development server (port 3000) |
| `docker compose --profile build up` | Build static site + OG images |
| `docker compose --profile preview up` | Serve output (port 8080) |
| `docker compose down -v` | Stop & clean volumes |

---

## 🔧 How It Works

### Build Pipeline

```
npm run build
    │
    ├── 1. Download fonts (if needed)
    │      └── Montserrat from Google Fonts
    │
    ├── 2. Generate OG images
    │      ├── og-home.png
    │      ├── og-docs.png
    │      └── og-blog-*.png
    │
    └── 3. Next.js static export
           └── out/ directory
```

### Technology Stack

| Package | Purpose |
|---------|---------|
| `satori` | JSX → SVG (Vercel's engine) |
| `@resvg/resvg-js` | SVG → PNG (Rust/WASM) |
| `next` | Static site generator |
| `marked` | Markdown → HTML |

---

## 🎨 Customization

### Background Images

The **default** background image applies to all pages:
```
assets/bg/og-background.jpg
```

You can also set a **per-page** background via the `bgImage` field:
```typescript
{
  slug: 'internship',
  title: 'Internship Page',
  // ...
  bgImage: 'assets/bg/internship-bg.jpg',  // relative to project root
}
```

Pages without `bgImage` use the default. If the default is missing, it will be auto-downloaded on first build.

Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`  
Recommended size: 1200×630px or larger

### Default Accent Colors

```typescript
// Orange → Green → Blue gradient
accentColors: {
  start: '#e26b34',
  middle: '#336851',
  end: '#1b3c65',
}
```

### Custom Per-Page Colors

```typescript
// Blue → Purple → Pink gradient
accentColors: {
  start: '#3b82f6',
  middle: '#8b5cf6',
  end: '#ec4899',
}
```

---

## 📦 Using Generated Images

Reference in your HTML/Next.js:

```html
<!-- Homepage -->
<meta property="og:image" content="/og/og-home.png" />

<!-- Documentation -->
<meta property="og:image" content="/og/og-docs.png" />

<!-- Blog post -->
<meta property="og:image" content="/og/og-blog-my-post.png" />
```

Or with absolute URLs for production:

```html
<meta property="og:image" content="https://mysite.com/og/og-home.png" />
```

---

## 🧪 Testing OG Images

After deployment, validate with:
- [toolbox.jozapf.de | Meta Debug](https://toolbox.jozapf.de/meta_debug_web.py)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)

---

## 📄 License

MIT License – Use freely in your own projects.

---

## 🔗 Links

- [Open Graph Protocol](https://ogp.me/)
- [Satori GitHub](https://github.com/vercel/satori)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)

---

*Extracted from the [jozapf.de](https://jozapf.de) portfolio project.*
