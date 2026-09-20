const categoryService = require('../services/category.service');
const { TAXONOMY_KINDS } = require('../utils/constants');
const { asyncHandler } = require('../utils/helpers');
const { sendSuccess } = require('../utils/response');

const listCategories = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const categories = await categoryService.listCategories({ includeInactive, kind: req.query.kind });
  return sendSuccess(res, {
    message: 'Categories fetched successfully',
    data: { categories },
  });
});

const getCategoryTree = asyncHandler(async (req, res) => {
  const tree = await categoryService.getCategoryTree();
  return sendSuccess(res, {
    message: 'Category tree fetched successfully',
    data: { categories: tree },
  });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Category created successfully',
    data: { category },
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  return sendSuccess(res, {
    message: 'Category updated successfully',
    data: { category },
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.softDeleteCategory(req.params.id);
  return sendSuccess(res, {
    message: 'Category deactivated successfully',
    data: { category },
  });
});

const listOccasions = asyncHandler(async (req, res) => {
  const occasions = await categoryService.listCategories({ kind: TAXONOMY_KINDS.OCCASION });
  return sendSuccess(res, {
    message: 'Occasions fetched successfully',
    data: { occasions },
  });
});

module.exports = {
  listCategories,
  listOccasions,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
};
