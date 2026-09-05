export interface EndpointConfig {
  path: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

export interface PaginationConfig {
  type: 'PAGE_LIMIT' | 'OFFSET_LIMIT' | 'CURSOR' | 'NEXT_URL' | 'HTML_SELECTOR' | 'NONE';
  pageParam?: string; // e.g. 'page' or 'p'
  limitParam?: string; // e.g. 'limit' or 'per_page'
  offsetParam?: string; // e.g. 'skip' or 'offset'
  pageSize?: number; // default e.g. 20
  maxPages?: number; // safety cap e.g. 20
  nextUrlJsonPath?: string; // e.g. 'links.next'
  cursorJsonPath?: string; // e.g. 'next_cursor'
  nextPageSelector?: string; // CSS selector for pagination next button
}

export interface FieldMappingConfig {
  itemsPath?: string; // JSON path for list of items e.g. 'products', 'data', 'items' or ''
  idField?: string; // e.g. 'id', 'product_id', 'code'
  titleField?: string; // e.g. 'title', 'name', 'product_name'
  descriptionField?: string; // e.g. 'description', 'detail', 'desc'
  categoryField?: string; // e.g. 'category', 'cat_id', 'category_name'
  priceField?: string; // e.g. 'price', 'retail_price', 'amount'
  currencyField?: string; // e.g. 'currency', 'unit'
  stockField?: string; // e.g. 'stock', 'inventory', 'quantity'
  imagesField?: string; // e.g. 'images', 'thumbnail', 'photo'
  
  // HTML CSS Selectors for Scraper
  htmlItemSelector?: string; // e.g. '.product-card', '.item-box', 'table tr.prod-row'
  htmlIdAttr?: string; // e.g. 'data-id', 'data-product-id' or 'a[href]'
  htmlTitleSelector?: string; // e.g. '.product-title', 'h3', '.name'
  htmlPriceSelector?: string; // e.g. '.price', '.amount', '.cost'
  htmlStockSelector?: string; // e.g. '.stock', '.quantity', '.badge-stock'
  htmlImageSelector?: string; // e.g. 'img.thumb', 'img'
}

export interface ProviderAdapterConfig {
  authMethod: 'COOKIE_SESSION' | 'BEARER_TOKEN' | 'API_KEY_HEADER' | 'QUERY_PARAM' | 'BASIC' | 'NONE';
  authHeaderName?: string; // default 'Authorization' or 'X-API-Key'
  authHeaderPrefix?: string; // default 'Bearer '
  authQueryParamName?: string; // e.g. 'api_key' or 'token'

  // Endpoints
  endpoints: {
    login?: EndpointConfig;
    balance?: EndpointConfig;
    categories?: EndpointConfig;
    products?: EndpointConfig;
    productDetail?: EndpointConfig;
    createOrder?: EndpointConfig;
    orderStatus?: EndpointConfig;
  };

  pagination: PaginationConfig;
  fieldMapping: FieldMappingConfig;
}

export const PRESET_ADAPTERS: Record<string, ProviderAdapterConfig> = {
  // 1. Generic REST API
  GENERIC_REST: {
    authMethod: 'BEARER_TOKEN',
    authHeaderName: 'Authorization',
    authHeaderPrefix: 'Bearer ',
    endpoints: {
      balance: { path: '/api/user/balance', method: 'GET' },
      categories: { path: '/api/categories', method: 'GET' },
      products: { path: '/api/products', method: 'GET' },
      createOrder: { path: '/api/orders', method: 'POST' }
    },
    pagination: {
      type: 'PAGE_LIMIT',
      pageParam: 'page',
      limitParam: 'limit',
      pageSize: 20,
      maxPages: 10
    },
    fieldMapping: {
      itemsPath: 'data',
      idField: 'id',
      titleField: 'name',
      descriptionField: 'description',
      categoryField: 'category',
      priceField: 'price',
      stockField: 'stock',
      imagesField: 'images'
    }
  },

  // 2. G2UP / CMSNT Vietnamese Game Shop & Account API
  G2UP_CMSNT: {
    authMethod: 'QUERY_PARAM',
    authQueryParamName: 'api_key',
    endpoints: {
      login: { path: '/ajaxs/client/auth.php', method: 'POST' },
      balance: { path: '/api/profile.php', method: 'GET' },
      categories: { path: '/api/products.php', method: 'GET' },
      products: { path: '/api/products.php', method: 'GET' },
      productDetail: { path: '/api/product.php', method: 'GET' },
      createOrder: { path: '/api/buy_product', method: 'POST' },
      orderStatus: { path: '/api/order.php', method: 'GET' }
    },
    pagination: {
      type: 'NONE'
    },
    fieldMapping: {
      itemsPath: '',
      idField: 'id',
      titleField: 'name',
      descriptionField: 'description',
      categoryField: 'category',
      priceField: 'price',
      stockField: 'amount',
      imagesField: 'icon'
    }
  },

  // 3. ShopClone7 / WebTopup (Popular Vietnamese game/account script)
  SHOPCLONE7: {
    authMethod: 'API_KEY_HEADER',
    authHeaderName: 'Api-Token',
    endpoints: {
      balance: { path: '/api/get-balance.php', method: 'GET' },
      categories: { path: '/api/categories.php', method: 'GET' },
      products: { path: '/api/products.php', method: 'GET' },
      createOrder: { path: '/api/buy-product.php', method: 'POST' },
      orderStatus: { path: '/api/order-status.php', method: 'GET' }
    },
    pagination: {
      type: 'NONE'
    },
    fieldMapping: {
      itemsPath: 'data',
      idField: 'id',
      titleField: 'name',
      descriptionField: 'description',
      categoryField: 'category_name',
      priceField: 'price',
      stockField: 'amount',
      imagesField: 'image'
    }
  },

  // 3. WooCommerce Store API
  WOOCOMMERCE: {
    authMethod: 'BEARER_TOKEN',
    endpoints: {
      categories: { path: '/wp-json/wc/store/v1/products/categories', method: 'GET' },
      products: { path: '/wp-json/wc/store/v1/products', method: 'GET' }
    },
    pagination: {
      type: 'PAGE_LIMIT',
      pageParam: 'page',
      limitParam: 'per_page',
      pageSize: 25,
      maxPages: 10
    },
    fieldMapping: {
      itemsPath: '',
      idField: 'id',
      titleField: 'name',
      descriptionField: 'description',
      priceField: 'prices.price',
      stockField: 'is_in_stock',
      imagesField: 'images'
    }
  },

  // 4. Public Demonstration / Test Sandbox (DummyJSON - Real online e-commerce API)
  DUMMYJSON_DEMO: {
    authMethod: 'NONE',
    endpoints: {
      categories: { path: '/products/categories', method: 'GET' },
      products: { path: '/products', method: 'GET' }
    },
    pagination: {
      type: 'OFFSET_LIMIT',
      offsetParam: 'skip',
      limitParam: 'limit',
      pageSize: 30,
      maxPages: 4
    },
    fieldMapping: {
      itemsPath: 'products',
      idField: 'id',
      titleField: 'title',
      descriptionField: 'description',
      categoryField: 'category',
      priceField: 'price',
      stockField: 'stock',
      imagesField: 'images'
    }
  },

  // 5. Generic HTML Form / Account Scraper
  GENERIC_HTML_SCRAPER: {
    authMethod: 'COOKIE_SESSION',
    endpoints: {
      login: { path: '/login', method: 'POST' },
      balance: { path: '/profile', method: 'GET' },
      categories: { path: '/shop', method: 'GET' },
      products: { path: '/shop', method: 'GET' }
    },
    pagination: {
      type: 'HTML_SELECTOR',
      pageParam: 'page',
      maxPages: 5,
      nextPageSelector: 'a.next, .pagination .next a, a[rel="next"]'
    },
    fieldMapping: {
      htmlItemSelector: '.product, .product-card, .shop-item, article.product',
      htmlIdAttr: 'data-id',
      htmlTitleSelector: '.product-title, h3, .name, a.title',
      htmlPriceSelector: '.price, .amount, span.price',
      htmlStockSelector: '.stock, .badge-stock',
      htmlImageSelector: 'img'
    }
  }
};
