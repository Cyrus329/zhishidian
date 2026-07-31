const fs = require('fs');

const css = fs.readFileSync('styles.css', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const required = [
  'v51: visual refresh',
  '--surface-subtle',
  '--shadow-sm',
  '.home-section[open]',
  '.sidebar:focus-within',
  '@media(max-width:960px)',
  '@media(max-width:700px)'
];

const missing = required.filter((value) => !css.includes(value));
if (missing.length) {
  throw new Error(`Missing visual refresh coverage: ${missing.join(', ')}`);
}

['focusDesk', 'focusHeroTask', 'focusQueue', 'focusReviewList'].forEach((id) => {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing focus desk element: ${id}`);
});
if (!app.includes('function renderFocusDesk()')) throw new Error('Missing focus desk renderer');

console.log('Visual refresh CSS coverage passed.');
