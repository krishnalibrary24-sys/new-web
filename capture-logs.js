const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    logs.push(`[pageerror] ${error.message}\n${error.stack}`);
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  } catch (e) {
    logs.push(`[goto error] ${e.message}`);
  }
  
  // Wait a bit to ensure hydration error is caught
  await page.waitForTimeout(2000);
  
  console.log("=== BROWSER LOGS ===");
  console.log(logs.join('\n'));
  
  await browser.close();
})();
