import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  UserOrder, 
  ManualOrder, 
  SupportTicket, 
  ChatSession, 
  ChatMessage, 
  WheelPrize, 
  WheelSpinRecord, 
  Product, 
  GameItem, 
  TopupTier
} from '../types';
import { INITIAL_ORDERS } from '../data/mockProducts';
import { INITIAL_TICKETS } from '../data/mockTopupGames';
import { INITIAL_MANUAL_ORDERS } from '../data/systemExtendedData';
import { generateTxHash } from '../utils/formatters';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import { useCatalog } from './CatalogContext';
import { ordersApi } from '../api/orders';
import { escrowApi } from '../api/escrow';

interface OrdersContextType {
  orders: UserOrder[];
  manualOrders: ManualOrder[];
  tickets: SupportTicket[];
  chatSessions: ChatSession[];
  chatMessages: ChatMessage[];
  luckyWheelPrizes: WheelPrize[];
  spinRecords: WheelSpinRecord[];
  isLoading: boolean;
  fetchOrders: () => Promise<void>;
  
  // Actions
  addOrder: (order: UserOrder) => void;
  joinPool: (poolId: string, product: Product) => Promise<{ success: boolean; message: string }>;
  buyInstantSingle: (product: Product, quantity?: number) => Promise<{ success: boolean; message: string; deliveredKey?: string }>;
  createTopupOrder: (game: GameItem, tier: TopupTier, uid: string, zoneId?: string, characterName?: string, isGroup?: boolean) => Promise<{ success: boolean; message: string }>;
  forceEscrowAction: (orderId: string, action: 'release_to_seller' | 'refund_to_buyer') => void;
  createSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status' | 'messages'>, initialMessage: string) => void;
  adminReplyTicket: (ticketId: string, replyText: string, newStatus?: SupportTicket['status']) => void;
  adminSendChatMessage: (sessionId: string, text: string) => void;
  sendUserChatMessage: (text: string, orderRef?: string) => void;
  processManualOrder: (orderId: string, action: 'start_processing' | 'fulfill' | 'reject' | 'refund', data?: { deliveredContent?: string; note?: string; secretKey?: string; barcode?: string }) => void;
  spinLuckyWheel: () => { success: boolean; prize?: WheelPrize; message: string };
}

const DEFAULT_PRIZES: WheelPrize[] = [
  { id: 'p1', name: 'Key ChatGPT Plus 1 Tháng', label: 'GPT Plus 1M', type: 'key', value: 65000, deliveredCode: 'OPENAI-PLUS-9921-XKQW-8821', color: '#06b6d4', probability: 5 },
  { id: 'p2', name: '+50,000đ Tiền Vào Ví', label: '+50K Ví', type: 'wallet_cash', value: 50000, color: '#10b981', probability: 20 },
  { id: 'p3', name: 'Voucher Giảm 30% Mua Chung', label: 'Voucher 30%', type: 'voucher', value: 30, deliveredCode: 'VOUCHER-LUCKY-30', color: '#8b5cf6', probability: 25 },
  { id: 'p4', name: '100 Kim Cương Free Fire', label: '100 KC FF', type: 'game_diamonds', value: 20000, deliveredCode: 'GARENA-FF-100-DIAMONDS', color: '#f59e0b', probability: 15 },
  { id: 'p5', name: 'Thẻ Quà GiftUp 100K', label: 'GiftUp 100K', type: 'giftup_card', value: 100000, deliveredCode: 'GIFTUP-100K-PREMIUM-CARD', color: '#ec4899', probability: 5 },
  { id: 'p6', name: 'Chúc Bạn May Mắn Lần Sau', label: 'May Mắn Lần Sau', type: 'bad_luck', value: 0, color: '#64748b', probability: 30 }
];

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, refreshUserProfile } = useAuth();
  const { addTransaction, fetchWalletData } = useWallet();
  const { updateProduct } = useCatalog();

  const [orders, setOrders] = useState<UserOrder[]>(() => {
    try {
      const saved = localStorage.getItem('cyberpool_orders_history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return INITIAL_ORDERS;
  });
  const [manualOrders, setManualOrders] = useState<ManualOrder[]>(INITIAL_MANUAL_ORDERS);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cyberpool_orders_history', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: 'sess-1',
      userId: 'usr-buyer-01',
      userName: 'CyberBuyer_Vn (Bạn)',
      userAvatar: '',
      lastMessage: 'Đơn nạp VietQR đã được cộng tiền vào ví chưa admin?',
      unreadCount: 0,
      updatedAt: '15:35',
      status: 'active',
      messages: [
        {
          id: 'msg-1',
          sender: 'agent',
          senderName: 'CSKH CyberPool',
          text: 'Chào bạn! Hệ thống VietQR tự động khớp lệnh trong 3-10 giây.',
          timestamp: '15:36'
        }
      ]
    }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'cm-1',
      sender: 'agent',
      senderName: 'CSKH CyberPool 24/7',
      text: 'Xin chào! CyberPool có thể hỗ trợ gì cho phiên giao dịch của bạn hôm nay?',
      timestamp: '15:30'
    }
  ]);

  const [luckyWheelPrizes] = useState<WheelPrize[]>(DEFAULT_PRIZES);
  const [spinRecords, setSpinRecords] = useState<WheelSpinRecord[]>([]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ordersApi.getUserOrders();
      if (res.success && res.data?.orders) {
        if (res.data.orders.length > 0) {
          setOrders(prev => {
            const combined = [...res.data!.orders];
            prev.forEach(localOrd => {
              if (!combined.some(c => c.id === localOrd.id || (c.txId && c.txId === localOrd.txId))) {
                combined.unshift(localOrd);
              }
            });
            return combined;
          });
        }
      }
    } catch {
      // server sync fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 0. Append Order Directly
  const addOrder = (order: UserOrder) => {
    setOrders(prev => {
      const updated = [order, ...prev];
      try {
        localStorage.setItem('cyberpool_orders_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // 1. Instant Buy (Single Key) via Atomic Server Route
  const buyInstantSingle = async (product: Product, quantity: number = 1): Promise<{ success: boolean; message: string; deliveredKey?: string }> => {
    try {
      const res = await ordersApi.instantBuy({ productId: product.id });
      if (res.success && res.data) {
        const deliveredOrder = res.data.order;
        setOrders(prev => [deliveredOrder, ...prev]);

        addTransaction({
          type: 'buy_instant',
          description: `Mua lẻ: ${product.title}`,
          amount: -deliveredOrder.pricePaid,
          balanceAfter: Math.max(0, currentUser.walletBalance - deliveredOrder.pricePaid),
          status: 'completed',
          txCode: `ORD-${deliveredOrder.id.slice(-6).toUpperCase()}`
        });

        // Reduce local visual stock
        updateProduct(product.id, {
          stockAvailable: Math.max(0, (product.stockAvailable || 10) - 1)
        });

        await Promise.all([refreshUserProfile(), fetchWalletData()]);

        return {
          success: true,
          message: res.data.message || 'Thanh toán thành công! Key đã được đưa vào Vault của bạn.',
          deliveredKey: res.data.deliveredKey
        };
      }

      return {
        success: false,
        message: res.error || 'Số dư không đủ hoặc đã hết key trong kho Vault.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Lỗi mạng khi giao tiếp với hệ thống đơn hàng.'
      };
    }
  };

  // 2. Join Escrow Group Pool
  const joinPool = async (poolId: string, product: Product): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await escrowApi.joinPool({ poolId, productId: product.id });
      if (res.success && res.data) {
        const pool = res.data.pool;

        // Create order record in history
        const orderId = `ord_pool_${Date.now()}`;
        const newOrder: UserOrder = {
          id: orderId,
          productId: product.id,
          productTitle: product.title,
          platform: product.platform,
          type: 'group_buy',
          pricePaid: pool.pricePerSlot,
          status: pool.status === 'COMPLETED' ? 'fulfilled' : 'escrow_locked',
          poolId: pool.id,
          slotNumber: pool.filledSlots,
          deliveredKey: pool.status === 'COMPLETED' ? `CYBER-KEY-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
          txId: `TX-POOL-${pool.id.slice(-6).toUpperCase()}`,
          createdAt: new Date().toISOString()
        };

        setOrders(prev => [newOrder, ...prev]);

        addTransaction({
          type: 'buy_pool',
          description: `Gom nhóm: ${product.title} (#${pool.id})`,
          amount: -pool.pricePerSlot,
          balanceAfter: Math.max(0, currentUser.walletBalance - pool.pricePerSlot),
          status: 'completed',
          txCode: `POOL-${pool.id.slice(-6).toUpperCase()}`
        });

        await Promise.all([refreshUserProfile(), fetchWalletData()]);

        return {
          success: true,
          message: res.data.message || 'Đã vào nhóm gom đơn thành công! Tiền cọc được khóa an toàn bởi Escrow Oracle.'
        };
      }

      return {
        success: false,
        message: res.error || 'Không thể tham gia nhóm mua chung.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Lỗi mạng khi xử lý hợp đồng Escrow.'
      };
    }
  };

  // 3. Game Direct Top-Up
  const createTopupOrder = async (
    game: GameItem, 
    tier: TopupTier, 
    uid: string, 
    zoneId?: string, 
    characterName?: string, 
    isGroup?: boolean
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await ordersApi.topupGame({
        gameId: game.id,
        tierId: tier.id,
        uid,
        zoneId,
        characterName
      });

      if (res.success && res.data) {
        setOrders(prev => [res.data!.order, ...prev]);

        addTransaction({
          type: 'topup_game',
          description: `Nạp game ${game.name} - Gói ${tier.name} (UID: ${uid})`,
          amount: -tier.retailPrice,
          balanceAfter: Math.max(0, currentUser.walletBalance - tier.retailPrice),
          status: 'completed',
          txCode: `GAME-${res.data!.order.id.slice(-6).toUpperCase()}`
        });

        await Promise.all([refreshUserProfile(), fetchWalletData()]);

        return {
          success: true,
          message: res.data.message || 'Đơn nạp game đã được gửi tới cổng API Nhà Cung Cấp thành công!'
        };
      }

      return {
        success: false,
        message: res.error || 'Nạp game thất bại.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Lỗi mạng khi gọi cổng nạp game.'
      };
    }
  };

  const forceEscrowAction = (orderId: string, action: 'release_to_seller' | 'refund_to_buyer') => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: action === 'release_to_seller' ? 'fulfilled' : 'refunded',
          deliveredKey: action === 'release_to_seller' ? (o.deliveredKey || 'CYBER-FORCE-RELEASE-KEY') : undefined
        };
      }
      return o;
    }));
  };

  const createSupportTicket = (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'status' | 'messages'>, initialMessage: string) => {
    const newT: SupportTicket = {
      ...ticket,
      id: `TIC-${Date.now().toString().slice(-4)}`,
      createdAt: 'Vừa xong',
      status: 'open',
      messages: [
        {
          id: 'm1',
          sender: 'user',
          text: initialMessage,
          timestamp: 'Vừa xong'
        }
      ]
    };
    setTickets(prev => [newT, ...prev]);
  };

  const adminReplyTicket = (ticketId: string, replyText: string, newStatus?: SupportTicket['status']) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: newStatus || 'investigating',
          messages: [
            ...t.messages,
            {
              id: `m-${Date.now()}`,
              sender: 'agent',
              text: replyText,
              timestamp: 'Vừa xong'
            }
          ]
        };
      }
      return t;
    }));
  };

  const adminSendChatMessage = (sessionId: string, text: string) => {
    setChatSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          lastMessage: text,
          updatedAt: 'Vừa xong',
          messages: [
            ...s.messages,
            {
              id: `msg-${Date.now()}`,
              sender: 'agent',
              senderName: 'CSKH CyberPool',
              text,
              timestamp: 'Vừa xong'
            }
          ]
        };
      }
      return s;
    }));
  };

  const sendUserChatMessage = (text: string, orderRef?: string) => {
    const newMsg: ChatMessage = {
      id: `cm-${Date.now()}`,
      sender: 'user',
      senderName: currentUser.name,
      text,
      timestamp: 'Vừa xong',
      orderRef
    };
    setChatMessages(prev => [...prev, newMsg]);
  };

  const processManualOrder = (orderId: string, action: 'start_processing' | 'fulfill' | 'reject' | 'refund', data?: { deliveredContent?: string; note?: string; secretKey?: string; barcode?: string }) => {
    setManualOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        let nextStatus: ManualOrder['status'] = o.status;
        if (action === 'start_processing') nextStatus = 'processing';
        if (action === 'fulfill') nextStatus = 'completed';
        if (action === 'reject') nextStatus = 'pending_process';
        if (action === 'refund') nextStatus = 'refunded';

        return {
          ...o,
          status: nextStatus,
          deliveredContent: data?.deliveredContent || o.deliveredContent,
          adminNote: data?.note || o.adminNote
        };
      }
      return o;
    }));
  };

  const spinLuckyWheel = (): { success: boolean; prize?: WheelPrize; message: string } => {
    const randomIdx = Math.floor(Math.random() * luckyWheelPrizes.length);
    const prize = luckyWheelPrizes[randomIdx];

    const spinRec: WheelSpinRecord = {
      id: `spin-${Date.now()}`,
      user: currentUser.name,
      prizeName: prize.name,
      prizeType: prize.type,
      value: prize.value,
      timestamp: 'Vừa xong',
      txId: `SPIN-${Math.floor(1000 + Math.random() * 9000)}`
    };

    setSpinRecords(prev => [spinRec, ...prev]);

    return {
      success: true,
      prize,
      message: `Chúc mừng bạn đã trúng: ${prize.name}`
    };
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        manualOrders,
        tickets,
        chatSessions,
        chatMessages,
        luckyWheelPrizes,
        spinRecords,
        isLoading,
        fetchOrders,
        addOrder,
        joinPool,
        buyInstantSingle,
        createTopupOrder,
        forceEscrowAction,
        createSupportTicket,
        adminReplyTicket,
        adminSendChatMessage,
        sendUserChatMessage,
        processManualOrder,
        spinLuckyWheel
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = (): OrdersContextType => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};
