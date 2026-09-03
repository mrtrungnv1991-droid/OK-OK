import { Router } from 'express';
import { db } from '../../../db/store';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { InventoryService } from '../../../services/inventoryService';
import { TranslationService } from '../../../services/translationService';

export const productRouter = Router();

// POST /api/v1/products/auto-translate - Real-time language detection & translation
productRouter.post('/auto-translate', async (req, res) => {
  try {
    const { title, subtitle, description, deliveryEstimate, features, instructions, tags, originalLanguage } = req.body;
    if (!title && !description) {
      return res.status(400).json({ success: false, error: 'Title or description required' });
    }

    const result = await TranslationService.translateProduct({
      title: title || '',
      subtitle: subtitle || '',
      description: description || '',
      deliveryEstimate: deliveryEstimate || '',
      features: features || [],
      instructions: instructions || [],
      tags: tags || [],
      originalLanguage
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Translation failed'
    });
  }
});

// GET /api/v1/products - Search & Filtering
productRouter.get('/', (req, res) => {
  const { category, platform, search, sort, limit = 50, offset = 0 } = req.query;

  let results = [...db.products];

  if (category && category !== 'all') {
    results = results.filter(p => p.category === category);
  }

  if (platform && platform !== 'all') {
    results = results.filter(p => p.platform.toLowerCase() === String(platform).toLowerCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    results = results.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.subtitle?.toLowerCase().includes(q) ||
      p.platform.toLowerCase().includes(q)
    );
  }

  if (sort === 'price_low') {
    results.sort((a, b) => a.retailPrice - b.retailPrice);
  } else if (sort === 'price_high') {
    results.sort((a, b) => b.retailPrice - a.retailPrice);
  } else if (sort === 'rating') {
    results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === 'discount') {
    results.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
  }

  const paginated = results.slice(Number(offset), Number(offset) + Number(limit));

  res.json({
    success: true,
    total: results.length,
    products: paginated,
    categories: db.categories
  });
});

// GET /api/v1/products/:id/translations
productRouter.get('/:id/translations', (req, res) => {
  const productId = req.params.id;
  const translations: any[] = [];
  db.productTranslations.forEach((val, key) => {
    if (val.productId === productId) {
      translations.push(val);
    }
  });

  const product = db.products.find(p => p.id === productId);

  res.json({
    success: true,
    productId,
    originalLanguage: product?.original_language || 'vi',
    titleOriginal: product?.title_original || product?.title,
    descriptionOriginal: product?.description_original || product?.description,
    translations
  });
});

// POST /api/v1/products/:id/translate - Trigger re-translation
productRouter.post('/:id/translate', async (req, res) => {
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  try {
    const translations = await TranslationService.generateAndStoreProductTranslations(product.id, {
      title: product.title_original || product.title,
      subtitle: product.subtitle,
      description: product.description_original || product.description,
      deliveryEstimate: product.deliveryEstimate,
      features: product.features,
      instructions: product.instructions,
      tags: product.tags,
      originalLanguage: product.original_language
    });

    res.json({
      success: true,
      message: 'Product translations generated successfully',
      translations
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to generate translations' });
  }
});

// GET /api/v1/products/:id
productRouter.get('/:id', (req, res) => {
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const reviews = db.reviews.filter(r => r.productId === product.id);
  res.json({
    success: true,
    product: {
      ...product,
      reviews
    }
  });
});

// POST /api/v1/products - Create Product (Admin/Seller) with Automatic Translation
productRouter.post('/', async (req, res) => {
  const body = req.body;
  const productId = body.id || `prod-${Date.now()}`;

  // Preserve immutable original fields
  const titleOriginal = body.title_original || body.title || 'Sản phẩm mới';
  const descOriginal = body.description_original || body.description || '';
  const detectedLang = body.original_language || TranslationService.detectLanguage(`${titleOriginal} ${descOriginal}`);

  const newProduct: any = {
    ...body,
    id: productId,
    title: titleOriginal,
    description: descOriginal,
    title_original: titleOriginal,
    description_original: descOriginal,
    original_language: detectedLang,
    stockAvailable: body.stockAvailable ?? 10,
    rating: body.rating || 5.0,
    reviewCount: body.reviewCount || 1,
    activePools: body.activePools || []
  };

  // Generate translations asynchronously or synchronously
  try {
    const translations = await TranslationService.generateAndStoreProductTranslations(productId, {
      title: titleOriginal,
      subtitle: body.subtitle,
      description: descOriginal,
      deliveryEstimate: body.deliveryEstimate,
      features: body.features,
      instructions: body.instructions,
      tags: body.tags,
      originalLanguage: detectedLang
    });
    newProduct.translations = translations;
  } catch (e) {
    console.warn('Auto translation during product creation failed, will retry later:', e);
  }

  db.products.unshift(newProduct);

  res.status(201).json({
    success: true,
    product: newProduct
  });
});

// PUT /api/v1/products/:id - Update Product
productRouter.put('/:id', async (req, res) => {
  const productId = req.params.id;
  const index = db.products.findIndex(p => p.id === productId);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const existing = db.products[index];
  const body = req.body;

  const titleChanged = body.title && body.title !== existing.title_original && body.title !== existing.title;
  const descChanged = body.description && body.description !== existing.description_original && body.description !== existing.description;

  const updated: any = {
    ...existing,
    ...body,
    id: productId
  };

  if (titleChanged || descChanged) {
    const newTitleOriginal = body.title || existing.title_original || existing.title;
    const newDescOriginal = body.description || existing.description_original || existing.description;
    const detectedLang = TranslationService.detectLanguage(`${newTitleOriginal} ${newDescOriginal}`);

    updated.title_original = newTitleOriginal;
    updated.description_original = newDescOriginal;
    updated.original_language = detectedLang;

    // Trigger re-translation
    try {
      const translations = await TranslationService.generateAndStoreProductTranslations(productId, {
        title: newTitleOriginal,
        subtitle: updated.subtitle,
        description: newDescOriginal,
        deliveryEstimate: updated.deliveryEstimate,
        features: updated.features,
        instructions: updated.instructions,
        tags: updated.tags,
        originalLanguage: detectedLang
      });
      updated.translations = translations;
    } catch (e) {
      console.warn('Re-translation failed:', e);
    }
  }

  db.products[index] = updated;

  res.json({
    success: true,
    product: updated
  });
});

// DELETE /api/v1/products/:id
productRouter.delete('/:id', (req, res) => {
  const productId = req.params.id;
  const index = db.products.findIndex(p => p.id === productId);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  db.products.splice(index, 1);

  // Clean up product translations
  const keysToDelete: string[] = [];
  db.productTranslations.forEach((val, key) => {
    if (val.productId === productId) keysToDelete.push(key);
  });
  keysToDelete.forEach(k => db.productTranslations.delete(k));

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// PUT /api/v1/products/:id/bulk-stock - Bulk Add Keys to Vault
productRouter.put('/:id/bulk-stock', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
  const { keys, costPrice } = req.body;
  if (!Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({ success: false, error: 'Keys array is required' });
  }

  const added = InventoryService.bulkAddKeys(req.params.id, keys, costPrice || 0);

  res.json({
    success: true,
    message: `Đã nhập kho an toàn ${added} key vào Vault`,
    addedCount: added
  });
});

