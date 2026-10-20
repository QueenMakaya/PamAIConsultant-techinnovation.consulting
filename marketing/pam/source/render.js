const { chromium } = require('playwright');
(async () => {
  const dir = process.argv[2];
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' + '' }).catch(() => chromium.launch());
  const p = await b.newPage({ viewport: { width: 1200, height: 2000 } });
  await p.goto('file://' + dir + '/slides.html');
  await p.evaluate(() => document.fonts.ready);
  const ids = await p.$$eval('.slide', els => els.map(e => e.id));
  for (const id of ids) { await p.locator('#' + id).screenshot({ path: `${dir}/out/pam-${id}.png` }); console.log(id); }
  await b.close();
})();
