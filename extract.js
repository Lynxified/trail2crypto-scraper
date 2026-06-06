const { firefox } = require('playwright');

(async () => {
  const browser = await firefox.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto('https://x.com/Trail2Crypto', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await page.waitForTimeout(10000);

  const text = await page.textContent('body');

  console.log(text.substring(0, 5000));

  await browser.close();
})();