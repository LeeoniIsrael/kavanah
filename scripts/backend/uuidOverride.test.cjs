const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const xcodeRequire = createRequire(require.resolve('xcode'));
const uuid = xcodeRequire('uuid');

test('xcode resolves the patched CommonJS UUID version', () => {
  assert.equal(xcodeRequire('uuid/package.json').version, '11.1.1');
  assert.equal(typeof uuid.v4, 'function');
});

test('xcode generates unique native object identifiers alongside existing IDs', () => {
  const project = require('xcode').project('/synthetic-only/project.pbxproj');
  const ids = new Set(['0123456789ABCDEF01234567']);
  project.allUuids = () => [...ids];
  for (let i = 0; i < 1000; i++) {
    const id = project.generateUuid();
    assert.match(id, /^[A-F0-9]{24}$/);
    assert.equal(ids.has(id), false);
    ids.add(id);
  }
});

test('the resolved UUID rejects the advisory output-buffer bounds cases', () => {
  for (const method of ['v3', 'v5'])
    assert.throws(() => uuid[method]('fixture', uuid[method].DNS, new Uint8Array(8), 4), RangeError);
  assert.throws(() => uuid.v6({}, new Uint8Array(8), 4), RangeError);
});
