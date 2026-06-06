const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const profilePath = path.join(__dirname, 'zix-secure-profile');
  
  console.log('Launching undetected Chrome window...');
  
  const context = await chromium.launchPersistentContext(profilePath, {
    channel: 'chrome', 
    headless: false,
    viewport: { width: 1366, height: 768 },
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--disable-blink-features=AutomationControlled',
      '--start-maximized',
      '--no-sandbox'
    ]
  });

  const page = await context.newPage();
  
  // Set a massive timeout (120 seconds) so slow connections don't break it
  page.setDefaultTimeout(120000);

  try {
    console.log('Navigating to X login page...');
    // CHANGED: Using 'domcontentloaded' instead of 'networkidle'
    await page.goto('https://x.com/login', { 
      waitUntil: 'domcontentloaded' 
    });

    console.log('\n--- ACTION REQUIRED ---');
    console.log('1. Log into your X account in the browser window.');
    console.log('2. Complete any security checks or 2FA.');
    console.log('3. Once you see your home feed, return here and press ENTER.');
    console.log('-----------------------\n');

    process.stdin.once('data', async () => {
      console.log('Saving session securely...');
      await context.close();
      console.log('Success! Session saved to ./zix-secure-profile');
      process.exit();
    });

  } catch (err) {
    console.error('\n[Error occurred during navigation]:', err.message);
    await context.close();
    process.exit(1);
  }
})();