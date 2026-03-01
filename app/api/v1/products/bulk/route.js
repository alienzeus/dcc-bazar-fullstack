import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { apiMiddleware } from '../../middleware';

// Helper: validate a single product deeply
function validateProduct(p) {
  const requiredFields = ['title', 'buyPrice', 'sellPrice', 'stock', 'category', 'brand'];
  const missing = requiredFields.filter(f => p?.[f] == null || p?.[f] === '');
  
  // Check that numeric fields can be parsed and are non‑negative
  const numericFields = ['buyPrice', 'sellPrice', 'stock', 'minStock'];
  const invalidNumbers = [];
  for (const field of numericFields) {
    if (p[field] != null && p[field] !== '') {
      const num = Number(p[field]);
      if (isNaN(num) || num < 0) {
        invalidNumbers.push(field);
      }
    }
  }

  return {
    ok: missing.length === 0 && invalidNumbers.length === 0,
    missing,
    invalidNumbers,
  };
}

// Helper: generate a SKU candidate with a given prefix and number
function makeSku(prefix, num, width = 6) {
  return `${prefix}${String(num).padStart(width, '0')}`;
}

// Helper: extract numeric values safely
function toNumber(value, def = 0) {
  const num = Number(value);
  return isNaN(num) ? def : num;
}

export async function POST(request) {
  const middlewareResponse = await apiMiddleware(request);
  if (middlewareResponse.status !== 200) return middlewareResponse;

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get('mode') || 'partial').toLowerCase(); // 'partial' or 'failfast'
    const skuPrefix = searchParams.get('skuPrefix') || 'SKU-';

    const body = await request.json();
    const products = body?.products;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Body must include non-empty "products" array' },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------------------
    // 1. Validate all products first
    // ----------------------------------------------------------------------
    const validations = products.map((p, idx) => ({
      index: idx,
      ...validateProduct(p),
    }));

    const invalid = validations.filter(v => !v.ok);

    if (invalid.length > 0 && mode === 'failfast') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          invalid: invalid.map(v => ({
            index: v.index,
            missingFields: v.missing,
            invalidNumbers: v.invalidNumbers,
          })),
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------------------
    // 2. Filter out invalid items for processing (partial mode)
    // ----------------------------------------------------------------------
    const validItems = products
      .map((p, idx) => ({ p, idx }))
      .filter(({ idx }) => validations[idx].ok);

    // ----------------------------------------------------------------------
    // 3. Check for duplicate SKUs within the request and against the DB
    // ----------------------------------------------------------------------
    const providedSkus = new Map(); // sku -> index
    const requestDupErrors = [];

    for (const { p, idx } of validItems) {
      if (p.sku) {
        if (providedSkus.has(p.sku)) {
          requestDupErrors.push({
            index: idx,
            error: `Duplicate SKU in request: ${p.sku}`,
          });
        } else {
          providedSkus.set(p.sku, idx);
        }
      }
    }

    if (requestDupErrors.length > 0 && mode === 'failfast') {
      return NextResponse.json(
        { success: false, error: 'Duplicate SKUs in request', invalid: requestDupErrors },
        { status: 400 }
      );
    }

    // Find which provided SKUs already exist in the database
    const providedSkuList = [...providedSkus.keys()];
    const existingSkuDocs = providedSkuList.length
      ? await Product.find({ sku: { $in: providedSkuList } }).select('sku').lean()
      : [];
    const existingSkuSet = new Set(existingSkuDocs.map(d => d.sku));

    const existingSkuErrors = [];
    for (const sku of existingSkuSet) {
      existingSkuErrors.push({
        index: providedSkus.get(sku),
        error: `SKU already exists: ${sku}`,
      });
    }

    if (existingSkuErrors.length > 0 && mode === 'failfast') {
      return NextResponse.json(
        { success: false, error: 'Some SKUs already exist', invalid: existingSkuErrors },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------------------
    // 4. Prepare documents for insertion, auto‑generating SKUs where missing
    // ----------------------------------------------------------------------
    // Find the highest existing numeric SKU to start the counter
    const lastSkuDoc = await Product.findOne({ sku: new RegExp(`^${skuPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\d+$`) })
      .sort({ createdAt: -1 })
      .select('sku')
      .lean();

    let nextNum = 1;
    if (lastSkuDoc?.sku) {
      const match = lastSkuDoc.sku.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }

    // Sets to track SKUs we intend to use (to avoid collisions within the batch)
    const batchGeneratedSkus = new Set();

    const docsToInsert = [];
    const indexMap = []; // maps position in docsToInsert → original index

    // Pre‑fill per‑item errors (invalid validations, dupes, existing SKUs)
    const perItemErrors = new Map();
    for (const v of invalid) {
      perItemErrors.set(v.index, {
        error: 'Missing required fields or invalid numbers',
        missingFields: v.missing,
        invalidNumbers: v.invalidNumbers,
      });
    }
    for (const e of requestDupErrors) perItemErrors.set(e.index, { error: e.error });
    for (const e of existingSkuErrors) perItemErrors.set(e.index, { error: e.error });

    for (const { p, idx } of validItems) {
      if (perItemErrors.has(idx)) continue; // already has an error

      const doc = {
        title: p.title,
        description: p.description || '',
        buyPrice: toNumber(p.buyPrice),
        sellPrice: toNumber(p.sellPrice),
        stock: toNumber(p.stock, 0),
        minStock: toNumber(p.minStock, 5),
        category: p.category,
        brand: p.brand,
        sku: p.sku,
        tags: p.tags || [],
        images: p.images || [],
        isActive: p.isActive !== undefined ? p.isActive : true,
      };

      // Auto‑generate SKU if not provided
      if (!doc.sku) {
        let candidate;
        let attempts = 0;
        const maxAttempts = 1000; // safety guard
        do {
          candidate = makeSku(skuPrefix, nextNum++);
          attempts++;
          if (attempts > maxAttempts) {
            // This should never happen, but if it does, treat as error for this item
            perItemErrors.set(idx, { error: 'Unable to generate a unique SKU' });
            break;
          }
        } while (
          batchGeneratedSkus.has(candidate) ||          // already used in this batch
          existingSkuSet.has(candidate) ||              // already exists in DB (at start)
          await Product.exists({ sku: candidate })      // (fallback) exists but added after we started
        );

        if (!perItemErrors.has(idx)) {
          doc.sku = candidate;
          batchGeneratedSkus.add(candidate);
        }
      }

      if (!perItemErrors.has(idx)) {
        docsToInsert.push(doc);
        indexMap.push(idx);
      }
    }

    if (docsToInsert.length === 0) {
      // Nothing to insert
      const results = products.map((_, i) => ({
        index: i,
        success: false,
        ...(perItemErrors.get(i) || { error: 'Unknown error' }),
      }));
      return NextResponse.json(
        {
          success: false,
          error: 'No valid products to insert',
          createdCount: 0,
          failedCount: results.length,
          results,
        },
        { status: 400 }
      );
    }

    // ----------------------------------------------------------------------
    // 5. Perform the insert with appropriate error handling
    // ----------------------------------------------------------------------
    let insertedDocs = [];
    let bulkWriteError = null;

    try {
      insertedDocs = await Product.insertMany(docsToInsert, {
        ordered: mode === 'failfast', // true for failfast, false for partial
      });
    } catch (error) {
      if (error.name === 'BulkWriteError' && mode === 'partial') {
        // In partial mode, we want to salvage successfully inserted documents
        bulkWriteError = error;
        // The successful inserts are still in the database, but we don't have them in `insertedDocs`.
        // We need to query them back or extract from error details. Simpler: query by the SKUs we generated.
        const skusInserted = docsToInsert.map(d => d.sku);
        insertedDocs = await Product.find({ sku: { $in: skusInserted } }).lean();
      } else {
        // For failfast or unexpected errors, rethrow
        throw error;
      }
    }

    // ----------------------------------------------------------------------
    // 6. Build per‑item results
    // ----------------------------------------------------------------------
    const results = products.map((_, i) => {
      const err = perItemErrors.get(i);
      if (err) {
        return { index: i, success: false, ...err };
      }
      return { index: i, success: false, error: 'Not processed' }; // will be overwritten if inserted
    });

    // Mark successfully inserted items
    const insertedSkuToDoc = new Map(insertedDocs.map(doc => [doc.sku, doc]));
    for (let pos = 0; pos < docsToInsert.length; pos++) {
      const doc = docsToInsert[pos];
      const originalIndex = indexMap[pos];
      const insertedDoc = insertedSkuToDoc.get(doc.sku);
      if (insertedDoc) {
        results[originalIndex] = {
          index: originalIndex,
          success: true,
          product: insertedDoc,
        };
      } else {
        // This document failed insertion (e.g., duplicate key after all)
        results[originalIndex] = {
          index: originalIndex,
          success: false,
          error: 'Insert failed (possible duplicate SKU or validation error)',
        };
      }
    }

    const createdCount = results.filter(r => r.success).length;
    const failedCount = results.length - createdCount;

    const responseStatus = failedCount === 0 ? 201 : 207; // 207 Multi‑Status for partial success
    return NextResponse.json(
      {
        success: failedCount === 0,
        message:
          failedCount === 0
            ? 'All products created successfully'
            : `Bulk create completed: ${createdCount} created, ${failedCount} failed`,
        createdCount,
        failedCount,
        results,
      },
      { status: responseStatus }
    );

  } catch (error) {
    console.error('API V1 - Bulk product creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create products in bulk' },
      { status: 500 }
    );
  }
}