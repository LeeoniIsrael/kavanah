const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');
const tailwindRequire = createRequire(require.resolve('tailwindcss'));
const nestedRequire = createRequire(require.resolve('postcss-nested'));
const parse = tailwindRequire('postcss-selector-parser');

test('both CSS consumers resolve the explicitly validated patched parser', () => {
  for (const scoped of [tailwindRequire, nestedRequire])
    assert.equal(scoped('postcss-selector-parser/package.json').version, '7.1.6');
});

test('patched parser preserves escaped, Hebrew, RTL and nested selector syntax', () => {
  for (const selector of ['.text-\\[34px\\]', '.שלום:hover', '[dir="rtl"] .reader', ':is(.a, .b):not([hidden])', '.a:has(> .b)', '& > .child'])
    assert.equal(parse().processSync(selector), selector);
});

test('nested CSS and Tailwind still transform into native style rules', async () => {
  const postcss = require('postcss');
  const nested = require('postcss-nested');
  const expanded = await postcss([nested]).process('.parent { & > .child { color: red; } }', { from: undefined });
  assert.match(expanded.css, /\.parent > \.child/);
  const config = require('../../tailwind.config');
  const generated = await postcss([require('tailwindcss')({ ...config, content: [{ raw: '<View className="p-4 text-[34px] bg-red-500 rounded-md" />', extension: 'tsx' }] })])
    .process('@tailwind utilities;', { from: undefined });
  const { cssToReactNativeRuntime } = require('react-native-css-interop/css-to-rn');
  const runtime = cssToReactNativeRuntime(generated.css, { inlineRem: 16 });
  for (const name of ['p-4', 'text-[34px]', 'bg-red-500', 'rounded-md']) assert.ok(runtime.rules[name], name);
  assert.match(JSON.stringify(runtime.rules['text-[34px]']), /"fontSize":34/);
});

test('flat hostile selector parsing is bounded in a separate process', () => {
  const source = `const {createRequire}=require('node:module');const scoped=createRequire(require.resolve('tailwindcss'));const parse=scoped('postcss-selector-parser');let n=0;parse(root=>root.walkClasses(()=>n++)).processSync('.a'.repeat(100000));if(n!==100000)process.exit(2);`;
  const result = spawnSync(process.execPath, ['--max-old-space-size=256', '-e', source], { cwd: process.cwd(), timeout: 5000, encoding: 'utf8' });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});
