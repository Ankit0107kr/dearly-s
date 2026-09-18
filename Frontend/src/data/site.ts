import type { ShippingMethod } from "@/lib/types";

export const brand = {
  name: "Gifty",
  tagline: "Gifting, but thoughtful.",
  supportEmail: "hello@gifty.shop",
  supportPhone: "+91 80 4718 2200",
  currency: "INR",
  currencySymbol: "₹",
};

export const announcements = [
  { id: "a1", text: "Free express delivery over ₹1,499", motif: "truck" },
  { id: "a2", text: "Hand-written gift notes on every order", motif: "engrave" },
  { id: "a3", text: "Festive drop is live — up to 50% off", motif: "diya" },
  { id: "a4", text: "Order by 4pm for same-day dispatch", motif: "fast" },
  { id: "a5", text: "Corporate gifting from 10 units", motif: "work" },
];

export const navigation = [
  {
    label: "Shop all",
    href: "/products",
    columns: [
      {
        heading: "Shop by category",
        links: [
          { label: "Gift Hampers", href: "/products?category=gift-hampers" },
          { label: "Personalised", href: "/products?category=personalised" },
          { label: "Home & Living", href: "/products?category=home-living" },
          { label: "Gourmet", href: "/products?category=gourmet" },
          { label: "Tech & Desk", href: "/products?category=tech-desk" },
          { label: "Kids & Play", href: "/products?category=kids-play" },
        ],
      },
      {
        heading: "Shop by occasion",
        links: [
          { label: "Birthday", href: "/products?occasion=birthday" },
          { label: "Anniversary", href: "/products?occasion=anniversary" },
          { label: "Wedding", href: "/products?occasion=wedding" },
          { label: "Diwali", href: "/products?occasion=diwali" },
          { label: "Housewarming", href: "/products?occasion=housewarming" },
          { label: "Corporate", href: "/products?occasion=corporate" },
        ],
      },
      {
        heading: "Shop by price",
        links: [
          { label: "Under ₹1,000", href: "/products?max=100000" },
          { label: "₹1,000 – ₹2,500", href: "/products?min=100000&max=250000" },
          { label: "₹2,500 – ₹5,000", href: "/products?min=250000&max=500000" },
          { label: "Above ₹5,000", href: "/products?min=500000" },
        ],
      },
    ],
    feature: {
      title: "Festive Lighting Edit",
      copy: "Diyas, candles and warm lamps, ready to ship today.",
      href: "/products?occasion=diwali",
      motif: "diya",
    },
  },
  { label: "Hampers", href: "/products?category=gift-hampers" },
  { label: "Personalised", href: "/products?category=personalised" },
  { label: "Occasions", href: "/products?view=occasions" },
  { label: "Corporate", href: "/products?occasion=corporate" },
];

/**
 * Placeholder photography from Unsplash. Each banner links straight through to
 * a filtered product list — swap `image` for your own CDN when assets land.
 */
const img = (id: string, w = 2000) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=72`;

export const heroSlides = [
  {
    id: "h1",
    eyebrow: "Festive drop 2026",
    title: "Gifts that land",
    accent: "properly.",
    copy: "Hand-packed hampers, engraved keepsakes and small-batch gourmet — curated so you can stop scrolling and start giving.",
    cta: { label: "Shop the drop", href: "/products?occasion=diwali" },
    altCta: { label: "Browse everything", href: "/products" },
    motif: "diya",
    image: img("1549465220-1a8b9238cd48"),
    align: "left" as const,
  },
  {
    id: "h2",
    eyebrow: "Personalised",
    title: "Put their name",
    accent: "on it.",
    copy: "Engraved brass, star maps plotted to a date, photo games printed from your camera roll. Made to order in five days.",
    cta: { label: "Make it personal", href: "/products?category=personalised" },
    altCta: { label: "See how it works", href: "/products?category=personalised" },
    motif: "engrave",
    image: img("1519681393784-d120267933ba"),
    align: "center" as const,
  },
  {
    id: "h3",
    eyebrow: "Under ₹1,000",
    title: "Small gifts,",
    accent: "big landing.",
    copy: "Letterbox hampers, cake in a jar, tea flights. Everything here ships in 48 hours and fits a modest budget.",
    cta: { label: "Shop under ₹1,000", href: "/products?max=100000" },
    altCta: { label: "Gift finder", href: "/products?view=occasions" },
    motif: "gift",
    image: img("1512909006721-3d6018887383"),
    align: "left" as const,
  },
];

export const promoBand = {
  eyebrow: "Festive offers",
  title: "Up to 50% off the festive edit",
  copy: "Diyas, candles and warm lamps, reduced until stock runs out. Free express delivery over ₹1,499.",
  cta: { label: "Shop the offers", href: "/products?occasion=diwali" },
  image: img("1607083206869-4c7672e72a8a", 1800),
};

/** Recipient tiles — each one is just a preset view of the product list. */
export const recipients = [
  { id: "r-her", label: "For Her", note: "Considered, never generic", href: "/products?category=personalised", image: img("1596462502278-27bfdc403348", 900) },
  { id: "r-him", label: "For Him", note: "Things he would not buy himself", href: "/products?category=tech-desk", image: img("1523170335258-f5ed11844a49", 900) },
  { id: "r-kids", label: "For Kids", note: "Joy-first, parent approved", href: "/products?category=kids-play", image: img("1556905055-8f358a7a47b2", 900) },
  { id: "r-couples", label: "For Couples", note: "Anniversaries, done properly", href: "/products?occasion=anniversary", image: img("1512909006721-3d6018887383", 900) },
  { id: "r-hosts", label: "For Hosts", note: "Never arrive empty-handed", href: "/products?occasion=housewarming", image: img("1608571423902-eed4a5ad8108", 900) },
  { id: "r-team", label: "For The Team", note: "Bulk, branded, on time", href: "/products?occasion=corporate", image: img("1441986300917-64674bd600d8", 900) },
];

/** Budget bands, mapped straight onto the PLP price filter. */
export const budgetBands = [
  { label: "Under ₹1,000", note: "Letterbox-friendly", href: "/products?max=100000" },
  { label: "₹1,000 – ₹2,500", note: "The safe bet", href: "/products?min=100000&max=250000" },
  { label: "₹2,500 – ₹5,000", note: "Properly considered", href: "/products?min=250000&max=500000" },
  { label: "Above ₹5,000", note: "The grand gesture", href: "/products?min=500000" },
];

/** Makers rail — a marquee of the workshops we buy from. */
export const makers = [
  { name: "Coonoor Cacao", craft: "Chocolate", note: "Since 2011" },
  { name: "Moradabad Brass", craft: "Metalwork", note: "Third generation" },
  { name: "Pondicherry Clay", craft: "Ceramics", note: "Wheel-thrown" },
  { name: "Nilgiri Leaf", craft: "Tea", note: "Single estate" },
  { name: "Jaipur Bindery", craft: "Paper", note: "Letterpress" },
  { name: "Kolkata Silk", craft: "Textiles", note: "Hand-rolled" },
  { name: "Anamalai Apiary", craft: "Honey", note: "Single forest" },
  { name: "Mysore Wax", craft: "Candles", note: "Beeswax only" },
];

export const uspStrip = [
  { motif: "truck", title: "Free express over ₹1,499", copy: "Dispatched within 24 hours" },
  { motif: "engrave", title: "Hand-written notes", copy: "Free on every single order" },
  { motif: "lock", title: "Secure payments", copy: "Razorpay UPI, cards, netbanking" },
  { motif: "returns", title: "14-day returns", copy: "No questions on unopened gifts" },
];

export const testimonials = [
  {
    id: "t1",
    quote:
      "I sent the letter box to my parents for their 30th. My father called me, which he does not do, and read one out loud.",
    name: "Ritika S.",
    detail: "Bengaluru · Anniversary Letter Box",
    rating: 5,
  },
  {
    id: "t2",
    quote:
      "Ordered 60 welcome sets for a new cohort. Every box landed on the same day and looked identical. That never happens.",
    name: "Aman T.",
    detail: "Gurugram · Corporate Welcome Set",
    rating: 5,
  },
  {
    id: "t3",
    quote:
      "The chocolate flight turned into a whole evening. We argued about the 72% for an hour. Worth every rupee.",
    name: "Neha & Vikram",
    detail: "Pune · Chocolate Flight",
    rating: 5,
  },
  {
    id: "t4",
    quote:
      "Ordered at 3pm in a panic, it arrived next morning with the note written out properly. Genuinely saved me.",
    name: "Karthik R.",
    detail: "Chennai · Birthday Cake In A Jar",
    rating: 4,
  },
];

export const journalPosts = [
  {
    id: "j1",
    title: "How to write a gift note that isn't awkward",
    excerpt: "Three sentences, one specific memory, no closing cliché. A short field guide.",
    readTime: "4 min",
    motif: "engrave",
    image: img("1513475382585-d06e58bcb0e0", 900),
  },
  {
    id: "j2",
    title: "The case for giving one expensive thing",
    excerpt: "Why a single considered object beats a basket of filler, almost every time.",
    readTime: "6 min",
    motif: "gift",
    image: img("1513201099705-a9746e1e201f", 900),
  },
  {
    id: "j3",
    title: "Corporate gifting without the landfill",
    excerpt: "What people actually keep from a welcome kit, based on 4,000 orders.",
    readTime: "5 min",
    motif: "work",
    image: img("1481833761820-0509d3217039", 900),
  },
];

export const footerColumns = [
  {
    heading: "Shop",
    links: [
      { label: "All gifts", href: "/products" },
      { label: "Gift hampers", href: "/products?category=gift-hampers" },
      { label: "Personalised", href: "/products?category=personalised" },
      { label: "Under ₹1,000", href: "/products?max=100000" },
      { label: "Corporate", href: "/products?occasion=corporate" },
    ],
  },
  {
    heading: "Occasions",
    links: [
      { label: "Birthday", href: "/products?occasion=birthday" },
      { label: "Anniversary", href: "/products?occasion=anniversary" },
      { label: "Wedding", href: "/products?occasion=wedding" },
      { label: "Diwali", href: "/products?occasion=diwali" },
      { label: "New baby", href: "/products?occasion=new-baby" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "Track an order", href: "/products" },
      { label: "Delivery & timing", href: "/products" },
      { label: "Returns", href: "/products" },
      { label: "Gift notes", href: "/products" },
      { label: "Contact us", href: "/products" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Our story", href: "/products" },
      { label: "Makers we work with", href: "/products" },
      { label: "Sustainability", href: "/products" },
      { label: "Careers", href: "/products" },
    ],
  },
];

export const shippingMethods: ShippingMethod[] = [
  {
    id: "ship-standard",
    name: "Standard",
    detail: "Tracked, delivered by our courier partners",
    price: 9900,
    eta: "3–5 working days",
  },
  {
    id: "ship-express",
    name: "Express",
    detail: "Priority dispatch, first out of the warehouse",
    price: 19900,
    eta: "1–2 working days",
  },
  {
    id: "ship-timed",
    name: "Timed delivery",
    detail: "Pick the exact day it should land",
    price: 34900,
    eta: "On your chosen date",
  },
];

export const freeShippingThreshold = 149900;
export const taxRate = 0.18;

export const coupons: Record<string, { type: "percent" | "flat"; value: number; label: string }> = {
  GIFTY10: { type: "percent", value: 10, label: "10% off your order" },
  FESTIVE500: { type: "flat", value: 50000, label: "₹500 off" },
  FIRSTGIFT: { type: "percent", value: 15, label: "15% off, first order" },
};
