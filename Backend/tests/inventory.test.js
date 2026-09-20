import { describe, expect, it } from 'vitest';
import inventoryService from '../src/services/inventory.service.js';
import productService from '../src/services/product.service.js';
import Product from '../src/models/Product.js';
import { createProduct } from './factories.js';

const reload = (id) => Product.findById(id);

describe('inventory lifecycle', () => {
  it('reserves against available stock and rejects an oversell', async () => {
    const product = await createProduct({ inventory: { sku: 'S1', stock: 5 } });

    await inventoryService.reserveStock({ productId: product._id, quantity: 4 });
    expect((await reload(product._id)).inventory.reservedStock).toBe(4);

    await expect(
      inventoryService.reserveStock({ productId: product._id, quantity: 2 })
    ).rejects.toThrow('Insufficient stock');
  });

  it('reduces stock and the reservation together on capture', async () => {
    const product = await createProduct({ inventory: { sku: 'S2', stock: 5 } });
    await inventoryService.reserveStock({ productId: product._id, quantity: 3 });
    await inventoryService.reduceStock({ productId: product._id, quantity: 3 });

    const saved = await reload(product._id);
    expect(saved.inventory.stock).toBe(2);
    expect(saved.inventory.reservedStock).toBe(0);
  });

  it('returns held stock to the pool on release', async () => {
    const product = await createProduct({ inventory: { sku: 'S3', stock: 5 } });
    await inventoryService.reserveStock({ productId: product._id, quantity: 3 });
    await inventoryService.releaseStock({ productId: product._id, quantity: 3 });

    const saved = await reload(product._id);
    expect(saved.inventory.stock).toBe(5);
    expect(saved.inventory.reservedStock).toBe(0);
  });

  it('tracks variant stock independently of the product pool', async () => {
    const product = await createProduct({
      inventory: { sku: 'S4', stock: 0 },
      variants: [{ label: 'Small', sku: 'V1', stock: 2 }],
    });
    const variantId = product.variants[0]._id;

    await inventoryService.reserveStock({ productId: product._id, variantId, quantity: 2 });
    await expect(
      inventoryService.reserveStock({ productId: product._id, variantId, quantity: 1 })
    ).rejects.toThrow('Insufficient stock');

    expect((await reload(product._id)).variants[0].reservedStock).toBe(2);
  });
});

describe('product update', () => {
  it('keeps variant ids and reserved stock when an admin edits a product', async () => {
    const product = await createProduct({
      inventory: { sku: 'S5', stock: 20 },
      variants: [{ label: 'Red', sku: 'R1', stock: 8 }],
    });
    const variantId = product.variants[0]._id.toString();

    await inventoryService.reserveStock({ productId: product._id, variantId, quantity: 3 });
    await inventoryService.reserveStock({ productId: product._id, quantity: 5 });

    // the admin UI round-trips the variant but never sends reservedStock
    await productService.updateProduct(product._id, {
      name: 'Renamed Product',
      variants: [{ _id: variantId, label: 'Crimson', sku: 'R1', stock: 8 }],
      inventory: { sku: 'S5', stock: 20 },
    });

    const saved = await reload(product._id);
    expect(saved.variants[0]._id.toString()).toBe(variantId);
    expect(saved.variants[0].label).toBe('Crimson');
    expect(saved.variants[0].reservedStock).toBe(3);
    expect(saved.inventory.reservedStock).toBe(5);
  });
});
