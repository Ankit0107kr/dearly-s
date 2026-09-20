require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { env, validateEnv } = require('../src/config/env');
const Product = require('../src/models/Product');
const { uploadBufferToCloudinary, deleteCloudinaryAsset } = require('../src/utils/upload');
const { isCloudinaryConfigured } = require('../src/config/cloudinary');

const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i === -1 ? undefined : args[i + 1];
  };
  return {
    dir: get('--dir'),
    slug: get('--slug'),
    append: args.includes('--append'),
    skipExisting: args.includes('--skip-existing'),
    dryRun: args.includes('--dry-run'),
  };
};

// "2.jpg" must sort before "10.jpg", so compare embedded numbers numerically.
const naturalSort = (a, b) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

const imagesIn = (dir) =>
  fs
    .readdirSync(dir)
    .filter((name) => EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort(naturalSort)
    .map((name) => path.join(dir, name));

/**
 * Two layouts are accepted:
 *   <dir>/<product-slug>/1.jpg, 2.jpg ...   (a folder per product)
 *   <dir>/<product-slug>-1.jpg, ...         (flat, slug prefix before the last dash)
 */
const groupBySlug = (dir, forcedSlug) => {
  const groups = new Map();

  if (forcedSlug) {
    groups.set(forcedSlug, imagesIn(dir));
    return groups;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const files = imagesIn(full);
      if (files.length) groups.set(entry.name.toLowerCase(), files);
      continue;
    }

    if (!EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    const base = path.basename(entry.name, path.extname(entry.name));
    const slug = base.replace(/[-_]\d+$/, '').toLowerCase();
    if (!groups.has(slug)) groups.set(slug, []);
    groups.get(slug).push(full);
  }

  for (const files of groups.values()) files.sort(naturalSort);
  return groups;
};

const run = async () => {
  const opts = parseArgs();

  if (!opts.dir) {
    console.error(
      'Usage: npm run import:images -- --dir <folder> [--slug <product-slug>] [--append] [--skip-existing] [--dry-run]'
    );
    process.exit(1);
  }
  if (!fs.existsSync(opts.dir)) {
    console.error(`Folder not found: ${opts.dir}`);
    process.exit(1);
  }
  if (!opts.dryRun && !isCloudinaryConfigured()) {
    console.error('Cloudinary is not configured — set CLOUDINARY_URL or the CLOUDINARY_* keys.');
    process.exit(1);
  }

  validateEnv();
  await mongoose.connect(env.mongoUri);

  const groups = groupBySlug(path.resolve(opts.dir), opts.slug);
  if (!groups.size) {
    console.log('No images found. Expected <dir>/<product-slug>/*.jpg or <dir>/<product-slug>-1.jpg');
    await mongoose.disconnect();
    return;
  }

  let updated = 0;
  let skipped = 0;
  let uploaded = 0;

  for (const [slug, files] of [...groups].sort()) {
    const product = await Product.findOne({ slug });
    if (!product) {
      console.warn(`  ✗ ${slug}: no product with that slug (${files.length} file(s) ignored)`);
      skipped += 1;
      continue;
    }

    if (opts.skipExisting && product.images?.length) {
      console.log(`  – ${slug}: already has ${product.images.length} image(s), skipped`);
      skipped += 1;
      continue;
    }

    if (opts.dryRun) {
      console.log(`  · ${slug}: would ${opts.append ? 'append' : 'set'} ${files.length} image(s)`);
      files.forEach((f, i) => console.log(`        ${i + 1}. ${path.basename(f)}`));
      updated += 1;
      continue;
    }

    const previous = opts.append ? [] : [...(product.images || [])];
    const next = [];

    for (const [index, file] of files.entries()) {
      const result = await uploadBufferToCloudinary(
        fs.readFileSync(file),
        `dearlys/products/${slug}`
      );
      next.push({
        url: result.url,
        publicId: result.publicId,
        alt: `${product.name} — view ${index + 1}`,
      });
      uploaded += 1;
    }

    product.images = opts.append ? [...(product.images || []), ...next] : next;
    await product.save();

    // Only after the new set is saved, so a failure mid-upload leaves the old set intact.
    for (const image of previous) {
      await deleteCloudinaryAsset(image.publicId).catch(() => {});
    }

    console.log(
      `  ✓ ${slug}: ${next.length} image(s) ${opts.append ? 'appended' : 'set'}` +
        (previous.length ? `, ${previous.length} replaced` : '')
    );
    updated += 1;
  }

  await mongoose.disconnect();
  console.log(
    `\n${opts.dryRun ? '[dry run] ' : ''}${updated} product(s) updated, ${skipped} skipped, ${uploaded} image(s) uploaded`
  );
};

run().catch((error) => {
  console.error('Image import failed:', error.message);
  process.exit(1);
});
