const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createHash } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");
const query = require("query-string");
const adapterPath = require.resolve("decode-uri-component", { paths: [require.resolve("query-string")] });

test("router query dependency resolves to the patched upstream algorithm with only the CJS export changed", () => {
  assert.equal(adapterPath, resolve("vendor/decode-uri-component/index.cjs"));
  const original = readFileSync(adapterPath, "utf8").replace("module.exports = function decodeUriComponent", "export default function decodeUriComponent");
  assert.equal(createHash("sha256").update(original).digest("hex"), "9401353df38f8010ad7035fe8d666bce6a4902bc1cff809afc4ab23fa2e0bdaa");
});

test("the existing router query-string API preserves Hebrew, plus, repeated values and malformed escapes", () => {
  const parsed = query.parse("q=%D7%A9%D7%9C%D7%95%D7%9D&space=a+b&tag=one&tag=two&broken=%ZZ");
  assert.equal(parsed.q, "שלום");
  assert.equal(parsed.space, "a b");
  assert.deepEqual(parsed.tag, ["one", "two"]);
  assert.equal(parsed.broken, "%ZZ");
});

test("hostile malformed query decoding completes in an isolated process under a bounded deadline", () => {
  const result = spawnSync(process.execPath, ["-e", `
    const query = require("query-string");
    for (const input of ["%E0%A4%A".repeat(6000), "%FF".repeat(16000), "%C2".repeat(12000)]) {
      const parsed = query.parse("q=" + input);
      if (typeof parsed.q !== "string") process.exit(2);
    }
  `], { cwd: process.cwd(), timeout: 3000, encoding: "utf8" });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});
