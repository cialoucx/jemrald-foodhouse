const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace off-white/beige text on buttons with pure white
css = css.replace(/#f0e4d4/g, '#ffffff');
css = css.replace(/#F0E4D4/g, '#ffffff');

// Replace dark brown backgrounds with theme variables
css = css.replace(/#1a1208/g, 'var(--card-bg)');
css = css.replace(/#1A1208/g, 'var(--card-bg)');
css = css.replace(/#2a1e0e/g, 'var(--deep)');
css = css.replace(/#2A1E0E/g, 'var(--deep)');
css = css.replace(/#1a1510/g, 'var(--card-bg)');
css = css.replace(/#1A1510/g, 'var(--card-bg)');
css = css.replace(/#2a1e10/g, 'var(--deep)');
css = css.replace(/#2A1E10/g, 'var(--deep)');
css = css.replace(/#1e1810/g, 'var(--card-bg)');
css = css.replace(/#1E1810/g, 'var(--card-bg)');
css = css.replace(/#2c241b/g, 'var(--surface2)');
css = css.replace(/#2C241B/g, 'var(--surface2)');
css = css.replace(/#3d3224/g, 'var(--border)');
css = css.replace(/#3D3224/g, 'var(--border)');
css = css.replace(/#8a7560/g, 'var(--muted)');
css = css.replace(/#8A7560/g, 'var(--muted)');


// Replace gold/brown accents
css = css.replace(/#c4a060/g, 'var(--accent)');
css = css.replace(/#C4A060/g, 'var(--accent)');
css = css.replace(/#d9c3a1/g, 'var(--secondary)');
css = css.replace(/#D9C3A1/g, 'var(--secondary)');
css = css.replace(/#e8dcc8/g, 'var(--muted)');
css = css.replace(/#E8DCC8/g, 'var(--muted)');


fs.writeFileSync(cssPath, css);
console.log('Replaced all hardcoded browns with theme variables!');
