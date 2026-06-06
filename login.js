const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  await page.goto('https://x.com/login', { waitUntil: 'domcontentloaded' });

  console.log('========================================');
  console.log('Log into X manually in the browser window');
  console.log('After login, come back here and press ENTER');
  console.log('========================================');

  process.stdin.once('data', async () => {
    await page.waitForTimeout(3000);

    await context.storageState({ path: 'state.json' });

    const state = JSON.parse(fs.readFileSync('state.json', 'utf8'));
    const hasAuth = state.cookies.some(c => c.name === 'auth_token');
    const cookieNames = state.cookies.map(c => c.name).join(', ');

    console.log(`\nCookies saved: ${state.cookies.length}`);
    console.log(`Cookies: ${cookieNames}`);
    console.log(`Auth token present: ${hasAuth ? 'YES' : 'NO'}`);

    if (!hasAuth) {
      console.log('\nWARNING: auth_token not found. Login may have failed.');
      console.log('Try running the script again and make sure you complete login.');
    } else {
      console.log('\nLogin successful! Ready to scrape.');
    }

    await browser.close();
    process.exit();
  });
})();
