import { describe, expect, it } from 'vitest';
import { createProduct, registerUser } from './factories.js';

describe('wishlist', () => {
  it('removes a product instead of silently keeping it', async () => {
    const { agent } = await registerUser();
    const product = await createProduct();

    await agent.post(`/api/v1/wishlist/${product._id}`).expect(201);
    const removed = await agent.delete(`/api/v1/wishlist/${product._id}`).expect(200);

    expect(removed.body.data.wishlist.products).toHaveLength(0);
  });

  it('does not add the same product twice', async () => {
    const { agent } = await registerUser();
    const product = await createProduct();

    await agent.post(`/api/v1/wishlist/${product._id}`).expect(201);
    const second = await agent.post(`/api/v1/wishlist/${product._id}`).expect(201);

    expect(second.body.data.wishlist.products).toHaveLength(1);
  });
});

describe('cart', () => {
  it('merges a repeat add into one line item', async () => {
    const { agent } = await registerUser();
    const product = await createProduct();
    const body = { productId: product._id.toString(), quantity: 2 };

    await agent.post('/api/v1/cart/items').send(body).expect(201);
    const second = await agent.post('/api/v1/cart/items').send(body).expect(201);

    expect(second.body.data.cart.items).toHaveLength(1);
    expect(second.body.data.cart.items[0].quantity).toBe(4);
    expect(second.body.data.cart.totalAmount).toBe(2000);
  });

  it('keeps different customisations as separate lines', async () => {
    const { agent } = await registerUser();
    const product = await createProduct({
      customizationFields: [{ name: 'Engraving', type: 'TEXT' }],
    });
    const base = { productId: product._id.toString(), quantity: 1 };

    await agent.post('/api/v1/cart/items').send({ ...base, customization: [{ name: 'Engraving', value: 'Ana' }] });
    const second = await agent
      .post('/api/v1/cart/items')
      .send({ ...base, customization: [{ name: 'Engraving', value: 'Sam' }] });

    expect(second.body.data.cart.items).toHaveLength(2);
  });
});
