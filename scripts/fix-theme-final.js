const fs = require('fs');
const path = require('path');
const cssPath = path.join(__dirname, 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Set the unified root
const newRoot = `:root {
      /* SOLID THEME (Beijing 2008 Palette) */
      --black:       #F2F0DF;   /* Main background (Cream ticket) */
      --deep:        #E8E5CE;   /* Slightly darker cream */
      --card-bg:     #F2F0DF;   /* Solid Card Background */
      --red:         #D3121B;   /* Red ticket */
      --red-bright:  #EB1B25;
      --red-dark:    #A60C14;
      --secondary:   #047647;   /* Green ticket */
      --maple:       #D9A34A;   /* Gold Accent */
      --accent:      #D3121B;   /* Map old accent to red */
      --accent-bright: #EB1B25;
      --accent-dark: #A60C14;
      --cream:       #2A251C;   /* Text color (Dark contrasting brown/charcoal) */
      --muted:       #807869;
      --border:      rgba(211, 18, 27, 0.25);
      --border2:     rgba(42, 37, 28, 0.15);
      --surface:     rgba(211, 18, 27, 0.06);
      --surface2:    rgba(4, 118, 71, 0.08);
      --glass-bg:    #F2F0DF;   /* NO TRANSLUCENCY */
      --glass-border: rgba(42, 37, 28, 0.25);
      --nav-bg:      #F2F0DF;   /* SOLID Header */
      
      /* Disable glow variables */
      --hero-glow-1: #F2F0DF;
      --hero-glow-2: #F2F0DF;
      --hero-glow-3: #F2F0DF;
      
      color-scheme: light;
    }`;

// Replace root section
const rootMatch = css.match(/:root\s*\{[^}]+\}/m);
if (rootMatch) {
  css = css.replace(rootMatch[0], newRoot);
}

// 2. Eradicate all muddy browns because we reverted index.css via git
const brownReplacements = {
  '#f0e4d4': '#ffffff',
  '#F0E4D4': '#ffffff',
  '#1a1208': 'var(--card-bg)',
  '#1A1208': 'var(--card-bg)',
  '#2a1e0e': 'var(--deep)',
  '#2A1E0E': 'var(--deep)',
  '#1a1510': 'var(--card-bg)',
  '#1A1510': 'var(--card-bg)',
  '#2a1e10': 'var(--deep)',
  '#2A1E10': 'var(--deep)',
  '#1e1810': 'var(--card-bg)',
  '#1E1810': 'var(--card-bg)',
  '#2c241b': 'var(--surface2)',
  '#2C241B': 'var(--surface2)',
  '#3d3224': 'var(--border)',
  '#3D3224': 'var(--border)',
  '#8a7560': 'var(--muted)',
  '#8A7560': 'var(--muted)',
  '#c4a060': 'var(--red)',
  '#C4A060': 'var(--red)',
  '#d9c3a1': 'var(--secondary)',
  '#D9C3A1': 'var(--secondary)',
  '#e8dcc8': 'var(--muted)',
  '#E8DCC8': 'var(--muted)',
  '#161008': 'var(--deep)',
  '#c06040': 'var(--red)',
  '#0e2010': 'var(--deep)',
  '#1e1008': 'var(--card-bg)',
  '#6a3a1a': 'var(--muted)',
  '#181208': 'var(--deep)',
  '#221408': 'var(--deep)',
  '#c87060': 'var(--red-bright)'
};

for (const [hex, variable] of Object.entries(brownReplacements)) {
  const regex = new RegExp(hex, 'gi');
  css = css.replace(regex, variable);
}

// 3. Remove ALL gradients precisely
css = css.replace(/background:\s*radial-gradient[^;]*;/g, 'background: var(--card-bg);');
css = css.replace(/background:\s*linear-gradient[^;]*;/g, 'background: var(--card-bg);');
css = css.replace(/background-image:\s*radial-gradient[^;]*;/g, 'background: none;');
css = css.replace(/background-image:\s*linear-gradient[^;]*;/g, 'background: none;');

// 4. Remove ALL blurs
css = css.replace(/backdrop-filter:[^;]*;/g, '');
css = css.replace(/-webkit-backdrop-filter:[^;]*;/g, '');

fs.writeFileSync(cssPath, css);
console.log('Successfully orchestrated Beijing 2008 theme directly on base system.');
