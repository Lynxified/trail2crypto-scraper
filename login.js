const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false
  });

  const context = await browser.newContext();

  const page = await context.newPage();

  await page.goto('https://x.com/login');

  console.log('Log into X manually.');
  console.log('After login, press ENTER in this terminal.');

  process.stdin.once('data', async () => {
    await context.storageState({
      path: 'state.json'
    });

    console.log('Session saved to state.json');

    await browser.close();
    process.exit();
  });
})();