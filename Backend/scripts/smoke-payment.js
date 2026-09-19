/**
 * Payment smoke test — run against a live server: `npm run smoke:payment`.
 *
 * Signs a verify payload with the same HMAC Razorpay uses, so it exercises the
 * real confirmation path (signature check, markOrderPaid, inventory reduction,
 * status history, replay safety) without driving the gateway's UI. It creates a
 * real Razorpay order, so it needs RAZORPAY_KEY_ID/SECRET set.
 *
 * Run it alone: it moves real stock, so a concurrent test on the same product
 * will make the inventory assertions disagree.
 */
require('dotenv').config();
const crypto = require('crypto');
const API = 'http://localhost:5001/api/v1';
const SECRET = process.env.RAZORPAY_KEY_SECRET;
const SLUG = 'housewarming-ritual-box';

const jar = [];
const f = async (p, o = {}) => {
  const r = await fetch(API + p, {
    ...o,
    headers: { 'Content-Type': 'application/json', ...(o.headers || {}), cookie: jar.join('; ') },
  });
  (r.headers.getSetCookie?.() || []).forEach((c) => jar.push(c.split(';')[0]));
  return { status: r.status, body: await r.json() };
};

let pass = 0, fail = 0;
const check = (name, cond, detail) => {
  console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  cond ? pass++ : fail++;
};

(async () => {
  const email = `sig-${Date.now()}@example.com`;
  await f('/auth/register', { method: 'POST', body: JSON.stringify({ firstName: 'Sig', lastName: 'Test', email, password: 'Password@123' }) });

  const p0 = (await f(`/products/slug/${SLUG}`)).body.data.product;
  const before = { stock: p0.inventory.stock, reserved: p0.inventory.reservedStock ?? 0 };
  const unit = p0.discountPrice ?? p0.price;

  await f('/cart/items', { method: 'POST', body: JSON.stringify({ productId: p0._id, quantity: 2 }) });
  const cart = (await f('/cart')).body.data.cart;
  check('cart priced from the catalogue', cart.items[0].unitPrice === unit, `₹${cart.items[0].unitPrice} × ${cart.items[0].quantity}`);

  const addr = (await f('/users/me/addresses', { method: 'POST', body: JSON.stringify({ fullName: 'Sig Test', phone: '9833221144', addressLine1: '1 Lane', city: 'Pune', state: 'MH', postalCode: '411001' }) })).body.data.address;
  const created = await f('/orders', { method: 'POST', headers: { 'Idempotency-Key': 'sig-' + Date.now() }, body: JSON.stringify({ addressId: addr._id }) });
  const order = created.body.data.order;
  const intent = created.body.data.payment;

  check('order created', created.status === 201, `${order.orderNumber} ₹${order.totalAmount}`);
  check('real Razorpay order issued', String(intent.razorpayOrderId).startsWith('order_'), intent.razorpayOrderId);
  const arith = Math.round((order.subtotal - order.discount + order.deliveryFee + order.tax) * 100) / 100;
  check('totals reconcile', Math.abs(arith - order.totalAmount) < 0.01, `${order.subtotal}−${order.discount}+${order.deliveryFee}+${order.tax} = ₹${order.totalAmount}`);
  check('gateway amount equals order total', Math.abs(intent.amount - order.totalAmount) < 0.01, `₹${intent.amount}`);

  const held = (await f(`/products/slug/${SLUG}`)).body.data.product.inventory;
  check('stock reserved, not yet deducted', held.stock === before.stock && held.reservedStock === before.reserved + 2, `stock ${held.stock}, reserved ${before.reserved}→${held.reservedStock}`);

  // a tampered signature must be rejected
  const paymentId = 'pay_' + crypto.randomBytes(8).toString('hex');
  const bad = await f('/payments/verify', { method: 'POST', body: JSON.stringify({ razorpay_order_id: intent.razorpayOrderId, razorpay_payment_id: paymentId, razorpay_signature: 'deadbeef' }) });
  check('forged signature rejected', bad.status === 400, bad.body.message);

  // correctly signed, exactly as Razorpay would
  const sig = crypto.createHmac('sha256', SECRET).update(`${intent.razorpayOrderId}|${paymentId}`).digest('hex');
  const ok = await f('/payments/verify', { method: 'POST', body: JSON.stringify({ razorpay_order_id: intent.razorpayOrderId, razorpay_payment_id: paymentId, razorpay_signature: sig }) });
  check('valid signature accepted', ok.status === 200, ok.body.message);

  const paid = (await f(`/orders/${order._id}`)).body.data.order;
  check('order marked PAID/PAYMENT_CONFIRMED', paid.paymentStatus === 'PAID' && paid.orderStatus === 'PAYMENT_CONFIRMED', `${paid.paymentStatus}/${paid.orderStatus}`);
  check('status history is ordered', (paid.statusHistory || []).map((h) => h.status).join(',') === 'PLACED,PAYMENT_CONFIRMED', (paid.statusHistory || []).map((h) => h.status).join(' → '));
  check('reservation cleared on payment', !paid.reservationExpiresAt, 'reservationExpiresAt unset');

  const after = (await f(`/products/slug/${SLUG}`)).body.data.product.inventory;
  check('inventory synced', after.stock === before.stock - 2 && after.reservedStock === before.reserved, `stock ${before.stock}→${after.stock}, reserved back to ${after.reservedStock}`);

  const emptied = (await f('/cart')).body.data.cart;
  check('server cart emptied', (emptied.items || []).length === 0, `${(emptied.items || []).length} items`);

  // replaying the same verify must not double-apply
  const replay = await f('/payments/verify', { method: 'POST', body: JSON.stringify({ razorpay_order_id: intent.razorpayOrderId, razorpay_payment_id: paymentId, razorpay_signature: sig }) });
  const after2 = (await f(`/products/slug/${SLUG}`)).body.data.product.inventory;
  check('replayed verify does not double-deduct', after2.stock === after.stock, `stock still ${after2.stock} (replay HTTP ${replay.status})`);

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  process.exit(fail ? 1 : 0);
})();
