// ==============================================================================
// CYBERPOOL: SCANNER PROFILES & SELECTOR EXTRACTION STRATEGIES
// ==============================================================================
import { ScannerProfileConfig } from './types';

export const BUILT_IN_SCANNER_PROFILES: Record<string, ScannerProfileConfig> = {
  MUAKey_STANDARD: {
    profileId: 'MUAKey_STANDARD',
    name: 'Muakey.com Official Grid Profile',
    domainPattern: 'muakey.com',
    loginUrl: 'https://muakey.com/login',
    categoryListUrl: 'https://muakey.com/danh-muc',
    categorySelector: '.category-item a, nav.categories a',
    categoryNameSelector: '.cat-name, span',
    paginationStrategy: 'PAGE',
    maxPagesSafetyLimit: 50,
    nextPageSelector: 'a.pagination-next, ul.pagination li:last-child a',
    productCardSelector: '.product-card, .item-product, div[data-product-id]',
    productIdExtractor: {
      attribute: 'data-product-id',
      regex: 'sp-([0-9a-zA-Z_-]+)'
    },
    titleSelector: '.product-title, h3.title, .product-name a',
    priceSelector: '.current-price, .price-final, span[data-price]',
    stockSelector: '.stock-status, .badge-stock, span[data-stock]',
    statusSelector: '.badge-status, .availability',
    detailUrlSelector: 'a.product-link, a[href*="/san-pham/"]',
    fallbackSelectors: {
      price: ['.price', '.amount', 'meta[property="product:price:amount"]', '.text-danger'],
      stock: ['.quantity-left', '.stock', 'span.inventory'],
      title: ['h1.title', '.name', 'meta[property="og:title"]']
    },
    jsonLdEnabled: true,
    politenessDelayMs: 650
  },

  GENERIC_ECOMMERCE_GRID: {
    profileId: 'GENERIC_ECOMMERCE_GRID',
    name: 'Generic E-Commerce Standard Page Grid',
    domainPattern: '*',
    loginUrl: '/auth/login',
    categoryListUrl: '/categories',
    categorySelector: '.nav-category a, .category-list a',
    categoryNameSelector: 'span, p',
    paginationStrategy: 'PAGE',
    maxPagesSafetyLimit: 30,
    nextPageSelector: '.pagination-next, a[rel="next"]',
    productCardSelector: '.product-item, .card-product, article.product',
    productIdExtractor: {
      attribute: 'data-id',
      regex: '([0-9]+)'
    },
    titleSelector: '.product-title, h2, h3',
    priceSelector: '.price, .product-price',
    stockSelector: '.stock, .in-stock',
    statusSelector: '.status-badge',
    detailUrlSelector: 'a',
    fallbackSelectors: {
      price: ['[data-price]', '.final-price', '.amount'],
      stock: ['[data-stock]', '.inventory-count'],
      title: ['a.title', 'span.product-name']
    },
    jsonLdEnabled: true,
    politenessDelayMs: 800
  },

  SITE_B_DYNAMIC_LOAD_MORE: {
    profileId: 'SITE_B_DYNAMIC_LOAD_MORE',
    name: 'Dynamic Load More / Infinite Scroll Shop Profile',
    domainPattern: 'divineshop.vn',
    loginUrl: 'https://divineshop.vn/login',
    categoryListUrl: 'https://divineshop.vn/category',
    categorySelector: '.list-categories a',
    categoryNameSelector: 'span',
    paginationStrategy: 'LOAD_MORE',
    maxPagesSafetyLimit: 40,
    loadMoreSelector: 'button.btn-load-more, button[data-action="load-more"]',
    productCardSelector: '.product-card, .col-product',
    productIdExtractor: {
      attribute: 'data-product-sku',
      regex: 'sku-([a-zA-Z0-9]+)'
    },
    titleSelector: '.product-name, .text-truncate-2',
    priceSelector: '.product-price, .text-primary.font-bold',
    stockSelector: '.product-stock-tag',
    statusSelector: '.product-badge',
    detailUrlSelector: 'a',
    fallbackSelectors: {
      price: ['.price-box .price', '[itemprop="price"]'],
      stock: ['.stock-label'],
      title: ['.product-info h3']
    },
    jsonLdEnabled: true,
    politenessDelayMs: 900
  }
};

export function getScannerProfile(profileId: string): ScannerProfileConfig {
  return BUILT_IN_SCANNER_PROFILES[profileId] || BUILT_IN_SCANNER_PROFILES.GENERIC_ECOMMERCE_GRID;
}
