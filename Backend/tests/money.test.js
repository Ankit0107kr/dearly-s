import { describe, expect, it } from 'vitest';
import money from '../src/utils/money.js';
import Order from '../src/models/Order.js';

const { round2, toPaise, toNumber } = money;

describe('money', () => {
  it('rounds the float drift that plain arithmetic leaves behind', () => {
    expect(3 * 1299.99).not.toBe(3899.97);
    expect(round2(3 * 1299.99)).toBe(3899.97);
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(2.675)).toBe(2.68);
  });

  it('converts to paise without drifting off the stored amount', () => {
    expect(toPaise(3285.98)).toBe(328598);
    expect(toPaise(0.1)).toBe(10);
    expect(toPaise(1299.99)).toBe(129999);
  });

  it('stores amounts exactly and reads them back as plain numbers', () => {
    const order = new Order({ totalAmount: 3899.97, subtotal: 3899.97 });
    expect(order.get('totalAmount', null, { getters: false }).toString()).toBe('3899.97');
    expect(order.totalAmount).toBe(3899.97);
    expect(typeof order.totalAmount).toBe('number');
  });

  it('serialises money to the API as a number, not a decimal wrapper', () => {
    const order = new Order({ totalAmount: 499.5 });
    const json = order.toJSON();
    expect(json.totalAmount).toBe(499.5);
    expect(typeof json.totalAmount).toBe('number');
  });

  it('reads back Doubles written before the migration', () => {
    expect(toNumber(499.99)).toBe(499.99);
  });
});
