const JSON_FIELDS = ['variants', 'customizationFields', 'inventory', 'tags', 'images'];

const parseJsonField = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    const error = new Error(`Invalid JSON for "${fieldName}"`);
    error.statusCode = 400;
    throw error;
  }
};

const parseProductBody = (req, _res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    for (const field of JSON_FIELDS) {
      const parsed = parseJsonField(req.body[field], field);
      if (parsed !== undefined) {
        req.body[field] = parsed;
      } else if (req.body[field] === '') {
        delete req.body[field];
      }
    }

    if (req.body.price !== undefined && req.body.price !== '') {
      req.body.price = Number(req.body.price);
    }
    if (req.body.discountPrice !== undefined && req.body.discountPrice !== '') {
      req.body.discountPrice = Number(req.body.discountPrice);
    } else if (req.body.discountPrice === '') {
      delete req.body.discountPrice;
    }

    if (req.body.isFeatured !== undefined && req.body.isFeatured !== '') {
      req.body.isFeatured = req.body.isFeatured === true || req.body.isFeatured === 'true';
    }

    if (req.body.subCategory === '') {
      delete req.body.subCategory;
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = parseProductBody;
