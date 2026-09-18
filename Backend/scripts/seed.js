require('dotenv').config();

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { env, validateEnv } = require('../src/config/env');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const { ROLES } = require('../src/utils/constants');
const { slugify } = require('../src/utils/helpers');

const seed = async () => {
  validateEnv();
  await mongoose.connect(env.mongoUri);

  const adminEmail = 'admin@dearlys.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      firstName: 'Dearly',
      lastName: 'Admin',
      email: adminEmail,
      phone: '9999999999',
      password: 'Admin@12345',
      role: ROLES.ADMIN,
    });
    console.log('Admin user created:', adminEmail, '/ Admin@12345');
  } else {
    console.log('Admin user already exists');
  }

  const categories = [
    { name: 'Birthday Gifts', parent: null },
    { name: 'Anniversary Gifts', parent: null },
    { name: 'Personalized Gifts', parent: null },
  ];

  for (const item of categories) {
    const slug = slugify(item.name);
    const exists = await Category.findOne({ slug });
    if (!exists) {
      await Category.create({ name: item.name, slug, isActive: true });
    }
  }

  const birthday = await Category.findOne({ slug: 'birthday-gifts' });
  if (birthday) {
    const productSlug = 'personalized-photo-frame';
    const exists = await Product.findOne({ slug: productSlug });
    if (!exists) {
      await Product.create({
        name: 'Personalized Photo Frame',
        slug: productSlug,
        description: 'Custom photo frame with names and message.',
        shortDescription: 'Perfect keepsake gift',
        category: birthday._id,
        price: 1299,
        discountPrice: 999,
        images: [],
        variants: [
          {
            label: 'Medium / Wood',
            attributes: { size: 'Medium', material: 'Wood' },
            sku: 'PPF-M-W',
            price: 999,
            stock: 25,
          },
        ],
        customizationFields: [
          { name: 'Couple Name', type: 'TEXT', required: true, placeholder: 'Enter names' },
          { name: 'Message', type: 'TEXTAREA', required: false, placeholder: 'Your message' },
          { name: 'Photo', type: 'IMAGE', required: true },
        ],
        inventory: { stock: 0 },
        tags: ['personalized', 'frame', 'birthday'],
        isActive: true,
        isFeatured: true,
      });
      console.log('Sample product seeded');
    }
  }

  await mongoose.disconnect();
  console.log('Seed completed');
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
