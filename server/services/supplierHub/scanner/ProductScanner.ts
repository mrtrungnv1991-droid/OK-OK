import { HttpSessionClient, HttpResponse } from '../core/HttpSessionClient';
import { ProviderAdapterConfig } from '../core/ProviderAdapterConfig';
import { NormalizedCategory, NormalizedProduct } from '../types';

export interface ScanProgressCallback {
  (progress: {
    page: number;
    itemsInPage: number;
    totalScanned: number;
    totalDiscovered: number;
  }): void;
}

export class ProductScanner {
  private client: HttpSessionClient;
  private baseUrl: string;
  private adapterConfig: ProviderAdapterConfig;
  private apiKey?: string;
  private authHeaders?: Record<string, string>;

  constructor(
    client: HttpSessionClient,
    baseUrl: string,
    adapterConfig: ProviderAdapterConfig,
    apiKey?: string,
    authHeaders?: Record<string, string>
  ) {
    this.client = client;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.adapterConfig = adapterConfig;
    this.apiKey = apiKey;
    this.authHeaders = authHeaders;
  }

  public setAuth(apiKey?: string, authHeaders?: Record<string, string>) {
    if (apiKey) this.apiKey = apiKey;
    if (authHeaders) this.authHeaders = authHeaders;
  }

  /**
   * Prepares the final URL and HTTP headers with credentials
   */
  private prepareRequest(targetUrl: string): { url: string; headers: Record<string, string> } {
    let finalUrl = targetUrl;
    const headers: Record<string, string> = { ...(this.authHeaders || {}) };

    const effectiveApiKey = this.apiKey || '';

    if (effectiveApiKey) {
      const authMethod = this.adapterConfig.authMethod;
      const isQueryParam = authMethod === 'QUERY_PARAM' || 
        this.baseUrl.includes('g2up') || 
        this.baseUrl.includes('cmsnt') ||
        finalUrl.includes('api_key=') ||
        finalUrl.includes('products.php');

      if (isQueryParam) {
        const qParam = this.adapterConfig.authQueryParamName || 'api_key';
        if (!finalUrl.includes(`${qParam}=`)) {
          finalUrl += `${finalUrl.includes('?') ? '&' : '?'}${qParam}=${encodeURIComponent(effectiveApiKey)}`;
        }
      } else if (authMethod === 'API_KEY_HEADER') {
        const headerName = this.adapterConfig.authHeaderName || 'X-API-Key';
        headers[headerName] = effectiveApiKey;
      } else if (authMethod === 'BEARER_TOKEN') {
        const prefix = this.adapterConfig.authHeaderPrefix || 'Bearer ';
        headers['Authorization'] = `${prefix}${effectiveApiKey}`.trim();
      }
    }

    return { url: finalUrl, headers };
  }

  /**
   * Scans categories from source website/API
   */
  public async scanCategories(): Promise<NormalizedCategory[]> {
    const ep = this.adapterConfig.endpoints.categories;
    if (!ep || !ep.path) {
      return [{ id: 'default', name: 'Mặc Định / General' }];
    }

    const rawUrl = `${this.baseUrl}${ep.path.startsWith('/') ? '' : '/'}${ep.path}`;
    const { url, headers } = this.prepareRequest(rawUrl);
    try {
      const res = await this.client.get(url, { headers, timeoutMs: 15000 });
      if (res.status >= 400) {
        return [{ id: 'default', name: 'Mặc Định / General' }];
      }

      const categories: NormalizedCategory[] = [];

      // 1. JSON response
      if (res.isJson && res.data) {
        const rawList = Array.isArray(res.data) 
          ? res.data 
          : Array.isArray(res.data.data) 
            ? res.data.data 
            : Array.isArray(res.data.categories) 
              ? res.data.categories 
              : [];

        for (const item of rawList) {
          if (typeof item === 'string') {
            categories.push({ id: item.toLowerCase().replace(/\s+/g, '-'), name: item });
          } else if (typeof item === 'object' && item !== null) {
            const id = String(item.id || item.slug || item.category_id || item.name || Math.random());
            const name = String(item.name || item.title || item.category_name || id);
            categories.push({ id, name, rawCategory: item });
          }
        }
      }

      // 2. HTML response with cheerio
      if (categories.length === 0 && res.$) {
        const $ = res.$;
        // Look for navigation categories or category select
        $('nav a, .category-item, .cat-item, select[name*="cat"] option').each((_, el) => {
          const text = $(el).text().trim();
          const href = $(el).attr('href') || $(el).attr('value') || '';
          if (text && text.length > 2 && text.length < 50 && !['trang chủ', 'home', 'liên hệ', 'contact'].includes(text.toLowerCase())) {
            const slug = href.split('/').filter(Boolean).pop() || text.toLowerCase().replace(/\s+/g, '-');
            if (!categories.some(c => c.name.toLowerCase() === text.toLowerCase())) {
              categories.push({ id: slug, name: text });
            }
          }
        });
      }

      if (categories.length === 0) {
        categories.push({ id: 'all-catalog', name: 'Toàn Bộ Sản Phẩm Nguồn' });
      }

      return categories;
    } catch (err) {
      console.warn('[ProductScanner] Error scanning categories:', err);
      return [{ id: 'default', name: 'Mặc Định / General' }];
    }
  }

  /**
   * Scans products with real pagination loop
   */
  public async scanProducts(onProgress?: ScanProgressCallback): Promise<NormalizedProduct[]> {
    const ep = this.adapterConfig.endpoints.products;
    if (!ep || !ep.path) {
      throw new Error('Endpoint sản phẩm chưa được cấu hình trong Adapter');
    }

    const pag = this.adapterConfig.pagination;
    const maxPages = pag.maxPages || 5;
    const pageSize = pag.pageSize || 20;

    const allProducts: NormalizedProduct[] = [];
    const seenIds = new Set<string>();

    let currentPage = 1;
    let currentOffset = 0;
    let nextUrl: string | null = null;
    let hasMore = true;

    while (hasMore && currentPage <= maxPages) {
      let targetUrl = '';

      if (nextUrl) {
        targetUrl = nextUrl.startsWith('http') ? nextUrl : `${this.baseUrl}${nextUrl.startsWith('/') ? '' : '/'}${nextUrl}`;
      } else {
        const urlObj = new URL(`${this.baseUrl}${ep.path.startsWith('/') ? '' : '/'}${ep.path}`);
        
        if (pag.type === 'PAGE_LIMIT') {
          urlObj.searchParams.set(pag.pageParam || 'page', String(currentPage));
          urlObj.searchParams.set(pag.limitParam || 'limit', String(pageSize));
        } else if (pag.type === 'OFFSET_LIMIT') {
          urlObj.searchParams.set(pag.offsetParam || 'skip', String(currentOffset));
          urlObj.searchParams.set(pag.limitParam || 'limit', String(pageSize));
        } else if (pag.type === 'HTML_SELECTOR') {
          if (currentPage > 1) {
            urlObj.searchParams.set(pag.pageParam || 'page', String(currentPage));
          }
        }
        targetUrl = urlObj.toString();
      }

      const { url, headers } = this.prepareRequest(targetUrl);
      const res = await this.client.get(url, { headers, timeoutMs: 15000 });
      if (res.status >= 400) {
        break;
      }

      const pageProducts = this.extractProductsFromResponse(res);
      if (pageProducts.length === 0) {
        hasMore = false;
        break;
      }

      let newItemsThisPage = 0;
      for (const p of pageProducts) {
        if (!seenIds.has(p.sourceProductId)) {
          seenIds.add(p.sourceProductId);
          allProducts.push(p);
          newItemsThisPage++;
        }
      }

      if (onProgress) {
        onProgress({
          page: currentPage,
          itemsInPage: pageProducts.length,
          totalScanned: allProducts.length,
          totalDiscovered: allProducts.length
        });
      }

      // Check next page criteria
      if (pag.type === 'NONE' || newItemsThisPage === 0 || pageProducts.length < pageSize) {
        hasMore = false;
      } else if (pag.type === 'PAGE_LIMIT') {
        currentPage++;
      } else if (pag.type === 'OFFSET_LIMIT') {
        currentOffset += pageSize;
        currentPage++;
      } else if (pag.type === 'NEXT_URL' && pag.nextUrlJsonPath && res.isJson) {
        nextUrl = this.getNestedValue(res.data, pag.nextUrlJsonPath);
        hasMore = Boolean(nextUrl);
        currentPage++;
      } else if (pag.type === 'HTML_SELECTOR' && res.$) {
        const nextLink = res.$(pag.nextPageSelector || 'a.next, .pagination .next a').attr('href');
        if (nextLink) {
          nextUrl = nextLink;
          currentPage++;
        } else {
          hasMore = false;
        }
      } else {
        currentPage++;
      }
    }

    return allProducts;
  }

  /**
   * Helper to extract normalized products from JSON or HTML response
   */
  private extractProductsFromResponse(res: HttpResponse): NormalizedProduct[] {
    const mapping = this.adapterConfig.fieldMapping;
    const products: NormalizedProduct[] = [];

    // 1. JSON Extraction
    if (res.isJson && res.data) {
      let rawList: any[] = [];
      if (mapping.itemsPath) {
        const listCandidate = this.getNestedValue(res.data, mapping.itemsPath);
        if (Array.isArray(listCandidate)) rawList = listCandidate;
      } else if (Array.isArray(res.data)) {
        rawList = res.data;
      } else if (Array.isArray(res.data.products)) {
        rawList = res.data.products;
      } else if (Array.isArray(res.data.data)) {
        rawList = res.data.data;
      } else if (Array.isArray(res.data.items)) {
        rawList = res.data.items;
      }

      // Support CMSNT / G2UP nested categories format: { categories: [ { id, name, icon, products: [...] } ] }
      if (rawList.length === 0 && res.data && Array.isArray(res.data.categories)) {
        for (const cat of res.data.categories) {
          if (Array.isArray(cat.products)) {
            for (const prod of cat.products) {
              rawList.push({
                ...prod,
                category: cat.name || cat.title || 'General',
                images: prod.icon || cat.icon ? [prod.icon || cat.icon] : []
              });
            }
          }
        }
      }

      for (const item of rawList) {
        if (!item || typeof item !== 'object') continue;

        const rawId = this.getNestedValue(item, mapping.idField || 'id') || item.productId || item._id;
        const title = this.getNestedValue(item, mapping.titleField || 'title') || item.name || 'Sản phẩm nguồn';
        const description = this.getNestedValue(item, mapping.descriptionField || 'description') || '';
        const category = String(this.getNestedValue(item, mapping.categoryField || 'category') || 'general');
        
        let rawPrice = this.getNestedValue(item, mapping.priceField || 'price') || 0;
        if (typeof rawPrice === 'string') {
          rawPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0;
        }

        let rawStock = this.getNestedValue(item, mapping.stockField || 'stock') ?? item.amount ?? item.stock ?? item.quantity ?? item.inventory;
        let parsedStock = 0;
        if (rawStock === false || rawStock === 0 || rawStock === '0') {
          parsedStock = 0;
        } else if (typeof rawStock === 'boolean') {
          parsedStock = rawStock ? 20 : 0;
        } else if (typeof rawStock === 'string') {
          const cleanStock = rawStock.trim().toLowerCase();
          if (cleanStock === '' || cleanStock === '0' || cleanStock.includes('hết') || cleanStock.includes('sold') || cleanStock.includes('out') || cleanStock.includes('empty')) {
            parsedStock = 0;
          } else {
            const parsedNum = parseFloat(cleanStock.replace(/[^0-9.]/g, ''));
            parsedStock = isNaN(parsedNum) ? 0 : Math.max(0, parsedNum);
          }
        } else if (typeof rawStock === 'number') {
          parsedStock = Math.max(0, rawStock);
        } else {
          // If null or undefined
          parsedStock = 0;
        }

        const rawImages = this.getNestedValue(item, mapping.imagesField || 'images') || item.images || item.icon || item.image || item.thumb;
        const images: string[] = [];
        if (Array.isArray(rawImages)) {
          for (const img of rawImages) {
            if (typeof img === 'string') images.push(img);
            else if (img?.src) images.push(img.src);
            else if (img?.url) images.push(img.url);
          }
        } else if (typeof rawImages === 'string') {
          images.push(rawImages);
        }

        if (images.length === 0) {
          images.push('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop');
        }

        if (rawId) {
          products.push({
            sourceProductId: String(rawId),
            title: String(title),
            description: String(description),
            category,
            originalPrice: Number(rawPrice) || 50000,
            originalCurrency: 'VND',
            stockAvailable: parsedStock,
            images,
            status: parsedStock > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
            metadata: { rawItem: item }
          });
        }
      }
    }

    // 2. HTML Cheerio Extraction
    if (products.length === 0 && res.$) {
      const $ = res.$;
      const itemSelector = mapping.htmlItemSelector || '.product, .product-card, .shop-item, .box-item';
      
      $(itemSelector).each((idx, el) => {
        const itemEl = $(el);
        const title = itemEl.find(mapping.htmlTitleSelector || '.product-title, h3, .name, a.title').text().trim();
        const priceText = itemEl.find(mapping.htmlPriceSelector || '.price, .amount, span.price').text().trim();
        const parsedPrice = parseFloat(priceText.replace(/[^0-9]/g, '')) || 50000;
        
        let id = itemEl.attr(mapping.htmlIdAttr || 'data-id') || itemEl.find('a').attr('href') || `scraped_${idx + 1}`;
        id = id.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);

        const imgSrc = itemEl.find(mapping.htmlImageSelector || 'img').attr('src') || '';
        const fullImg = imgSrc.startsWith('http') ? imgSrc : imgSrc ? `${this.baseUrl}${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}` : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop';

        if (title) {
          products.push({
            sourceProductId: id,
            title,
            description: title,
            category: 'scraped-catalog',
            originalPrice: parsedPrice,
            originalCurrency: 'VND',
            stockAvailable: 25,
            images: [fullImg],
            status: 'AVAILABLE',
            metadata: { scrapedAt: new Date().toISOString() }
          });
        }
      });
    }

    return products;
  }

  private getNestedValue(obj: any, pathStr: string): any {
    if (!obj || !pathStr) return obj;
    const parts = pathStr.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur === null || cur === undefined) return undefined;
      cur = cur[p];
    }
    return cur;
  }
}
