import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { 
  Product, 
  GameItem, 
  CategoryItem, 
  ProductCategory, 
  TopupTier 
} from '../types';
import { INITIAL_PRODUCTS } from '../data/mockProducts';
import { INITIAL_GAMES } from '../data/mockTopupGames';
import { INITIAL_EXTENDED_CATEGORIES } from '../data/systemExtendedData';
import { productsApi } from '../api/products';
import { useTranslation, getLocalizedProduct, getLocalizedCategory, getLocalizedGame, registerDynamicProductTranslations } from '../i18n';

interface CatalogContextType {
  products: Product[];
  rawProducts: Product[];
  games: GameItem[];
  categories: CategoryItem[];
  selectedCategory: ProductCategory;
  setSelectedCategory: (cat: ProductCategory) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: 'popular' | 'price_low' | 'price_high' | 'rating' | 'discount';
  setSortBy: (sort: 'popular' | 'price_low' | 'price_high' | 'rating' | 'discount') => void;
  selectedPlatform: string;
  setSelectedPlatform: (plat: string) => void;
  isLoading: boolean;
  fetchCatalog: () => Promise<void>;
  
  // Product actions
  addNewProduct: (newProduct: Partial<Product>) => Promise<Product | null>;
  updateProduct: (productId: string, updatedData: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  retranslateProduct: (productId: string) => Promise<boolean>;
  updateProductStock: (productId: string, newStock: number) => Promise<void>;
  adjustProductStock: (productId: string, delta: number) => Promise<void>;
  toggleFlashSale: (productId: string, discountPercent?: number, isFlashSale?: boolean, flashSaleData?: Partial<Product>) => void;
  bulkAddStock: (productId: string, rawKeys: string[]) => Promise<{ success: boolean; message: string }>;
  
  // Game actions
  updateGame: (gameId: string, updatedGame: Partial<GameItem>) => void;
  addNewGame: (newGame: Partial<GameItem>) => void;
  deleteGame: (gameId: string) => void;
  addGameTier: (gameId: string, tier: TopupTier) => void;
  updateGameTier: (gameId: string, tierId: string, updatedTier: Partial<TopupTier>) => void;
  deleteGameTier: (gameId: string, tierId: string) => void;
  bulkAdjustGamePrices: (gameId: string, percentDelta: number) => void;

  // Category actions
  addCategory: (cat: Partial<CategoryItem>) => void;
  updateCategory: (catId: string, cat: Partial<CategoryItem>) => void;
  deleteCategory: (catId: string) => void;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { locale } = useTranslation();
  const [rawProducts, setRawProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [rawGames, setRawGames] = useState<GameItem[]>(INITIAL_GAMES);
  const [rawCategories, setRawCategories] = useState<CategoryItem[]>(INITIAL_EXTENDED_CATEGORIES);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Dynamically resolve localized products, games, and categories
  const products = useMemo(() => {
    return rawProducts.map(p => getLocalizedProduct(p, locale));
  }, [rawProducts, locale]);

  const games = useMemo(() => {
    return rawGames.map(g => getLocalizedGame(g, locale));
  }, [rawGames, locale]);

  const categories = useMemo(() => {
    return rawCategories.map(c => getLocalizedCategory(c, locale));
  }, [rawCategories, locale]);

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price_low' | 'price_high' | 'rating' | 'discount'>('popular');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodRes, gameRes] = await Promise.all([
        productsApi.getProducts(),
        productsApi.getGames()
      ]);

      if (prodRes.success && prodRes.data?.products) {
        setRawProducts(prodRes.data.products);
        if (prodRes.data.categories && prodRes.data.categories.length > 0) {
          setRawCategories(prodRes.data.categories);
        }
      }

      if (gameRes.success && gameRes.data?.games) {
        setRawGames(gameRes.data.games);
      }
    } catch {
      // server sync fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // Product Actions
  const addNewProduct = async (newProduct: Partial<Product>): Promise<Product | null> => {
    const titleOriginal = newProduct.title_original || newProduct.title || 'Sản Phẩm Mới';
    const descOriginal = newProduct.description_original || newProduct.description || 'Mô tả chi tiết sản phẩm...';
    
    // Quick client-side language detection
    const viDiacritics = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]/i;
    const detectedLang = newProduct.original_language || (viDiacritics.test(`${titleOriginal} ${descOriginal}`) ? 'vi' : 'en');

    const prod: Product = {
      id: newProduct.id || `prod_${Date.now()}`,
      title: titleOriginal,
      subtitle: newProduct.subtitle || 'Bản quyền số chất lượng cao',
      title_original: titleOriginal,
      description_original: descOriginal,
      original_language: detectedLang,
      category: newProduct.category || 'ai_tools',
      bannerImg: newProduct.bannerImg || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
      platform: newProduct.platform || 'OpenAI',
      retailPrice: newProduct.retailPrice || 99000,
      groupPrice: newProduct.groupPrice || 65000,
      minSlots: newProduct.minSlots || 5,
      deliveryType: newProduct.deliveryType || 'instant_key',
      deliveryEstimate: newProduct.deliveryEstimate || 'Giao ngay lập tức (Auto Key Vault)',
      description: descOriginal,
      features: newProduct.features || ['Bản quyền chính hãng 100%', 'Bảo hành full thời hạn'],
      instructions: newProduct.instructions || ['Kiểm tra key trong Vault sau khi đặt'],
      seller: newProduct.seller || {
        id: 'seller_main',
        name: 'CyberPool Official',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        badge: 'Cyber Escrow',
        rating: 4.9,
        totalDeals: 12000,
        completedPools: 850,
        responseTime: '1-3 phút'
      },
      tags: newProduct.tags || ['Bestseller', 'Chính Hãng'],
      stockAvailable: newProduct.stockAvailable || 10,
      rating: 5.0,
      reviewCount: 1,
      activePools: newProduct.activePools || [],
      translations: newProduct.translations
    };

    // Optimistically update local state
    setRawProducts(prev => [prod, ...prev]);

    try {
      const res = await productsApi.createProduct(prod);
      if (res.success && res.data?.product) {
        const created = res.data.product;
        if (created.translations) {
          registerDynamicProductTranslations(created.id, created.translations);
        }
        setRawProducts(prev => prev.map(p => p.id === prod.id ? created : p));
        return created;
      }
    } catch {
      // Offline fallback: call auto-translate endpoint or store local
      try {
        const transRes = await productsApi.autoTranslate({
          title: prod.title_original || prod.title,
          subtitle: prod.subtitle,
          description: prod.description_original || prod.description,
          deliveryEstimate: prod.deliveryEstimate,
          features: prod.features,
          instructions: prod.instructions,
          tags: prod.tags,
          originalLanguage: detectedLang
        });
        if (transRes.success && transRes.data?.translations) {
          prod.translations = transRes.data.translations;
          registerDynamicProductTranslations(prod.id, transRes.data.translations);
          setRawProducts(prev => prev.map(p => p.id === prod.id ? { ...p, translations: transRes.data.translations } : p));
        }
      } catch (e) {
        console.warn('Auto translation fallback error:', e);
      }
    }
    return prod;
  };

  const updateProduct = async (productId: string, updatedData: Partial<Product>) => {
    setRawProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const titleChanged = updatedData.title && updatedData.title !== (p.title_original || p.title);
        const descChanged = updatedData.description && updatedData.description !== (p.description_original || p.description);
        return {
          ...p,
          ...updatedData,
          title_original: titleChanged ? updatedData.title : (p.title_original || p.title),
          description_original: descChanged ? updatedData.description : (p.description_original || p.description),
        };
      }
      return p;
    }));

    try {
      const res = await productsApi.updateProduct(productId, updatedData);
      if (res.success && res.data?.product) {
        const updated = res.data.product;
        if (updated.translations) {
          registerDynamicProductTranslations(productId, updated.translations);
        }
        setRawProducts(prev => prev.map(p => p.id === productId ? updated : p));
      }
    } catch {}
  };

  const retranslateProduct = async (productId: string): Promise<boolean> => {
    try {
      const res = await productsApi.retranslateProduct(productId);
      if (res.success && res.data?.translations) {
        registerDynamicProductTranslations(productId, res.data.translations);
        setRawProducts(prev => prev.map(p => p.id === productId ? { ...p, translations: res.data.translations } : p));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteProduct = async (productId: string) => {
    setRawProducts(prev => prev.filter(p => p.id !== productId));
    try {
      await productsApi.deleteProduct(productId);
    } catch {}
  };

  const updateProductStock = async (productId: string, newStock: number) => {
    setRawProducts(prev => prev.map(p => p.id === productId ? { ...p, stockAvailable: Math.max(0, newStock) } : p));
    try {
      await productsApi.updateProduct(productId, { stockAvailable: Math.max(0, newStock) });
    } catch {}
  };

  const adjustProductStock = async (productId: string, delta: number) => {
    setRawProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const nextStock = Math.max(0, (p.stockAvailable || 0) + delta);
        return { ...p, stockAvailable: nextStock };
      }
      return p;
    }));
  };

  const toggleFlashSale = (productId: string, discountPercent: number = 20, isFlashSale: boolean = true, flashSaleData?: Partial<Product>) => {
    setRawProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          isFlashSale,
          discountPercent: isFlashSale ? discountPercent : undefined,
          flashSaleEndsIn: isFlashSale ? '04:15:20' : undefined,
          ...flashSaleData
        };
      }
      return p;
    }));
  };

  const bulkAddStock = async (productId: string, rawKeys: string[]) => {
    const validKeys = rawKeys.filter(k => k.trim().length > 0);
    if (validKeys.length === 0) return { success: false, message: 'Danh sách key trống' };

    try {
      const res = await productsApi.bulkAddStock(productId, validKeys);
      if (res.success && res.data) {
        setRawProducts(prev => prev.map(p => {
          if (p.id === productId) {
            return { ...p, stockAvailable: (p.stockAvailable || 0) + res.data!.addedCount };
          }
          return p;
        }));
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.error || 'Lỗi nhập kho' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Lỗi mạng' };
    }
  };

  // Game actions
  const updateGame = (gameId: string, updatedGame: Partial<GameItem>) => {
    setRawGames(prev => prev.map(g => g.id === gameId ? { ...g, ...updatedGame } : g));
  };

  const addNewGame = (newGame: Partial<GameItem>) => {
    const game: GameItem = {
      id: `game_${Date.now()}`,
      name: newGame.name || 'Game Mới',
      category: newGame.category || 'Mobile',
      publisher: newGame.publisher || 'Nhà phát hành',
      banner: newGame.banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
      thumbnail: newGame.thumbnail || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&auto=format&fit=crop&q=80',
      uidLabel: newGame.uidLabel || 'Nhập UID',
      uidPlaceholder: newGame.uidPlaceholder || 'Ví dụ: 801928491',
      description: newGame.description || 'Nạp game tự động',
      tiers: newGame.tiers || []
    };
    setRawGames(prev => [game, ...prev]);
  };

  const deleteGame = (gameId: string) => {
    setRawGames(prev => prev.filter(g => g.id !== gameId));
  };

  const addGameTier = (gameId: string, tier: TopupTier) => {
    setRawGames(prev => prev.map(g => {
      if (g.id === gameId) {
        return { ...g, tiers: [...g.tiers, tier] };
      }
      return g;
    }));
  };

  const updateGameTier = (gameId: string, tierId: string, updatedTier: Partial<TopupTier>) => {
    setRawGames(prev => prev.map(g => {
      if (g.id === gameId) {
        const nextTiers = g.tiers.map(t => t.id === tierId ? { ...t, ...updatedTier } : t);
        return { ...g, tiers: nextTiers };
      }
      return g;
    }));
  };

  const deleteGameTier = (gameId: string, tierId: string) => {
    setRawGames(prev => prev.map(g => {
      if (g.id === gameId) {
        return { ...g, tiers: g.tiers.filter(t => t.id !== tierId) };
      }
      return g;
    }));
  };

  const bulkAdjustGamePrices = (gameId: string, percentDelta: number) => {
    const factor = 1 + (percentDelta / 100);
    setRawGames(prev => prev.map(g => {
      if (g.id === gameId) {
        const nextTiers = g.tiers.map(t => ({
          ...t,
          retailPrice: Math.round(t.retailPrice * factor / 1000) * 1000,
          groupPrice: t.groupPrice ? Math.round(t.groupPrice * factor / 1000) * 1000 : undefined
        }));
        return { ...g, tiers: nextTiers };
      }
      return g;
    }));
  };

  // Category actions
  const addCategory = (cat: Partial<CategoryItem>) => {
    const newCat: CategoryItem = {
      id: cat.id || `cat_${Date.now()}`,
      name: cat.name || 'Danh mục mới',
      iconName: cat.iconName || 'Zap',
      productCount: cat.productCount || 0,
      orderIndex: cat.orderIndex || 1,
      status: cat.status || 'active',
      slug: cat.slug || 'danh-muc-moi'
    };
    setRawCategories(prev => [...prev, newCat]);
  };

  const updateCategory = (catId: string, cat: Partial<CategoryItem>) => {
    setRawCategories(prev => prev.map(c => c.id === catId ? { ...c, ...cat } : c));
  };

  const deleteCategory = (catId: string) => {
    setRawCategories(prev => prev.filter(c => c.id !== catId));
  };

  return (
    <CatalogContext.Provider
      value={{
        products,
        rawProducts,
        games,
        categories,
        selectedCategory,
        setSelectedCategory,
        searchTerm,
        setSearchTerm,
        sortBy,
        setSortBy,
        selectedPlatform,
        setSelectedPlatform,
        isLoading,
        fetchCatalog,
        addNewProduct,
        updateProduct,
        deleteProduct,
        retranslateProduct,
        updateProductStock,
        adjustProductStock,
        toggleFlashSale,
        bulkAddStock,
        updateGame,
        addNewGame,
        deleteGame,
        addGameTier,
        updateGameTier,
        deleteGameTier,
        bulkAdjustGamePrices,
        addCategory,
        updateCategory,
        deleteCategory
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = (): CatalogContextType => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};
