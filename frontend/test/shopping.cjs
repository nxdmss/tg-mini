const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('frontend/src/shopping.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup() {
  let token = 'alice';
  const events = {}, gets = [], posts = [], storage = new Map();
  const api = { get: () => new Promise(resolve => gets.push(resolve)), post: async (...args) => { posts.push(args); } };
  const exports = {};
  vm.runInNewContext(source, { exports, window: { addEventListener: (name, fn) => { events[name] = fn; } },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (k, v) => storage.set(k, v) },
    require: name => name === 'react' ? { useSyncExternalStore: (_, get) => get() } : name === './api' ?
      { api, getAccessToken: () => token, authHeaders: () => ({ Authorization: token }) } : { getTelegramInitData: () => '' } });
  return { exports, gets, posts, events, login(value) { token = value; events['swag:auth'](); } };
}
test('account loading never uploads an empty local cart', async () => {
  const s = setup();
  assert.equal(s.exports.useShopping().ready, false);
  s.gets.shift()({ data: { items: [], ids: ['p'] } });
  await tick();
  assert.equal(s.exports.useShopping().ids[0], 'p');
  assert.equal(s.posts.length, 0);
});
test('late response from previous account is discarded', async () => {
  const s = setup();
  const alice = s.gets.shift();
  s.login('bob');
  s.gets.shift()({ data: { items: [], ids: ['bob-product'] } });
  alice({ data: { items: [], ids: ['alice-product'] } });
  await tick();
  assert.equal(s.exports.useShopping().ids[0], 'bob-product');
});
test('rapid favorite changes are saved in order with captured account credentials', async () => {
  const s = setup();
  s.gets.shift()({ data: { items: [], ids: [] } });
  await tick();
  s.exports.shopping.toggle('p');
  s.exports.shopping.toggle('p');
  await tick();
  assert.equal(s.posts.length, 2);
  assert.equal(s.posts[0][1].active, true);
  assert.equal(s.posts[1][1].active, false);
  assert.equal(s.posts[0][2].headers.Authorization, 'alice');
});
test('logout immediately clears account favorites', async () => {
  const s = setup();
  s.gets.shift()({ data: { items: [], ids: ['private'] } });
  await tick();
  s.login('');
  assert.equal(s.exports.useShopping().ids.length, 0);
});
