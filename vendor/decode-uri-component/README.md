# URL decoder compatibility adapter

Source: decode-uri-component 0.5.0, published by Sam Verschueren, MIT license.
Upstream: https://github.com/SamVerschueren/decode-uri-component/tree/v0.5.0
Security advisory: https://github.com/advisories/GHSA-vcc3-ghjq-m6fr

Expo Router 57 uses query-string 7, which expects a callable CommonJS require.
Upstream 0.5.0 is ESM. This copy changes only `export default function` to
`module.exports = function`; the patched decoding algorithm is unchanged.
The upstream license is included. Replace this adapter with a supported router
upgrade when its dependency graph includes a compatible patched decoder.

Upstream index.js SHA-256: `9401353df38f8010ad7035fe8d666bce6a4902bc1cff809afc4ab23fa2e0bdaa`.
The root override routes every decode-uri-component import through this package.
Do not change the version to conceal advisories; it identifies the copied source.
