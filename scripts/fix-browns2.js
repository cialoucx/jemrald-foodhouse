const fs = require('fs');
const path = require('path');
const cssPath = path.join(__dirname, 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

const replacements = {
  '#161008': 'var(--deep)',
  '#c06040': 'var(--red)',
  '#0e2010': 'var(--deep)',
  '#1e1008': 'var(--card-bg)',
  '#6a3a1a': 'var(--muted)',
  '#181208': 'var(--deep)',
  '#221408': 'var(--deep)',
  '#c87060': 'var(--red-bright)',
  '#0A0604': 'var(--black)',
  '#F0EAE1': 'var(--deep)',
  '#E6DCC8': 'var(--muted)',
  '#3D2517': 'var(--border)',
};

for (const [hex, variable] of Object.entries(replacements)) {
  const regex = new RegExp(hex, 'gi');
  css = css.replace(regex, variable);
}

fs.writeFileSync(cssPath, css);
console.log('Replaced second batch of browns!');
