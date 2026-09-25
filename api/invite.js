// Public invitation landing page. No address book, tracking pixel, or recipient data.
module.exports = function invite(req, res) {
  const raw = typeof req.query?.handle === 'string' ? req.query.handle : '';
  const handle = /^[a-z0-9_]{3,24}$/.test(raw) ? raw : '';
  const store = process.env.APP_STORE_URL || '';
  const storeUrl = /^https:\/\/apps\.apple\.com\/[A-Za-z0-9/_?=&.-]+$/.test(store) ? store : '';
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  res.status(200).send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>A little space for prayer · Kavanah</title><style>body{margin:0;background:#f7f8fa;color:#152137;font:18px/1.6 system-ui;padding:10vh 24px}main{max-width:480px;margin:auto}h1{font:48px/1.12 Georgia,serif}a{display:inline-block;background:#0b1a3b;color:white;padding:14px 24px;border-radius:18px;text-decoration:none;margin:12px 0}p{color:#475569}@media(prefers-color-scheme:dark){body{background:#0e141c;color:#e9eef4}p{color:#b6c4d4}a{background:#8db6e8;color:#0b1a3b}}</style><main><p>Kavanah</p><h1>A little space for prayer, together.</h1><p>${handle?`A friend invited you. Add <strong>@${handle}</strong> in Circle when you join.`:'Make time for prayer and share your practice with people you know.'}</p>${storeUrl?`<a href="${storeUrl.replaceAll('&','&amp;')}">Get Kavanah</a>`:'<p>Kavanah is preparing for launch. Keep this invitation for when the app is available.</p>'}<p>Already have Kavanah?</p><a href="kavanah://people${handle?`?handle=${handle}`:''}">Open your circle</a><p>No points. No rewards. Just the mitzvah of inviting someone to pray.</p></main></html>`);
};
