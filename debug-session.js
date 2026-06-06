const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });

  let storageStatePath = path.join(__dirname, 'state.json');

  const contextOptions = {};
  if (require('fs').existsSync(storageStatePath)) {
    console.log('Using state.json');
    contextOptions.storageState = storageStatePath;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  await page.goto('https://x.com/Trail2Crypto', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(15000);

  await page.screenshot({ path: 'debug.png', fullPage: true });
  console.log('Screenshot saved');

  const articleCount = await page.locator('article').count();
  console.log('Articles found:', articleCount);

  for (let i = 0; i < Math.min(articleCount, 5); i++) {
    const tweet = page.locator('article').nth(i);
    const text = await tweet.innerText();
    const time = await tweet.locator('time').first().getAttribute('datetime');
    console.log(`\n--- Tweet ${i} (${time}) ---`);
    console.log(text.slice(0, 300));
  }

  await context.close();
  await browser.close();
})();
