const { test } = require('node:test');
const assert = require('node:assert/strict');
const { OrdersService } = require('../dist/orders/orders.service');
const { AdminOrderMutationsController } = require('../dist/orders/admin-order-mutations.controller');

test('checkout does not automatically decrement sizes or mark products sold out', async () => {
  const forbidden = () => { throw new Error('Only an admin may change availability'); };
  const product = {
    id: 'p1',
    name: 'SWAGYSTAN item',
    price: 3500,
    inStock: true,
    sizes: [{ size: 'M', stock: 1 }],
  };
  const saved = {
    id: 'order1',
    customerName: 'Customer',
    email: 'customer@example.com',
    phone: '+70000000000',
    deliveryMethod: 'courier',
    items: [{
      id: 'item1',
      productId: product.id,
      size: 'M',
      quantity: 1,
      price: product.price,
      product,
    }],
    user: null,
  };
  let created = 0;
  let notified = 0;
  const tx = {
    product: { findMany: async () => [product], update: forbidden },
    productSize: { updateMany: forbidden, count: forbidden },
    order: {
      create: async () => { created += 1; return saved; },
    },
  };
  const prisma = { $transaction: async (fn) => fn(tx) };
  const notifications = { sendOrderCreated: async () => { notified += 1; } };
  const service = new OrdersService(prisma, notifications);
  const result = await service.create({
    name: 'Customer',
    email: 'customer@example.com',
    phone: '+70000000000',
    deliveryMethod: 'courier',
    items: [{ productId: product.id, size: 'M', quantity: 1 }],
  });
  assert.equal(result.id, 'order1');
  assert.equal(created, 1);
  assert.equal(notified, 1);
  assert.equal(product.sizes[0].stock, 1);
  assert.equal(product.inStock, true);
});

test('order item deletion does not restore or change manually selected availability', async () => {
  const forbidden = () => { throw new Error('Order deletion changed stock'); };
  const order = { id: 'o', items: [{ id: 'i1' }, { id: 'i2' }] };
  let deletedItem = false;
  const tx = {
    order: {
      findUnique: async () => order,
      findUniqueOrThrow: async () => order,
    },
    orderItem: {
      findFirst: async () => ({ id: 'i1', orderId: 'o', productId: 'p1', size: 'M', quantity: 1 }),
      delete: async () => { deletedItem = true; },
    },
    product: { updateMany: forbidden },
    productSize: { updateMany: forbidden },
  };
  const controller = new AdminOrderMutationsController({
    $transaction: async (fn) => fn(tx),
  });
  await controller.removeItem('o', 'i1');
  assert.equal(deletedItem, true);
});

test('whole order deletion does not restore size stock', async () => {
  const forbidden = () => { throw new Error('Order deletion changed stock'); };
  let deleted = false;
  const tx = {
    order: {
      findUnique: async () => ({
        id: 'o',
        items: [{ id: 'i', productId: 'p1', size: 'M', quantity: 1 }],
      }),
      delete: async () => { deleted = true; },
    },
    product: { updateMany: forbidden },
    productSize: { updateMany: forbidden },
  };
  const controller = new AdminOrderMutationsController({
    $transaction: async (fn) => fn(tx),
  });
  await controller.removeOrder('o');
  assert.equal(deleted, true);
});
