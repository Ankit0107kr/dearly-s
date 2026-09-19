import request from 'supertest';
import app from '../src/app.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';

let counter = 0;
const unique = () => `${Date.now()}-${(counter += 1)}`;

export const registerUser = async (overrides = {}) => {
  const agent = request.agent(app);
  const response = await agent.post('/api/v1/auth/register').send({
    firstName: 'Test',
    lastName: 'User',
    email: `user-${unique()}@example.com`,
    password: 'Password@123',
    ...overrides,
  });
  return { agent, user: response.body.data.user };
};

export const createCategory = (overrides = {}) =>
  Category.create({ name: `Category ${unique()}`, slug: `category-${unique()}`, ...overrides });

export const createProduct = async (overrides = {}) => {
  const category = overrides.category || (await createCategory())._id;
  return Product.create({
    name: `Product ${unique()}`,
    slug: `product-${unique()}`,
    category,
    price: 500,
    inventory: { sku: `SKU-${unique()}`, stock: 10 },
    ...overrides,
  });
};

export const createAddress = async (agent) => {
  const response = await agent.post('/api/v1/addresses').send({
    fullName: 'Test User',
    phone: '9999999999',
    addressLine1: '1 Test Street',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411001',
  });
  return response.body.data.address;
};
