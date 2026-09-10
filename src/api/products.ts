import { api, ApiResponse } from './client';
import { Product, GameItem, CategoryItem, TopupTier } from '../types';

export const productsApi = {
  getProducts: async (params?: Record<string, string | number>): Promise<ApiResponse<{ products: Product[]; total: number; categories: CategoryItem[] }>> => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return api.get<{ products: Product[]; total: number; categories: CategoryItem[] }>(`/products${query}`);
  },

  getProductById: async (id: string): Promise<ApiResponse<{ product: Product }>> => {
    return api.get<{ product: Product }>(`/products/${id}`);
  },

  createProduct: async (productData: Partial<Product>): Promise<ApiResponse<{ product: Product }>> => {
    return api.post<{ product: Product }>('/products', productData);
  },

  updateProduct: async (id: string, productData: Partial<Product>): Promise<ApiResponse<{ product: Product }>> => {
    return api.put<{ product: Product }>(`/products/${id}`, productData);
  },

  deleteProduct: async (id: string): Promise<ApiResponse> => {
    return api.delete(`/products/${id}`);
  },

  bulkAddStock: async (productId: string, keys: string[], costPrice?: number): Promise<ApiResponse<{ addedCount: number; message: string }>> => {
    return api.put<{ addedCount: number; message: string }>(`/products/${productId}/bulk-stock`, { keys, costPrice });
  },

  autoTranslate: async (payload: {
    title: string;
    subtitle?: string;
    description: string;
    deliveryEstimate?: string;
    features?: string[];
    instructions?: string[];
    tags?: string[];
    originalLanguage?: string;
  }): Promise<ApiResponse<{
    detectedLanguage: string;
    original: any;
    translations: Record<string, any>;
  }>> => {
    return api.post('/products/auto-translate', payload);
  },

  getProductTranslations: async (productId: string): Promise<ApiResponse<{
    productId: string;
    originalLanguage: string;
    titleOriginal: string;
    descriptionOriginal: string;
    translations: any[];
  }>> => {
    return api.get(`/products/${productId}/translations`);
  },

  retranslateProduct: async (productId: string): Promise<ApiResponse<{
    translations: Record<string, any>;
    message: string;
  }>> => {
    return api.post(`/products/${productId}/translate`, {});
  },

  // Games Catalog
  getGames: async (): Promise<ApiResponse<{ games: GameItem[]; total: number }>> => {
    return api.get<{ games: GameItem[]; total: number }>('/games');
  },

  getGameById: async (id: string): Promise<ApiResponse<{ game: GameItem }>> => {
    return api.get<{ game: GameItem }>(`/games/${id}`);
  },

  createGame: async (gameData: Partial<GameItem>): Promise<ApiResponse<{ game: GameItem; message?: string }>> => {
    return api.post<{ game: GameItem; message?: string }>('/games', gameData);
  },

  updateGame: async (id: string, gameData: Partial<GameItem>): Promise<ApiResponse<{ game: GameItem; message?: string }>> => {
    return api.put<{ game: GameItem; message?: string }>(`/games/${id}`, gameData);
  },

  deleteGame: async (id: string): Promise<ApiResponse<{ message?: string; deletedId?: string; remaining?: number }>> => {
    return api.delete<{ message?: string; deletedId?: string; remaining?: number }>(`/games/${id}`);
  },

  addGameTier: async (gameId: string, tier: TopupTier): Promise<ApiResponse<{ message?: string; tiers: TopupTier[] }>> => {
    return api.post<{ message?: string; tiers: TopupTier[] }>(`/games/${gameId}/tiers`, { tier });
  },

  updateGameTier: async (gameId: string, tierId: string, tier: Partial<TopupTier>): Promise<ApiResponse<{ message?: string; tier: TopupTier }>> => {
    return api.put<{ message?: string; tier: TopupTier }>(`/games/${gameId}/tiers/${tierId}`, { tier });
  },

  deleteGameTier: async (gameId: string, tierId: string): Promise<ApiResponse<{ message?: string; tiers: TopupTier[] }>> => {
    return api.delete<{ message?: string; tiers: TopupTier[] }>(`/games/${gameId}/tiers/${tierId}`);
  },

  bulkAdjustGamePrices: async (gameId: string, percentDelta: number): Promise<ApiResponse<{ message?: string; games: GameItem[] }>> => {
    return api.post<{ message?: string; games: GameItem[] }>('/games/bulk-adjust', { gameId, percentDelta });
  },

  resetGamesToDefault: async (): Promise<ApiResponse<{ message?: string; games: GameItem[] }>> => {
    return api.post<{ message?: string; games: GameItem[] }>('/games/reset', {});
  },

  // ==========================================
  // CYBORG // G2UP.NET 4-STEP DIRECT PIPELINE API
  // ==========================================
  cyborgGetStatus: async (): Promise<ApiResponse<any>> => {
    return api.get('/source-connector/cyborg/status');
  },

  cyborgLogin: async (): Promise<ApiResponse<any>> => {
    return api.post('/source-connector/cyborg/login', {});
  },

  cyborgScan: async (): Promise<ApiResponse<any>> => {
    return api.post('/source-connector/cyborg/scan', {});
  },

  cyborgUpdatePricing: async (config: {
    marginPercent?: number;
    fixedFee?: number;
    roundTo?: number;
    groupDiscountPercent?: number;
  }): Promise<ApiResponse<any>> => {
    return api.post('/source-connector/cyborg/pricing-config', config);
  },

  cyborgPublishToStorefront: async (options?: {
    publishAllOrInStock?: 'all' | 'in_stock';
  }): Promise<ApiResponse<any>> => {
    return api.post('/source-connector/cyborg/publish', options || {});
  },

  cyborgRunFullPipeline: async (): Promise<ApiResponse<any>> => {
    return api.post('/source-connector/cyborg/run-full-pipeline', {});
  },

  cyborgAutoClassify: async (): Promise<ApiResponse<any>> => {
    return api.post('/source-connector/cyborg/auto-classify', {});
  },

  cyborgUpdateClassification: async (
    productId: string,
    update: {
      category?: string;
      salesType?: 'retail_only' | 'group_buy_only' | 'both';
      allowGroupBuy?: boolean;
    }
  ): Promise<ApiResponse<any>> => {
    return api.post('/source-connector/cyborg/update-classification', {
      productId,
      ...update
    });
  },

  cyborgGetSafetySettings: async (): Promise<ApiResponse<any>> => {
    return api.get('/source-connector/cyborg/safety-settings');
  },

  cyborgUpdateSafetySettings: async (liveBuyEnabled: boolean): Promise<ApiResponse<any>> => {
    return api.post('/source-connector/cyborg/safety-settings', { liveBuyEnabled });
  }
};
