const fs = require('fs');

// src/hooks/index.ts
let hooks = fs.readFileSync('src/hooks/index.ts', 'utf8');
hooks = hooks.replace(/\nexport \* from '\.\/useWageSummaryAlt';\n/g, '');
fs.writeFileSync('src/hooks/index.ts', hooks);

// src/pages/index.ts
let pages = fs.readFileSync('src/pages/index.ts', 'utf8');
pages = pages.replace(/\nexport \* from '\.\/WageSummaryAltPage';\n/g, '');
fs.writeFileSync('src/pages/index.ts', pages);

// src/types/index.ts
let types = fs.readFileSync('src/types/index.ts', 'utf8');
types = types.replace(/ \| 'wageSummaryAlt'/g, '');
fs.writeFileSync('src/types/index.ts', types);

// src/constants/strings.ts
let strings = fs.readFileSync('src/constants/strings.ts', 'utf8');
strings = strings.replace(/\n  WAGE_SUMMARY_ALT: '工賃・控除集計（別案）',/g, '');
fs.writeFileSync('src/constants/strings.ts', strings);

// src/App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/\n  WageSummaryAltPage,/g, '');
app = app.replace(/\s*\) : activeTab === 'wageSummaryAlt' \? \(\s*<WageSummaryAltPage \/>/g, '');
fs.writeFileSync('src/App.tsx', app);

// src/components/layout/ProjectSidebar.tsx
let sidebar = fs.readFileSync('src/components/layout/ProjectSidebar.tsx', 'utf8');
sidebar = sidebar.replace(/\s*<button \s*className={`nav-button \${activeTab === 'wageSummaryAlt' \? 'active' : ''}`}\s*onClick=\{\(\) => setActiveTab\('wageSummaryAlt'\)\}\s*>\s*\{PAGE_NAMES\.WAGE_SUMMARY_ALT\}\s*<\/button>/g, '');
fs.writeFileSync('src/components/layout/ProjectSidebar.tsx', sidebar);

