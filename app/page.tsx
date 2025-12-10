import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { marked } from 'marked';

export default function Home() {
  // Read README.md content
  const readmePath = join(process.cwd(), 'README.md');
  let htmlContent = '';

  if (existsSync(readmePath)) {
    const readmeContent = readFileSync(readmePath, 'utf-8');
    htmlContent = marked(readmeContent) as string;
  } else {
    htmlContent = '<p>README.md not found</p>';
  }

  // Scan for generated OG images
  const ogDir = join(process.cwd(), 'public', 'og');
  let ogImages: string[] = [];
  
  if (existsSync(ogDir)) {
    ogImages = readdirSync(ogDir)
      .filter(f => f.endsWith('.png'))
      .sort();
  }

  return (
    <div className="container">
      {/* Header with OG Image Gallery */}
      <header className="header">
        <h1 className="site-title">Dynamic OG Generator</h1>
        <p className="site-subtitle">Build-time Open Graph image generation for static sites</p>
        
        {ogImages.length > 0 ? (
          <div className="og-gallery">
            <h2 className="gallery-title">Generated OG Images ({ogImages.length})</h2>
            <div className="og-grid">
              {ogImages.map((filename) => {
                const slug = filename.replace('og-', '').replace('.png', '');
                return (
                  <div key={filename} className="og-card">
                    <img 
                      src={`/og/${filename}`} 
                      alt={`OG Image: ${slug}`} 
                      className="og-image"
                    />
                    <div className="og-meta">
                      <code className="og-filename">/og/{filename}</code>
                      <span className="og-slug">{slug}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="og-hint">
              ↑ These images are generated at build time and included in your static export
            </p>
          </div>
        ) : (
          <div className="og-placeholder">
            <p>🖼️ No OG images generated yet</p>
            <code>npm run generate:og</code>
          </div>
        )}
      </header>

      {/* README Content */}
      <main className="content">
        <article 
          className="readme"
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>
          Built with <strong>Dynamic OG Generator</strong> • 
          <a href="https://github.com/JoZapf/jozapf_de/tree/main/docs/dynamic-og" target="_blank" rel="noopener noreferrer">View Source</a>
        </p>
      </footer>
    </div>
  );
}
