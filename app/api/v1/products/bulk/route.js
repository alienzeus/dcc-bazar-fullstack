import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { apiMiddleware } from '../../middleware';

// Helper: validate one product
function validateProduct(p) {
  const requiredFields = ['title', 'buyPrice', 'sellPrice', 'stock', 'category', 'brand'];
  const missing = requiredFields.filter((f) => p?.[f] === undefined || p?.[f] === null || p?.[f] === '');
  return { ok: missing.length === 0, missing };
}

// Helper: generate SKU candidates
function makeSku(prefix, num, width = 6) {
  return `${prefix}${String(num).padStart(width, '0')}`;
}

/**
 * POST /api/v1/products/bulk
 * Body: { products: [...] }
 * Query:
 *  - mode=partial (default) | failFast
 *  - skuPrefix=SKU-
 */
export async function POST(request) {
  const middlewareResponse = await apiMiddleware(request);
  if (middlewareResponse.status !== 200) return middlewareResponse;

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get('mode') || 'partial').toLowerCase(); // partial | failfast
    const skuPrefix = searchParams.get('skuPrefix') || 'SKU-';

    const body = await request.json();
    const products = body?.products;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Body must include non-empty "products" array' },
        { status: 400 }
      );
    }

    // Validate all first
    const validations = products.map((p, idx) => {
      const v = validateProduct(p);
      return { index: idx, ...v };
    });

    const invalid = validations.filter((v) => !v.ok);

    if (invalid.length > 0 && mode === 'failfast') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          invalid: invalid.map((x) => ({ index: x.index, missingFields: x.missing }))
        },
        { status: 400 }
      );
    }

    // Filter valid items for processing
    const validItems = products
      .map((p, idx) => ({ p, idx }))
      .filter(({ idx }) => validations[idx].ok);

    // Collect provided SKUs + check duplicates within request
    const providedSkus = new Map();
    const requestDupSkuErrors = [];
    for (const { p, idx } of validItems) {
      if (p.sku) {
        if (providedSkus.has(p.sku)) {
          requestDupSkuErrors.push({
            index: idx,
            error: `Duplicate SKU in request: ${p.sku}`
          });
        } else {
          providedSkus.set(p.sku, idx);
        }
      }
    }

    if (requestDupSkuErrors.length > 0 && mode === 'failfast') {
      return NextResponse.json(
        { success: false, error: 'Duplicate SKUs in request', invalid: requestDupSkuErrors },
        { status: 400 }
      );
    }

    // Check which provided SKUs already exist in DB
    const providedSkuList = [...providedSkus.keys()];
    const existingSkuDocs = providedSkuList.length
      ? await Product.find({ sku: { $in: providedSkuList } }).select('sku').lean()
      : [];

    const existingSkuSet = new Set(existingSkuDocs.map((d) => d.sku));
    const existingSkuErrors = [];
    for (const sku of existingSkuSet) {
      existingSkuErrors.push({
        index: providedSkus.get(sku),
        error: `SKU already exists: ${sku}`
      });
    }

    if (existingSkuErrors.length > 0 && mode === 'failfast') {
      return NextResponse.json(
        { success: false, error: 'Some SKUs already exist', invalid: existingSkuErrors },
        { status: 400 }
      );
    }

    // Build docs, auto-generate SKUs for items without sku
    // IMPORTANT: avoid countDocuments() (race). Use "last SKU" approach.
    const lastWithSku = await Product.findOne({ sku: new RegExp(`^${skuPrefix}\\d+$`) })
      .sort({ createdAt: -1 })
      .select('sku')
      .lean();

    let nextNum = 1;
    if (lastWithSku?.sku) {
      const m = lastWithSku.sku.match(/(\d+)$/);
      if (m) nextNum = parseInt(m[1], 10) + 1;
    }

    // We'll ensure new SKUs are unique vs DB and within this batch
    // Preload existing SKU candidates if needed (minimal check in loop)
    const batchGenerated = new Set();

    const docsToInsert = [];
    const indexMap = []; // map inserted doc position -> original index

    // Record errors so we can do partial results
    const perItemErrors = new Map();

    // Add pre-errors (invalid validations / dup / existing)
    for (const x of invalid) perItemErrors.set(x.index, { error: 'Missing required fields', missingFields: x.missing });
    for (const x of requestDupSkuErrors) perItemErrors.set(x.index, { error: x.error });
    for (const x of existingSkuErrors) perItemErrors.set(x.index, { error: x.error });

    for (const { p, idx } of validItems) {
      // Skip items that already have recorded errors (partial mode)
      if (perItemErrors.has(idx)) continue;

      const doc = {
        title: p.title,
        description: p.description || '',
        buyPrice: parseFloat(p.buyPrice),
        sellPrice: parseFloat(p.sellPrice),
        stock: parseInt(p.stock),
        minStock: parseInt(p.minStock) || 5,
        category: p.category,
        brand: p.brand,
        sku: p.sku,
        tags: p.tags || [],
        images: p.images || [],
        isActive: p.isActive !== undefined ? p.isActive : true
      };

      // Generate SKU if missing
      if (!doc.sku) {
        // find first free SKU number
        while (true) {
          const candidate = makeSku(skuPrefix, nextNum++);
          if (!batchGenerated.has(candidate) && !existingSkuSet.has(candidate)) {
            doc.sku = candidate;
            batchGenerated.add(candidate);
            break;
          }
        }
      }

      docsToInsert.push(doc);
      indexMap.push(idx);
    }

    if (docsToInsert.length === 0) {
      // Nothing to insert (all invalid)
      return NextResponse.json(
        {
          success: false,
          error: 'No valid products to insert',
          results: products.map((_, i) => {
            const e = perItemErrors.get(i);
            return e ? { index: i, success: false, ...e } : { index: i, success: false, error: 'Unknown error' };
          })
        },
        { status: 400 }
      );
    }

    // Insert many
    // ordered=false => continue inserting even if some fail (e.g., rare SKU race)
    const inserted = await Product.insertMany(docsToInsert, { ordered: mode === 'failfast' });

    // Build per-item results
    const results = products.map((_, i) => {
      const e = perItemErrors.get(i);
      if (e) return { index: i, success: false, ...e };
      return { index: i, success: false, error: 'Not processed' }; // will override below
    });

    // Map inserted docs back to original indices
    inserted.forEach((doc, pos) => {
      const originalIndex = indexMap[pos];
      results[originalIndex] = { index: originalIndex, success: true, product: doc };
    });

    const createdCount = results.filter((r) => r.success).length;
    const failedCount = results.length - createdCount;

    return NextResponse.json(
      {
        success: failedCount === 0,
        message:
          failedCount === 0
            ? 'All products created successfully'
            : `Bulk create completed: ${createdCount} created, ${failedCount} failed`,
        createdCount,
        failedCount,
        results
      },
      { status: failedCount === 0 ? 201 : 207 } // 207 Multi-Status for partial
    );
  } catch (error) {
    console.error('API V1 - Bulk product creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create products in bulk' },
      { status: 500 }
    );
  }
}
