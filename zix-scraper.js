const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: WebSocket }
});
const MAX_TWEETS = 10;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  let storageStatePath = path.join(__dirname, 'state.json');
  if (process.env.X_STATE) {
    storageStatePath = path.join(__dirname, 'state-ci.json');
    fs.writeFileSync(storageStatePath, Buffer.from(process.env.X_STATE, 'base64').toString());
  }

  const contextOptions = {
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
  };

  if (fs.existsSync(storageStatePath)) {
    contextOptions.storageState = storageStatePath;
  }

  const context = await browser.newContext(contextOptions);

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();

  await page.goto('https://x.com/Trail2Crypto', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(12000);

  const articleCount = await page.locator('article').count();
  console.log('Tweets found:', articleCount);

  const posts = [];

  for (let i = 0; i < Math.min(articleCount, MAX_TWEETS); i++) {
    try {
      const tweet = page.locator('article').nth(i);
      const text = await tweet.innerText();
      if (!text || text.length < 20) continue;

      const linkEl = tweet.locator('a[href*="/status/"]').first();
      const href = await linkEl.getAttribute('href');
      const url = href
        ? `https://x.com${href}`
        : `https://x.com/Trail2Crypto/status/unknown-${Date.now()}-${i}`;

      const timeEl = tweet.locator('time').first();
      const postTime = await timeEl.getAttribute('datetime');

      posts.push({
        url,
        author: 'Trail2Crypto',
        text: text,
        post_time: postTime || new Date().toISOString()
      });

      console.log(`Tweet ${i + 1} collected`);
    } catch (err) {
      console.log(`Error on tweet ${i}: ${err.message}`);
    }
  }

  console.log(`Saving ${posts.length} posts...`);

  const { error } = await supabase
    .from('zix_posts')
    .upsert(posts);

  if (error) {
    console.log('SUPABASE ERROR', error.message);
  } else {
    console.log('SUCCESS!');
  }

  await context.close();
  await browser.close();

  if (process.env.X_STATE && fs.existsSync(storageStatePath)) {
    fs.unlinkSync(storageStatePath);
  }
})();
