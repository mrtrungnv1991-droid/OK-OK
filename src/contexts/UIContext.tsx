import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, GameItem } from '../types';

export type ModalType = 
  | 'poolDetail'
  | 'instantBuy'
  | 'vault'
  | 'createPool'
  | 'wallet'
  | 'depositHub'
  | 'escrowGuide'
  | 'topup'
  | 'tickets'
  | 'sellerSupplier'
  | 'admin'
  | 'telcoCard'
  | 'luckyWheel'
  | 'orderLookup'
  | 'affiliate'
  | 'txLedger'
  | 'keyTools'
  | 'aiConfig'
  | 'homeAnnouncement'
  | 'fanMenu'
  | null;

export interface ModalPayload {
  selectedProduct?: Product | null;
  selectedGame?: GameItem | null;
  initialDepositAmount?: number;
  initialDepositMethod?: 'bank_vietqr' | 'telco_card' | 'momo' | 'crypto_usdt' | 'binance_pay' | 'binance_pay_v2';
  [key: string]: any;
}

export interface ToastOptions {
  title?: string;
  duration?: number;
  dedupeKey?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastInfo {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  dedupeKey?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt?: number;
}

interface UIContextType {
  activeModal: ModalType;
  modalPayload: ModalPayload;
  openModal: (modal: ModalType, payload?: ModalPayload) => void;
  closeModal: () => void;
  isModalOpen: (modal: ModalType) => boolean;
  toasts: ToastInfo[];
  showToast: (message: string, type?: ToastInfo['type'], options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<ToastInfo>) => void;
  clearAllToasts: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalPayload, setModalPayload] = useState<ModalPayload>({});
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Ref to track timers for automatic cleanup
  const timerMapRef = React.useRef<Map<string, NodeJS.Timeout>>(new Map());
  // Ref to track recently dispatched dedupe keys to prevent spam
  const recentDedupeRef = React.useRef<Map<string, number>>(new Map());

  const openModal = (modal: ModalType, payload: ModalPayload = {}) => {
    setActiveModal(modal);
    setModalPayload(payload);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalPayload({});
  };

  const isModalOpen = (modal: ModalType) => activeModal === modal;

  const dismissToast = React.useCallback((id: string) => {
    const existingTimer = timerMapRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      timerMapRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const removeToast = dismissToast; // Compatibility alias

  const clearAllToasts = React.useCallback(() => {
    timerMapRef.current.forEach(timer => clearTimeout(timer));
    timerMapRef.current.clear();
    setToasts([]);
  }, []);

  const updateToast = React.useCallback((id: string, updates: Partial<ToastInfo>) => {
    setToasts(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const showToast = React.useCallback((
    message: string, 
    type: ToastInfo['type'] = 'info', 
    options?: ToastOptions
  ): string => {
    const now = Date.now();
    const dedupeKey = options?.dedupeKey || `${type}:${message.trim()}`;

    // Deduplication check: if identical notification occurred in last 2.5 seconds, skip duplicate
    const lastTime = recentDedupeRef.current.get(dedupeKey);
    if (lastTime && (now - lastTime) < 2500) {
      return '';
    }
    recentDedupeRef.current.set(dedupeKey, now);

    // If an error is dispatched for a dedupeKey, dismiss any existing success toast with the same key & vice versa
    if (options?.dedupeKey) {
      setToasts(prev => prev.filter(t => t.dedupeKey !== options.dedupeKey));
    }

    const id = `toast-${now}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Auto calculate standard duration if not explicitly provided
    let duration = options?.duration;
    if (duration === undefined) {
      switch (type) {
        case 'success':
          duration = 3500;
          break;
        case 'info':
          duration = 3500;
          break;
        case 'warning':
          duration = 5000;
          break;
        case 'error':
          duration = 7000;
          break;
        default:
          duration = 3500;
      }
    }

    const newToast: ToastInfo = {
      id,
      title: options?.title,
      message,
      type,
      duration,
      dedupeKey,
      action: options?.action,
      createdAt: now
    };

    setToasts(prev => {
      // Keep maximum 4 concurrent toasts to avoid screen crowding
      const nextList = [...prev, newToast];
      if (nextList.length > 4) {
        const removed = nextList.shift();
        if (removed) {
          const t = timerMapRef.current.get(removed.id);
          if (t) {
            clearTimeout(t);
            timerMapRef.current.delete(removed.id);
          }
        }
      }
      return nextList;
    });

    if (duration > 0) {
      const timer = setTimeout(() => {
        dismissToast(id);
      }, duration);
      timerMapRef.current.set(id, timer);
    }

    return id;
  }, [dismissToast]);

  // Clean up all timers on unmount
  React.useEffect(() => {
    return () => {
      timerMapRef.current.forEach(timer => clearTimeout(timer));
      timerMapRef.current.clear();
    };
  }, []);


  return (
    <UIContext.Provider
      value={{
        activeModal,
        modalPayload,
        openModal,
        closeModal,
        isModalOpen,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
