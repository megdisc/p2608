const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/master');
  await page.waitForLoadState('networkidle');
  await page.click('button:has-text("追加")');
  await page.waitForTimeout(500);
  const html = await page.innerHTML('.inventory-table');
  console.log(html);
  await browser.close();
})();
