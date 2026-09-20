const Category = require('../models/Category');
const { slugify } = require('../utils/helpers');
const { TAXONOMY_KINDS } = require('../utils/constants');

const ensureUniqueCategorySlug = async (name, excludeId) => {
  const base = slugify(name);
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await Category.findOne({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (!existing) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
};

const listCategories = async ({ includeInactive = false, kind } = {}) => {
  const filter = includeInactive ? {} : { isActive: true };
  if (kind) {
    filter.kind = kind;
  }
  return Category.find(filter)
    .sort({ sortOrder: 1, name: 1 })
    .populate('parentCategory', 'name slug');
};

const getCategoryTree = async () => {
  const categories = await listCategories({ kind: TAXONOMY_KINDS.CATEGORY });
  const map = new Map(categories.map((cat) => [cat._id.toString(), { ...cat.toObject(), children: [] }]));
  const roots = [];

  for (const cat of map.values()) {
    if (cat.parentCategory) {
      const parentId = cat.parentCategory._id?.toString() || cat.parentCategory.toString();
      const parent = map.get(parentId);
      if (parent) {
        parent.children.push(cat);
      } else {
        roots.push(cat);
      }
    } else {
      roots.push(cat);
    }
  }

  return roots;
};

// Walks up the proposed parent chain so a category cannot end up inside itself.
const assertNoCycle = async (categoryId, parentId) => {
  if (!parentId) {
    return;
  }

  let cursor = parentId;
  while (cursor) {
    if (cursor.toString() === categoryId.toString()) {
      const error = new Error('A category cannot be nested inside itself');
      error.statusCode = 400;
      throw error;
    }
    const parent = await Category.findById(cursor).select('parentCategory');
    cursor = parent?.parentCategory;
  }
};

const createCategory = async (payload) => {
  const slug = payload.slug ? slugify(payload.slug) : await ensureUniqueCategorySlug(payload.name);
  return Category.create({ ...payload, slug });
};

const updateCategory = async (id, payload) => {
  const category = await Category.findById(id);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  if (payload.parentCategory !== undefined) {
    await assertNoCycle(id, payload.parentCategory);
  }

  if (payload.name && !payload.slug) {
    payload.slug = await ensureUniqueCategorySlug(payload.name, id);
  } else if (payload.slug) {
    payload.slug = slugify(payload.slug);
  }

  Object.assign(category, payload);
  await category.save();
  return category;
};

const softDeleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }
  category.isActive = false;
  await category.save();
  return category;
};

module.exports = {
  listCategories,
  getCategoryTree,
  createCategory,
  updateCategory,
  softDeleteCategory,
};
