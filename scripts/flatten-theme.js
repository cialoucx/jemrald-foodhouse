const fs = require('fs');
const path = require('path');
const cssPath = path.join(__dirname, 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

const newRoot = `/* ══ BEIJING 2008 SOLID THEME ══ */
    :root {
      --black:       #F2F0DF;   /* Main background (Cream ticket) */
      --deep:        #E8E5CE;   /* Slightly darker cream */
      --card-bg:     #F2F0DF;   /* Solid Card Background */
      --accent:      #D3121B;   /* Red ticket */
      --accent-bright: #EB1B25;
      --accent-dark: #A60C14;
      --secondary:   #047647;   /* Green ticket */
      --maple:       #D9A34A;   /* Gold Accent */
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
      
      --red:         var(--accent);
      --red-bright:  var(--accent-bright);
      --red-dark:    var(--accent-dark);
      color-scheme: light;
    }`;

// Replace root section
const startIndex = css.indexOf('/* ══ TOKYO TOKYO UMAMI THEME ══ */');
const endIndex = css.indexOf('option {');
if (startIndex !== -1 && endIndex !== -1) {
  css = newRoot + '\\n\\n    ' + css.slice(endIndex);
}

// Strip out ALL gradients to apply flat designs
css = css.replace(/background:\s*radial-gradient[^;]*;/g, 'background: var(--black);');
css = css.replace(/background:\s*linear-gradient[^;]*;/g, 'background: var(--black);');
css = css.replace(/background-image:\s*radial-gradient[^;]*;/g, 'background: none;');
css = css.replace(/background-image:\s*linear-gradient[^;]*;/g, 'background: none;');

// Strip out backdrop-filters to remove glassmorphism
css = css.replace(/backdrop-filter:[^;]*;/g, '');
css = css.replace(/-webkit-backdrop-filter:[^;]*;/g, '');

fs.writeFileSync(cssPath, css);
console.log('Successfully flattened theme to 3-color Beijing Olympics Palette');
