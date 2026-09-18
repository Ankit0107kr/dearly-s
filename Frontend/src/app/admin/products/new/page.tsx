"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminApi, type AdminCategory } from "@/lib/api";
import { Button } from "@/components/ui/Button";

function parentId(category: AdminCategory): string | null {
  if (!category.parentCategory) return null;
  if (typeof category.parentCategory === "string") return category.parentCategory;
  return category.parentCategory._id;
}

export default function AdminNewProductPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminApi.categories();
        if (!cancelled) {
          setCategories(res.data?.categories ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load categories");
        }
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rootCategories = useMemo(
    () => categories.filter((c) => !parentId(c)),
    [categories]
  );

  const subCategories = useMemo(() => {
    if (!categoryId) return [];
    return categories.filter((c) => parentId(c) === categoryId);
  }, [categories, categoryId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!categoryId) {
      setError("Select a category");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("category", categoryId);
    if (subCategoryId) formData.append("subCategory", subCategoryId);
    formData.append("description", description);
    formData.append("price", price);
    if (discountPrice) formData.append("discountPrice", discountPrice);
    formData.append("isFeatured", String(isFeatured));
    formData.append(
      "inventory",
      JSON.stringify({ stock: Number(stock) || 0 })
    );

    if (images?.length) {
      Array.from(images).forEach((file) => formData.append("images", file));
    }

    setSubmitting(true);
    try {
      const res = await adminApi.createProduct(formData);
      setSuccess(res.message || "Product created");
      setName("");
      setDescription("");
      setPrice("");
      setDiscountPrice("");
      setStock("0");
      setIsFeatured(false);
      setCategoryId("");
      setSubCategoryId("");
      setImages(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <Link href="/products" className="text-sm text-ink/60 hover:text-ink">
          ← Back to shop
        </Link>
        <h1 className="mt-2 font-display text-3xl text-ink">Add product</h1>
        <p className="mt-1 text-sm text-ink/65">
          Images upload with the product in one request. Categories load from the admin API.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 rounded-xs border border-ink/10 bg-white/80 p-6 shadow-soft">
        {error && (
          <p className="rounded-xs bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-xs bg-green-50 px-3 py-2 text-sm text-green-900" role="status">
            {success}
          </p>
        )}

        <label className="block text-sm font-medium text-ink">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xs border border-ink/15 bg-white px-3 py-2 text-sm"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink">
            Category
            <select
              required
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSubCategoryId("");
              }}
              disabled={loadingCategories}
              className="mt-1 w-full rounded-xs border border-ink/15 bg-white px-3 py-2 text-sm"
            >
              <option value="">
                {loadingCategories ? "Loading…" : "Select category"}
              </option>
              {rootCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-ink">
            Subcategory
            <select
              value={subCategoryId}
              onChange={(e) => setSubCategoryId(e.target.value)}
              disabled={!subCategories.length}
              className="mt-1 w-full rounded-xs border border-ink/15 bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">None</option>
              {subCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium text-ink">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xs border border-ink/15 bg-white px-3 py-2 text-sm"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-medium text-ink">
            Price (₹)
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full rounded-xs border border-ink/15 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Discount price
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              className="mt-1 w-full rounded-xs border border-ink/15 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Stock
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="mt-1 w-full rounded-xs border border-ink/15 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-ink">
          Images
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(e.target.files)}
            className="mt-1 block w-full text-sm"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
          />
          Featured product
        </label>

        <Button type="submit" disabled={submitting || loadingCategories}>
          {submitting ? "Creating…" : "Create product"}
        </Button>
      </form>
    </main>
  );
}
