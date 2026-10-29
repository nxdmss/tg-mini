const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ShoppingController } = require('../dist/auth/shopping.controller');
const calls = [];
const prisma = {
  accountCartItem: {
    findMany: async q => { calls.push(q); return [{ productId: 'p', size: 'M', quantity: 9 }]; },
    upsert: async q => calls.push(q), deleteMany: async q => calls.push(q),
  },
  accountFavorite: {
    findMany: async q => { calls.push(q); return []; },
    upsert: async q => calls.push(q), deleteMany: async q => calls.push(q),
  },
  product: {
    findFirst: async () => ({ inStock: true, sizes: [{ size: 'M', stock: 2 }] }),
    findMany: async () => [{ id: 'p', name: 'Current name', price: 125, inStock: true, sizes: [{ size: 'M', stock: 2 }], images: [] }],
  },
};
const controller = new ShoppingController(prisma);
test('anonymous requests cannot read or change account state', async () => {
  await assert.rejects(controller.get({}), /Unauthorized/);
  await assert.rejects(controller.change({}, { type: 'clear' }), /Unauthorized/);
});
test('reads use authenticated account and current product price/stock', async () => {
  calls.length = 0;
  const result = await controller.get({ user: { id: 'alice' } });
  assert.equal(result.items[0].price, 125);
  assert.equal(result.items[0].quantity, 2);
  assert.equal(result.items[0].maxStock, 2);
  assert.deepEqual(calls, [{ where: { userId: 'alice' } }, { where: { userId: 'alice' } }]);
});
test('cannot write to another account; quantity clamps to stock', async () => {
  calls.length = 0;
  await controller.change({ user: { id: 'alice' } }, { type: 'cart', userId: 'bob', productId: 'p', size: 'M', quantity: 8 });
  assert.equal(calls[0].create.userId, 'alice');
  assert.equal(calls[0].create.quantity, 2);
});
test('removing, clearing and favorites remain scoped to the account', async () => {
  calls.length = 0;
  for (const body of [{ type: 'cart', productId: 'p', size: 'M', quantity: 0 }, { type: 'favorite', productId: 'p', active: false }, { type: 'clear' }]) {
    await controller.change({ user: { id: 'bob' } }, body);
  }
  assert.ok(calls.every(c => c.where.userId === 'bob'));
});
test('invalid operations are rejected', async () => {
  for (const body of [null, { type: 'favorite', productId: 'p', active: 'yes' }, { type: 'cart', productId: 'p', size: 'M', quantity: -1 }])
    await assert.rejects(controller.change({ user: { id: 'alice' } }, body), /Invalid/);
});
