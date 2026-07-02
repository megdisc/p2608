const fs = require('fs');
let code = fs.readFileSync('src/pages/WageSummaryAltPage.tsx', 'utf8');
code = code.replace(/export function WageSummaryPage/g, 'export function WageSummaryAltPage');
code = code.replace(/useWageSummary/g, 'useWageSummaryAlt');
code = code.replace(/PAGE_NAMES\.WAGE_SUMMARY/g, 'PAGE_NAMES.WAGE_SUMMARY_ALT');
fs.writeFileSync('src/pages/WageSummaryAltPage.tsx', code);
