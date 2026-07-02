const fs = require('fs');

let hooks = fs.readFileSync('src/hooks/index.ts', 'utf8');
if (!hooks.includes('useWageSummaryAlt')) {
  hooks += "\nexport * from './useWageSummaryAlt';\n";
  fs.writeFileSync('src/hooks/index.ts', hooks);
}

let pages = fs.readFileSync('src/pages/index.ts', 'utf8');
if (!pages.includes('WageSummaryAltPage')) {
  pages += "\nexport * from './WageSummaryAltPage';\n";
  fs.writeFileSync('src/pages/index.ts', pages);
}
