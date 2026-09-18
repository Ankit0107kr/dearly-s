import type { Category, Occasion, Subcategory } from "@/lib/types";

export const categories: Category[] = [
  {
    id: "cat-hampers",
    image:
      "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=1000&q=72",
    name: "Gift Hampers",
    slug: "gift-hampers",
    blurb: "Curated boxes that open like a little ceremony.",
    motif: "gift",
    accent: "var(--color-accent-600)",
  },
  {
    id: "cat-personalised",
    image:
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=72",
    name: "Personalised",
    slug: "personalised",
    blurb: "Names, dates, inside jokes — engraved to last.",
    motif: "engrave",
    accent: "var(--color-accent-600)",
  },
  {
    id: "cat-home",
    image:
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1000&q=72",
    name: "Home & Living",
    slug: "home-living",
    blurb: "Warm objects for the corners people love most.",
    motif: "candle",
    accent: "var(--color-accent-600)",
  },
  {
    id: "cat-gourmet",
    image:
      "https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=1000&q=72",
    name: "Gourmet",
    slug: "gourmet",
    blurb: "Small-batch sweet and savoury indulgences.",
    motif: "chocolate",
    accent: "var(--color-accent-700)",
  },
  {
    id: "cat-tech",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=72",
    name: "Tech & Desk",
    slug: "tech-desk",
    blurb: "Clever things for the people who tinker.",
    motif: "headphones",
    accent: "var(--color-accent-400)",
  },
  {
    id: "cat-kids",
    image:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=72",
    name: "Kids & Play",
    slug: "kids-play",
    blurb: "Joy-first gifts for the smallest humans.",
    motif: "toy",
    accent: "var(--color-accent-300)",
  },
];

export const subcategories: Subcategory[] = [
  { id: "sub-luxe-boxes", name: "Luxe Boxes", slug: "luxe-boxes", categoryId: "cat-hampers" },
  { id: "sub-mini-hampers", name: "Mini Hampers", slug: "mini-hampers", categoryId: "cat-hampers" },
  { id: "sub-corporate-sets", name: "Corporate Sets", slug: "corporate-sets", categoryId: "cat-hampers" },

  { id: "sub-engraved", name: "Engraved", slug: "engraved", categoryId: "cat-personalised" },
  { id: "sub-photo-gifts", name: "Photo Gifts", slug: "photo-gifts", categoryId: "cat-personalised" },
  { id: "sub-name-art", name: "Name Art", slug: "name-art", categoryId: "cat-personalised" },

  { id: "sub-candles", name: "Candles", slug: "candles", categoryId: "cat-home" },
  { id: "sub-decor", name: "Decor", slug: "decor", categoryId: "cat-home" },
  { id: "sub-kitchen", name: "Kitchen", slug: "kitchen", categoryId: "cat-home" },

  { id: "sub-chocolate", name: "Chocolate", slug: "chocolate", categoryId: "cat-gourmet" },
  { id: "sub-tea-coffee", name: "Tea & Coffee", slug: "tea-coffee", categoryId: "cat-gourmet" },
  { id: "sub-bakes", name: "Bakes", slug: "bakes", categoryId: "cat-gourmet" },

  { id: "sub-audio", name: "Audio", slug: "audio", categoryId: "cat-tech" },
  { id: "sub-desk", name: "Desk Setup", slug: "desk-setup", categoryId: "cat-tech" },
  { id: "sub-gadgets", name: "Gadgets", slug: "gadgets", categoryId: "cat-tech" },

  { id: "sub-soft-toys", name: "Soft Toys", slug: "soft-toys", categoryId: "cat-kids" },
  { id: "sub-games", name: "Games", slug: "games", categoryId: "cat-kids" },
  { id: "sub-keepsakes", name: "Keepsakes", slug: "keepsakes", categoryId: "cat-kids" },
];

export const occasions: Occasion[] = [
  { id: "occ-birthday", image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=72", note: "The one you cannot be late for", name: "Birthday", slug: "birthday", motif: "cake", accent: "var(--color-accent-600)", window: "All year" },
  { id: "occ-anniversary", image: "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=900&q=72", note: "Years counted properly", name: "Anniversary", slug: "anniversary", motif: "anniversary", accent: "var(--color-accent-600)", window: "All year" },
  { id: "occ-wedding", image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=72", note: "For the couple and the parents", name: "Wedding", slug: "wedding", motif: "ring", accent: "var(--color-accent-600)", window: "Nov – Feb" },
  { id: "occ-diwali", image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=72", note: "Light, sweets and good paper", name: "Diwali", slug: "diwali", motif: "diya", accent: "var(--color-accent-400)", window: "Oct – Nov" },
  { id: "occ-thank-you", image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=72", note: "Said better with an object", name: "Thank You", slug: "thank-you", motif: "thanks", accent: "var(--color-accent-700)", window: "All year" },
  { id: "occ-housewarming", image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=900&q=72", note: "Salt, bread, honey, light", name: "Housewarming", slug: "housewarming", motif: "home", accent: "var(--color-accent-600)", window: "All year" },
  { id: "occ-corporate", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=72", note: "Ten units or a thousand", name: "Corporate", slug: "corporate", motif: "work", accent: "var(--color-ink-soft)", window: "All year" },
  { id: "occ-new-baby", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=900&q=72", note: "For the family, not just the baby", name: "New Baby", slug: "new-baby", motif: "baby", accent: "var(--color-accent-300)", window: "All year" },
];

export const categoryById = new Map(categories.map((c) => [c.id, c]));
export const subcategoryById = new Map(subcategories.map((s) => [s.id, s]));
export const occasionById = new Map(occasions.map((o) => [o.id, o]));

export const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
export const occasionBySlug = new Map(occasions.map((o) => [o.slug, o]));

export const subcategoriesFor = (categoryId: string) =>
  subcategories.filter((s) => s.categoryId === categoryId);
