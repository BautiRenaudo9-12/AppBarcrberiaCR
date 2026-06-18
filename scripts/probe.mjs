import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:4173/';
const browser = await chromium.launch();
const page = await browser.newPage();

const logs = [];
page.on('console', m => logs.push(`[console.${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', r => logs.push(`[requestfailed] ${r.url()} -> ${r.failure()?.errorText}`));

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => logs.push(`[goto-error] ${e.message}`));
await page.waitForTimeout(2500);

const rootHtml = await page.evaluate(() => {
  const r = document.getElementById('root');
  return r ? r.innerHTML.slice(0, 400) : 'NO #root';
});
const bodyText = await page.evaluate(() => document.body.innerText.trim().slice(0, 200));

console.log('=== ROOT innerHTML (first 400 chars) ===');
console.log(rootHtml || '(empty)');
console.log('=== body innerText ===');
console.log(bodyText || '(empty)');
console.log('=== console / errors ===');
console.log(logs.join('\n') || '(none)');

await browser.close();
