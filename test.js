const { firefox } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await firefox.launch({
    headless: false
  });

  const page = await browser.newPage();

  try {
    console.log('Opening X profile...');

    await page.goto('https://x.com/Trail2Crypto', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('Waiting 10 seconds...');
    await page.waitForTimeout(10000);

    const title = await page.title();
    console.log('Page Title:', title);

    await page.screenshot({
      path: 'x-profile.png',
      fullPage: true
    });

    const html = await page.content();
    fs.writeFileSync('page.html', html);

    console.log('Screenshot saved as x-profile.png');
    console.log('HTML saved as page.html');

  } catch (err) {
    console.error('ERROR:', err);
  }

  await browser.close();
})();