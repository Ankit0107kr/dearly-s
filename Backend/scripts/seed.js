require('dotenv').config();

const mongoose = require('mongoose');
const { env, validateEnv } = require('../src/config/env');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Banner = require('../src/models/Banner');
const { ROLES, TAXONOMY_KINDS } = require('../src/utils/constants');
const seedData = require('./seed-data.json');

// Idempotent: everything is keyed by slug, so re-running updates in place.
const upsertCategory = async ({ parentSlug, ...payload }, parentId) => {
  const doc = await Category.findOneAndUpdate(
    { slug: payload.slug },
    { ...payload, parentCategory: parentId || null, isActive: true },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc;
};

const seedTaxonomy = async () => {
  // Categories created before the kind discriminator existed would otherwise drop
  // out of every kind-filtered query.
  const backfilled = await Category.updateMany(
    { kind: { $exists: false } },
    { $set: { kind: TAXONOMY_KINDS.CATEGORY } }
  );
  if (backfilled.modifiedCount) {
    console.log(`Backfilled kind on ${backfilled.modifiedCount} legacy categories`);
  }

  const bySlug = new Map();

  // Parents first so children can resolve parentCategory.
  const parents = seedData.categories.filter((c) => !c.parentSlug);
  const children = seedData.categories.filter((c) => c.parentSlug);

  for (const category of parents) {
    bySlug.set(category.slug, await upsertCategory(category));
  }
  for (const category of children) {
    const parent = bySlug.get(category.parentSlug);
    bySlug.set(category.slug, await upsertCategory(category, parent?._id));
  }
  for (const occasion of seedData.occasions) {
    bySlug.set(occasion.slug, await upsertCategory(occasion));
  }

  console.log(
    `Taxonomy: ${parents.length} categories, ${children.length} subcategories, ${seedData.occasions.length} occasions`
  );
  return bySlug;
};

const seedProducts = async (bySlug) => {
  let created = 0;
  let updated = 0;

  for (const { categorySlug, subCategorySlug, occasionSlugs, ...payload } of seedData.products) {
    const category = bySlug.get(categorySlug);
    if (!category) {
      console.warn(`Skipping ${payload.slug}: unknown category ${categorySlug}`);
      continue;
    }

    const existing = await Product.findOne({ slug: payload.slug }).select('_id variants images');

    // Variant _ids must survive a re-seed or live carts lose their selection.
    const variants = (payload.variants || []).map((variant) => {
      const previous = existing?.variants?.find((v) => v.sku === variant.sku);
      return previous ? { ...variant, _id: previous._id } : variant;
    });

    await Product.findOneAndUpdate(
      { slug: payload.slug },
      {
        ...payload,
        variants,
        // Never clobber artwork uploaded through `npm run import:images`.
        images: existing?.images?.length ? existing.images : payload.images || [],
        category: category._id,
        subCategory: subCategorySlug ? bySlug.get(subCategorySlug)?._id : undefined,
        occasions: (occasionSlugs || []).map((slug) => bySlug.get(slug)?._id).filter(Boolean),
        isActive: true,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (existing) updated += 1;
    else created += 1;
  }

  console.log(`Products: ${created} created, ${updated} updated`);
};

// Backfills products written before effectivePrice existed.
const backfillEffectivePrice = async () => {
  const result = await Product.updateMany({ effectivePrice: { $in: [null, 0] } }, [
    {
      $set: {
        effectivePrice: {
          $cond: [
            { $and: [{ $gt: ['$discountPrice', 0] }, { $lt: ['$discountPrice', '$price'] }] },
            '$discountPrice',
            '$price',
          ],
        },
      },
    },
  ]);
  if (result.modifiedCount) {
    console.log(`Backfilled effectivePrice on ${result.modifiedCount} products`);
  }
};

const seedBanners = async () => {
  for (const banner of seedData.banners || []) {
    await Banner.findOneAndUpdate(
      { placement: banner.placement, title: banner.title },
      { ...banner, isActive: true },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Banners: ${(seedData.banners || []).length} upserted`);
};

const seedAdmin = async () => {
  const adminEmail = 'admin@dearlys.com';
  const admin = await User.findOne({ email: adminEmail });
  if (admin) {
    console.log('Admin user already exists');
    return;
  }

  await User.create({
    firstName: 'Dearly',
    lastName: 'Admin',
    email: adminEmail,
    phone: '9999999999',
    password: 'Admin@12345',
    role: ROLES.ADMIN,
  });
  console.log('Admin user created:', adminEmail, '/ Admin@12345');
};

const seed = async () => {
  validateEnv();
  await mongoose.connect(env.mongoUri);

  await seedAdmin();
  const bySlug = await seedTaxonomy();
  await seedProducts(bySlug);
  await backfillEffectivePrice();
  await seedBanners();

  await mongoose.disconnect();
  console.log('Seed completed');
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
