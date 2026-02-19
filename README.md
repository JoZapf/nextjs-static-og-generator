# Dynamic OG Image Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](./docker-compose.yml)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](./CHANGELOG.md)

> Build-time Open Graph image generation for Next.js static export projects.
> No server, no edge functions – just static PNGs that work anywhere.

![Teaser](github-gfx-teaser_web.jpg)

---

## Quick Start

**Docker (recommended):**

```bash
docker compose --profile build up     # Build static site + OG images
docker compose --profile preview up   # Preview at http://localhost:8080
```

**Without Docker:**

```bash
npm install
npm run build
npm run preview
```

---

## Adding Pages

Edit `scripts/generate-og-images.ts` – add entries to the `PAGES` array:

```typescript
{
  slug: 'blog-my-post',            // → public/og/og-blog-my-post.png
  title: 'My Blog Post',
  subtitle: 'An Interesting Topic',
  description: 'What this post is about.',
  badge: 'blog',
  bgImage: 'assets/bg/custom.jpg', // optional
  accentColors: {                   // optional
    start: '#3b82f6',
    middle: '#8b5cf6',
    end: '#ec4899',
  },
}
```

Then reference in your HTML:

```html
<meta property="og:image" content="https://mysite.com/og/og-blog-my-post.png" />
```

---

## Project Structure

```
dynamic-og/
├── scripts/
│   ├── generate-og-images.ts   # OG generator (Satori → SVG → PNG)
│   └── download-fonts.ts       # Google Fonts downloader
├── app/                        # Next.js preview app
├── assets/bg/                  # Background images
├── assets/fonts/               # Fonts (auto-downloaded)
├── public/og/                  # Generated OG images (build output)
├── docker-compose.yml          # Dev / Build / Preview profiles
└── nginx.conf                  # Preview server config
```

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| [satori](https://github.com/vercel/satori) | JSX → SVG |
| [@resvg/resvg-js](https://github.com/niconi/resvg-js) | SVG → PNG (Rust/WASM) |
| [Next.js](https://nextjs.org/) | Static site generator |

---

## Docker Commands

| Command | Description |
|---------|-------------|
| `docker compose --profile dev up` | Dev server (port 3000) |
| `docker compose --profile build up` | Build site + OG images |
| `docker compose --profile preview up` | Serve output (port 8080) |

---

## Testing OG Images

- [Meta Debug – toolbox.jozapf.de](https://toolbox.jozapf.de/meta_debug_web.py)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

---

## License

[MIT](./LICENSE) – © 2025 [Jo Zapf](https://jozapf.de)

---

## Links

- [GitHub Repository](https://github.com/JoZapf/nextjs-static-og-generator)
- [Changelog](./CHANGELOG.md)
- [Open Graph Protocol](https://ogp.me/)
- [jozapf.de](https://jozapf.de)
