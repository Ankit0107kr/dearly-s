import { describe, expect, it } from 'vitest';
import categoryService from '../src/services/category.service.js';
import productService from '../src/services/product.service.js';
import Review from '../src/models/Review.js';
import Product from '../src/models/Product.js';
import { createCategory, createProduct, registerUser } from './factories.js';

describe('category tree', () => {
  it('refuses to nest a category inside itself', async () => {
    const parent = await createCategory();
    const child = await createCategory({ parentCategory: parent._id });

    await expect(
      categoryService.updateCategory(parent._id, { parentCategory: child._id })
    ).rejects.toThrow('A category cannot be nested inside itself');

    await expect(
      categoryService.updateCategory(parent._id, { parentCategory: parent._id })
    ).rejects.toThrow('A category cannot be nested inside itself');
  });

  it('still allows a legitimate re-parent', async () => {
    const a = await createCategory();
    const b = await createCategory();
    const moved = await categoryService.updateCategory(b._id, { parentCategory: a._id });
    expect(moved.parentCategory.toString()).toBe(a._id.toString());
  });
});

describe('review moderation', () => {
  it('drops a hidden review out of the product rating', async () => {
    const { user } = await registerUser();
    const product = await createProduct();

    await Review.create({
      userId: user._id,
      productId: product._id,
      orderId: product._id,
      rating: 5,
      isApproved: true,
    });
    const productService = (await import('../src/services/product.service.js')).default;
    await productService.recalculateProductRating(product._id);
    expect((await Product.findById(product._id)).rating).toBe(5);

    await Review.updateMany({ productId: product._id }, { isApproved: false });
    await productService.recalculateProductRating(product._id);

    const hidden = await Product.findById(product._id);
    expect(hidden.rating).toBe(0);
    expect(hidden.reviewCount).toBe(0);
  });
});

describe('catalogue filters', () => {
  const setup = async () => {
    const hampers = await createCategory({ slug: 'f-hampers', name: 'Hampers' });
    const luxe = await createCategory({ slug: 'f-luxe', name: 'Luxe', parentCategory: hampers._id });
    const gourmet = await createCategory({ slug: 'f-gourmet', name: 'Gourmet' });
    const birthday = await createCategory({ slug: 'f-birthday', name: 'Birthday', kind: 'OCCASION' });
    const wedding = await createCategory({ slug: 'f-wedding', name: 'Wedding', kind: 'OCCASION' });

    // Filed under the child only — a parent-category filter must still find it.
    await createProduct({
      slug: 'f-luxe-box', category: hampers._id, subCategory: luxe._id,
      occasions: [birthday._id], price: 5000, discountPrice: 4000,
      customizationFields: [{ name: 'Note', type: 'TEXT' }],
    });
    await createProduct({
      slug: 'f-plain-hamper', category: hampers._id,
      occasions: [wedding._id], price: 900,
    });
    await createProduct({
      slug: 'f-truffles', category: gourmet._id,
      occasions: [birthday._id], price: 1500,
    });
    return { hampers, luxe, gourmet, birthday };
  };

  const slugs = async (query) =>
    (await productService.listProducts({ limit: 100, ...query })).items
      .map((p) => p.slug)
      .filter((s) => s.startsWith('f-'))
      .sort();

  it('matches a parent category through its subcategory', async () => {
    await setup();
    expect(await slugs({ category: 'f-hampers' })).toEqual(['f-luxe-box', 'f-plain-hamper']);
  });

  it('filters by subcategory slug', async () => {
    await setup();
    expect(await slugs({ subCategory: 'f-luxe' })).toEqual(['f-luxe-box']);
  });

  it('filters by occasion slug', async () => {
    await setup();
    expect(await slugs({ occasion: 'f-birthday' })).toEqual(['f-luxe-box', 'f-truffles']);
    expect(await slugs({ occasion: 'f-wedding' })).toEqual(['f-plain-hamper']);
  });

  it('accepts an id as readily as a slug', async () => {
    const { gourmet } = await setup();
    expect(await slugs({ category: gourmet._id.toString() })).toEqual(['f-truffles']);
  });

  it('returns nothing for a slug that does not exist', async () => {
    await setup();
    expect(await slugs({ occasion: 'no-such-occasion' })).toEqual([]);
    expect(await slugs({ category: 'no-such-category' })).toEqual([]);
  });

  it('filters personalised and discounted products', async () => {
    await setup();
    expect(await slugs({ personalised: 'true' })).toEqual(['f-luxe-box']);
    expect(await slugs({ onSale: 'true' })).toEqual(['f-luxe-box']);
  });

  it('combines facets', async () => {
    await setup();
    expect(await slugs({ category: 'f-hampers', occasion: 'f-birthday' })).toEqual(['f-luxe-box']);
    expect(await slugs({ category: 'f-gourmet', occasion: 'f-wedding' })).toEqual([]);
  });

  it('keeps occasions out of the category tree', async () => {
    await setup();
    const tree = await categoryService.getCategoryTree();
    const slugsInTree = tree.map((c) => c.slug);
    expect(slugsInTree).toContain('f-hampers');
    expect(slugsInTree).not.toContain('f-birthday');
    expect(tree.find((c) => c.slug === 'f-hampers').children.map((c) => c.slug)).toEqual(['f-luxe']);
  });
});

describe('effective price', () => {
  it('sorts and filters on what the customer pays, not the list price', async () => {
    const category = await createCategory({ slug: 'ep-cat', name: 'EP' });
    // Cheaper after discount, but a higher list price than the plain product.
    await createProduct({ slug: 'ep-discounted', category: category._id, price: 1590, discountPrice: 1190 });
    await createProduct({ slug: 'ep-plain', category: category._id, price: 1490 });

    const asc = await productService.listProducts({ category: 'ep-cat', sort: 'price_asc', limit: 10 });
    expect(asc.items.map((p) => p.slug)).toEqual(['ep-discounted', 'ep-plain']);

    const desc = await productService.listProducts({ category: 'ep-cat', sort: 'price_desc', limit: 10 });
    expect(desc.items.map((p) => p.slug)).toEqual(['ep-plain', 'ep-discounted']);

    // A ₹1,200 ceiling must include the item whose sale price is ₹1,190.
    const budget = await productService.listProducts({ category: 'ep-cat', maxPrice: 1200, limit: 10 });
    expect(budget.items.map((p) => p.slug)).toEqual(['ep-discounted']);
  });

  it('keeps effectivePrice in sync when only one price is updated', async () => {
    const product = await createProduct({ slug: 'ep-sync', price: 2000 });
    expect((await Product.findById(product._id)).effectivePrice).toBe(2000);

    await productService.updateProduct(product._id, { discountPrice: 1500 });
    expect((await Product.findById(product._id)).effectivePrice).toBe(1500);

    await productService.updateProduct(product._id, { price: 2500 });
    expect((await Product.findById(product._id)).effectivePrice).toBe(1500);
  });
});
