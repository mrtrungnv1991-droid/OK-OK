import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleSelect: (productId: string) => void;
  selectAll: (selected: boolean) => void;
  clearCart: () => void;
  selectedItems: CartItem[];
  totalItemCount: number;
  totalCount: number;
  selectedCount: number;
  selectedSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  isCheckoutConfirmOpen: boolean;
  checkoutTargetItems: CartItem[];
  openCheckoutConfirm: (items?: CartItem[]) => void;
  closeCheckoutConfirm: () => void;
  lastAddedProduct: Product | null;
  showAddedToast: boolean;
  dismissToast: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cyberpool_cart_items');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutConfirmOpen, setIsCheckoutConfirmOpen] = useState(false);
  const [checkoutTargetItems, setCheckoutTargetItems] = useState<CartItem[]>([]);
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);
  const [showAddedToast, setShowAddedToast] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cyberpool_cart_items', JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      let updated: CartItem[];
      
      const itemType = (product.productType as any) || 
        (product.category === 'streaming' || product.category === 'ai_tools' ? 'account' :
         product.category === 'gaming' ? 'key_game' :
         product.category === 'software' || product.category === 'vpn' ? 'key_app' :
         product.category === 'topup_games' ? 'topup' : 'other');

      if (existingIdx >= 0) {
        updated = prev.map((item, idx) => {
          if (idx === existingIdx) {
            return {
              ...item,
              quantity: item.quantity + quantity,
              selected: true
            };
          }
          return item;
        });
      } else {
        const newItem: CartItem = {
          id: `cart-${product.id}-${Date.now()}`,
          product,
          quantity,
          selected: true,
          itemType,
          addedAt: new Date().toISOString()
        };
        updated = [newItem, ...prev];
      }

      return updated;
    });

    setLastAddedProduct(product);
    setShowAddedToast(true);
    setTimeout(() => {
      setShowAddedToast(false);
    }, 3500);
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(item.product.stockAvailable || 99, quantity) }
          : item
      )
    );
  };

  const toggleSelect = (productId: string) => {
    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  const selectAll = (selected: boolean) => {
    setCartItems(prev =>
      prev.map(item => ({ ...item, selected }))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const selectedItems = useMemo(() => {
    return cartItems.filter(item => item.selected);
  }, [cartItems]);

  const totalItemCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const selectedCount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedItems]);

  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (item.product.retailPrice * item.quantity), 0);
  }, [selectedItems]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const openCheckoutConfirm = (items?: CartItem[]) => {
    const targets = items && items.length > 0 ? items : selectedItems;
    if (targets.length === 0) return;
    setCheckoutTargetItems(targets);
    setIsCartOpen(false);
    setIsCheckoutConfirmOpen(true);
  };

  const closeCheckoutConfirm = () => {
    setIsCheckoutConfirmOpen(false);
    setCheckoutTargetItems([]);
  };

  const dismissToast = () => setShowAddedToast(false);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleSelect,
        selectAll,
        clearCart,
        selectedItems,
        totalItemCount,
        totalCount: totalItemCount,
        selectedCount,
        selectedSubtotal,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        isCheckoutConfirmOpen,
        checkoutTargetItems,
        openCheckoutConfirm,
        closeCheckoutConfirm,
        lastAddedProduct,
        showAddedToast,
        dismissToast
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
