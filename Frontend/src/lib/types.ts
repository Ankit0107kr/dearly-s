export type Money = number; // stored in paise (smallest INR unit)

export type ProductArt = {
  from: string;
  to: string;
  motif: string;
  pattern?: "dots" | "rings" | "confetti" | "waves";
};

export type ProductVariant = {
  id: string;
  label: string;
  swatch?: string;
  priceDelta?: Money;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: Money;
  compareAt?: Money;
  categoryId: string;
  subcategoryId: string;
  occasionIds: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  badge?: string;
  art: ProductArt;
  variants?: ProductVariant[];
  highlights: string[];
  specs: { label: string; value: string }[];
  personalisable: boolean;
  deliveryEta: string;
  /** Cloudinary / CDN URL when loaded from the API. */
  image?: string;
};

export type Subcategory = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  blurb: string;
  motif: string;
  accent: string;
  image: string;
};

export type Occasion = {
  id: string;
  name: string;
  slug: string;
  motif: string;
  accent: string;
  window: string;
  image: string;
  note: string;
};

export type CartLine = {
  productId: string;
  variantId?: string;
  quantity: number;
  giftNote?: string;
};

export type CartLineView = CartLine & {
  product: Product;
  variant?: ProductVariant;
  unitPrice: Money;
  lineTotal: Money;
};

export type Address = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

export type ShippingMethod = {
  id: string;
  name: string;
  detail: string;
  price: Money;
  eta: string;
};

export type OrderSummary = {
  subtotal: Money;
  discount: Money;
  shipping: Money;
  tax: Money;
  total: Money;
};
