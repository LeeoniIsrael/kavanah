const assert = require('node:assert/strict');
process.env.OPENAI_API_KEY = 'test-placeholder-not-a-credential';
const handler = require('../../api/assistant');
let called = 0;
global.fetch = async () => { called++; throw new Error('Unknown IDs must never reach the model'); };
const response = { statusCode: 200, setHeader(){}, status(code){this.statusCode=code;return this;}, json(body){this.body=body;return this;} };
(async () => {
  await handler({method:'POST',headers:{'x-kavanah-install-id':'a'.repeat(64)},body:{question:'Explain',context:['Catalog prayer ID: outside-research', 'Invented prayer text']}},response);
  assert.equal(response.statusCode,400);assert.equal(called,0);
  console.log('Assistant rejects unknown catalog IDs before making any model request.');
})();
