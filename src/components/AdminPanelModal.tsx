import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Layers, 
  Users, 
  ShoppingBag, 
  Tag, 
  CreditCard, 
  MessageSquare, 
  Gamepad2, 
  LifeBuoy, 
  Server, 
  Settings, 
  Share2, 
  Gift, 
  ShieldAlert, 
  Database, 
  Clock, 
  FileText, 
  TrendingUp, 
  Lock,
  Layout,
  Bot,
  Zap,
  Cpu,
  CheckCircle2,
  DollarSign,
  Globe
} from 'lucide-react';
import { 
  Product, 
  GameItem, 
  UserOrder, 
  SupportTicket, 
  SupplierApiConfig, 
  MemberUser, 
  ChatSession, 
  CurrencyCode, 
  SystemConfiguration,
  CategoryItem,
  ManualOrder,
  VoucherCoupon,
  TopupInvoice,
  TopupTier
} from '../types';
import { useTranslation } from '../i18n';

// Modular Admin Sub-Components
import { AdminDashboardTab } from './admin/AdminDashboardTab';
import { AdminProductsTab } from './admin/AdminProductsTab';
import { AdminMembersTab } from './admin/AdminMembersTab';
import { AdminSupportHubTab } from './admin/AdminSupportHubTab';
import { AdminSuppliersTab } from './admin/AdminSuppliersTab';
import { AdminDatabaseSchemaTab } from './admin/AdminDatabaseSchemaTab';
import { AdminCategoriesTab } from './admin/AdminCategoriesTab';
import { AdminManualOrdersTab } from './admin/AdminManualOrdersTab';
import { AdminPromotionsTab } from './admin/AdminPromotionsTab';
import { AdminBankingTopupsTab } from './admin/AdminBankingTopupsTab';
import { AdminEscrowPoolsTab } from './admin/AdminEscrowPoolsTab';
import { AdminGamesTab } from './admin/AdminGamesTab';
import { AdminRolesTab } from './admin/AdminRolesTab';
import { AdminSecurityIpTab } from './admin/AdminSecurityIpTab';
import { AdminAutomationCronTab } from './admin/AdminAutomationCronTab';
import { AdminHistoryLogsTab } from './admin/AdminHistoryLogsTab';
import { AdminCTVResellerTab } from './admin/AdminCTVResellerTab';
import { AdminGiftUpExchangeTab } from './admin/AdminGiftUpExchangeTab';
import { AdminSettingsTab } from './admin/AdminSettingsTab';
import { AdminHeroLayoutTab } from './admin/AdminHeroLayoutTab';
import { AdminOrderReliabilityTab } from './admin/AdminOrderReliabilityTab';
import { AdminPaymentSystemTab } from './admin/AdminPaymentSystemTab';
import { AdminSoldOrdersTab } from './admin/AdminSoldOrdersTab';
import { AdminWithdrawalsTabContainer } from './admin/AdminWithdrawalsTabContainer';

export type AdminTabType =
  | 'dashboard'
  | 'hero_layout'
  | 'payment_system'
  | 'products'
  | 'categories'
  | 'manual_fulfillment'
  | 'vouchers'
  | 'banking'
  | 'members'
  | 'livechat'
  | 'escrow_orders'
  | 'games'
  | 'tickets'
  | 'roles'
  | 'security_ip'
  | 'automation_cron'
  | 'logs'
  | 'suppliers'
    | 'order_reliability'
        | 'affiliate'
        | 'giftup_admin'
        | 'settings'
        | 'sold_orders'
        | 'withdrawals'
        | 'database_schema';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'buyer' | 'seller_ctv' | 'admin'; // CYBERPOOL FIX: RBAC client-side
  products: Product[];
  games: GameItem[];
  orders: UserOrder[];
  tickets: SupportTicket[];
  suppliers: SupplierApiConfig[];
  members: MemberUser[];
  chatSessions: ChatSession[];
  currency: CurrencyCode;
  systemConfig: SystemConfiguration;
  onUpdateSystemConfig: (newConfig: Partial<SystemConfiguration>) => void;
  onAddNewProduct: (newProduct: Partial<Product>) => void;
  onUpdateProduct?: (productId: string, updatedData: Partial<Product>) => void;
  onDeleteProduct: (productId: string) => Promise<boolean | void> | void;
  onUpdateProductStock: (productId: string, newStock: number) => void;
  onAdjustProductStock?: (productId: string, delta: number) => void;
  onToggleFlashSale: (productId: string, discountPercent?: number, isFlashSale?: boolean, flashSaleData?: Partial<Product>) => void;
  onBulkAddStock: (productId: string, rawKeys: string[]) => void;
  onForceEscrowAction: (orderId: string, action: 'release_to_seller' | 'refund_to_buyer') => void;
  onAdminReplyTicket: (ticketId: string, replyText: string, newStatus?: SupportTicket['status']) => void;
  onUpdateSupplierBalance: (supplierId: string, deltaBalance: number) => void;
  onUpdateMemberRole: (memberId: string, newRole: MemberUser['role']) => void;
  onToggleMemberStatus: (memberId: string) => void;
  onAdjustMemberBalance: (memberId: string, amount: number, reason: string) => void;
  onAdminSendChatMessage: (sessionId: string, text: string) => void;
  onUpdateGame?: (gameId: string, updatedGame: Partial<GameItem>) => void;
  onAddNewGame?: (newGame: Partial<GameItem>) => void;
  onDeleteGame?: (gameId: string) => void;
  onAddGameTier?: (gameId: string, tier: TopupTier) => void;
  onUpdateGameTier?: (gameId: string, tierId: string, updatedTier: Partial<TopupTier>) => void;
  onDeleteGameTier?: (gameId: string, tierId: string) => void;
  onBulkAdjustGamePrices?: (gameId: string, percentDelta: number) => void;
  onResetGames?: () => void;
  categories?: CategoryItem[];
  onAddCategory?: (category: Partial<CategoryItem>) => void;
  onUpdateCategory?: (categoryId: string, category: Partial<CategoryItem>) => void;
  onDeleteCategory?: (categoryId: string) => void;
  manualOrders?: ManualOrder[];
  onProcessManualOrder?: (orderId: string, action: 'start_processing' | 'fulfill' | 'reject' | 'refund', data?: { deliveredContent?: string; note?: string; secretKey?: string; barcode?: string }) => void;
  vouchers?: VoucherCoupon[];
  onAddVoucher?: (voucher: Partial<VoucherCoupon>) => void;
  onToggleVoucherStatus?: (voucherId: string) => void;
  onDeleteVoucher?: (voucherId: string) => void;
  topupInvoices?: TopupInvoice[];
  onApproveInvoice?: (invoiceId: string) => void;
  onRejectInvoice?: (invoiceId: string, reason?: string) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  userRole = 'admin',
  products = [],
  games = [],
  orders = [],
  tickets = [],
  suppliers = [],
  members = [],
  chatSessions = [],
  currency,
  systemConfig,
  onUpdateSystemConfig,
  onAddNewProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateProductStock,
  onAdjustProductStock,
  onToggleFlashSale,
  onBulkAddStock,
  onForceEscrowAction,
  onAdminReplyTicket,
  onUpdateSupplierBalance,
  onUpdateMemberRole,
  onToggleMemberStatus,
  onAdjustMemberBalance,
  onAdminSendChatMessage,
  onUpdateGame,
  onAddNewGame,
  onDeleteGame,
  onAddGameTier,
  onUpdateGameTier,
  onDeleteGameTier,
  onBulkAdjustGamePrices,
  onResetGames,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  manualOrders,
  onProcessManualOrder,
  vouchers,
  onAddVoucher,
  onToggleVoucherStatus,
  onDeleteVoucher,
  topupInvoices,
  onApproveInvoice,
  onRejectInvoice
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AdminTabType>('dashboard');

  if (!isOpen) return null;

  // Key metrics calculations
  const totalGMV = orders.reduce((sum, o) => sum + o.pricePaid, 0) + 142850000;
  const totalEscrowLocked = orders
    .filter(o => o.status === 'escrow_locked')
    .reduce((sum, o) => sum + o.pricePaid, 0) + 38450000;
  const totalUserBalance = members.reduce((sum, m) => sum + m.walletBalance, 0);

  // CYBERPOOL RESTRUCTURE: nav sidebar grouped by function (thư mục to + nhánh con).
    // 22 tabs giữ nguyên — không bỏ chức năng nào, chỉ gom theo logic:
    // Tổng quan / Kinh doanh / Tài chính / Nguồn hàng & Tự động / Khách hàng & Hỗ trợ / Hệ thống & Bảo mật.
    interface AdminNavItem { id: AdminTabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number }
    interface AdminNavGroup { key: string; label: string; icon: React.ComponentType<{ className?: string }>; items: AdminNavItem[] }

    // CYBERPOOL FIX: RBAC client-side — map mức role tối thiểu cho từng tab.
  // Server đã chặn bằng requireRole('ADMIN'), lớp này chỉ ẩn tab không được phép
  // (tránh lộ UI + giảm nhầm lẫn). Role client: admin > seller_ctv > buyer.
  const ROLE_LEVEL: Record<string, number> = { buyer: 1, seller_ctv: 2, admin: 3 };
  const TAB_MIN_ROLE: Record<AdminTabType, number> = {
    dashboard: 2,
    hero_layout: 3,
    payment_system: 3,
    products: 2,
    categories: 2,
    manual_fulfillment: 2,
    vouchers: 3,
    banking: 3,
    members: 3,
    livechat: 2,
    escrow_orders: 2,
    games: 2,
    tickets: 2,
    roles: 3,
    security_ip: 3,
    automation_cron: 3,
    logs: 3,
    suppliers: 3,
    order_reliability: 3,
    affiliate: 3,
    giftup_admin: 3,
    settings: 3,
    sold_orders: 3,
    withdrawals: 3,
    database_schema: 3
  };
  const currentRoleLevel = ROLE_LEVEL[userRole] || 1;

  const navGroups: AdminNavGroup[] = [
      {
        key: 'overview', label: 'TỔNG QUAN', icon: TrendingUp,
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp }
        ]
      },
      {
        key: 'business', label: 'KINH DOANH', icon: ShoppingBag,
        items: [
          { id: 'products', label: 'Sản Phẩm & Sửa Giá', icon: ShoppingBag, badge: products.length },
          { id: 'categories', label: t('nav.categories'), icon: Layers, badge: categories?.length },
          { id: 'games', label: t('nav.game_topup') + ' & Bulk Giá', icon: Gamepad2, badge: `${games.length} Games` },
          { id: 'vouchers', label: 'Vouchers & Coupons', icon: Tag, badge: vouchers?.length },
          { id: 'manual_fulfillment', label: t('nav.orders') + ' (Queue)', icon: Tag, badge: manualOrders?.filter(o => o.status === 'pending_process' || o.status === 'processing').length },
          { id: 'sold_orders', label: 'Đơn Đã Bán (Tất Cả)', icon: ShoppingBag },
          { id: 'giftup_admin', label: 'GiftUp Cards', icon: Gift }
        ]
      },
      {
        key: 'finance', label: 'TÀI CHÍNH', icon: DollarSign,
        items: [
          { id: 'banking', label: t('nav.banking_topup'), icon: CreditCard, badge: topupInvoices?.filter(i => i.status === 'pending').length },
          { id: 'payment_system', label: 'Cổng Thanh Toán API', icon: DollarSign, badge: 'v1.0' },
          { id: 'escrow_orders', label: t('nav.escrow_pools'), icon: Lock, badge: orders.length },
          { id: 'withdrawals', label: 'Duyệt Rút Tiền', icon: DollarSign },
          { id: 'order_reliability', label: 'Đơn Hàng Đáng Tin & Key Vault', icon: CheckCircle2, badge: 'Anti-Dup' }
        ]
      },
      {
        key: 'supply', label: 'NGUỒN HÀNG & TỰ ĐỘNG', icon: Server,
        items: [
          { id: 'suppliers', label: 'Nhà Cung Cấp & Kết Nối Nguồn', icon: Server, badge: 'Hub' },
          { id: 'automation_cron', label: 'Cron Jobs & Auto Sync', icon: Clock },
          { id: 'hero_layout', label: 'Hero Layout & Banner', icon: Layout, badge: 'UI' }
        ]
      },
      {
        key: 'customers', label: 'KHÁCH HÀNG & HỖ TRỢ', icon: Users,
        items: [
          { id: 'members', label: t('nav.account_profile'), icon: Users, badge: members.length },
          { id: 'tickets', label: t('nav.support_hub'), icon: LifeBuoy, badge: (tickets.filter(t => t.status === 'open').length + chatSessions.length) || undefined },
          { id: 'affiliate', label: 'Đại Lý / Reseller API', icon: Share2 }
        ]
      },
      {
        key: 'system', label: 'HỆ THỐNG & BẢO MẬT', icon: ShieldCheck,
        items: [
          { id: 'roles', label: 'Roles & Sub-Admin', icon: ShieldCheck },
          { id: 'security_ip', label: 'WAF, IP & Bảo Mật', icon: ShieldAlert },
          { id: 'logs', label: 'System Logs', icon: FileText },
          { id: 'settings', label: t('nav.admin_panel') + ' Settings', icon: Settings },
          { id: 'database_schema', label: 'Database SQL Schema', icon: Database, badge: '64' }
        ]
      }
    ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-3 md:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#080d1a] border border-cyan-500/40 rounded-2xl w-full max-w-[98vw] 2xl:max-w-7xl max-h-[96vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.18)] overflow-hidden font-sans">
        {/* Admin Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider">
                  {t('nav.admin_panel')} // DISPATCH CONTROL PANEL (ADCP)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/40 font-mono font-bold">
                  MASTER SUITE v7.4.2
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {t('common.info')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Workspace Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Navigation Sidebar / Mobile Tab Bar — grouped by function */}
                    <div className="w-full md:w-56 lg:w-60 bg-slate-950/90 border-b md:border-b-0 md:border-r border-slate-800/80 p-2 md:p-2.5 flex md:flex-col overflow-x-auto md:overflow-y-auto gap-1 md:space-y-2 scrollbar-thin">
                      {navGroups.map(group => (
                                    <div key={group.key} className="md:w-full shrink-0">
                                      {/* Group header */}
                                      <div className="hidden md:flex items-center gap-1.5 px-2 pt-1 pb-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-cyan-500/70">
                                        <span className="w-1 h-3 rounded-full bg-cyan-500/50" />
                                        {group.label}
                                      </div>
                                      <div className="flex md:flex-col gap-1 md:space-y-0.5 overflow-x-auto md:overflow-visible shrink-0">
                                        {/* CYBERPOOL FIX: ẩn tab vượt quyền theo role (RBAC client-side) */}
                                        {group.items.filter(tab => (TAB_MIN_ROLE[tab.id] || 3) <= currentRoleLevel).map(tab => {
                              const Icon = tab.icon;
                              const isActive = activeTab === tab.id;

                              return (
                                <button
                                  key={tab.id}
                                  onClick={() => setActiveTab(tab.id)}
                                  className={`w-auto md:w-full shrink-0 flex items-center justify-between gap-2 px-3 py-2 md:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                    isActive
                                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 bg-slate-900/30 md:bg-transparent border border-slate-800/50 md:border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-cyan-400'}`} />
                                    <span className="truncate">{tab.label}</span>
                                  </div>

                                  {tab.badge !== undefined && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono shrink-0 ml-1 ${
                                      isActive 
                                        ? 'bg-black/20 text-black font-bold' 
                                        : 'bg-slate-900 text-cyan-400 border border-cyan-500/20'
                                    }`}>
                                      {tab.badge}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

          {/* Tab Content Display Viewport */}
          <div className="flex-1 min-w-0 p-3 sm:p-5 md:p-6 overflow-y-auto bg-[#070b14]/70">
            {activeTab === 'dashboard' && (
              <AdminDashboardTab
                products={products}
                orders={orders}
                members={members}
                currency={currency}
                totalGMV={totalGMV}
                totalEscrowLocked={totalEscrowLocked}
                totalUserBalance={totalUserBalance}
                onNavigateToTab={setActiveTab}
              />
            )}

            {activeTab === 'hero_layout' && (
              <AdminHeroLayoutTab
                systemConfig={systemConfig}
                onUpdateSystemConfig={onUpdateSystemConfig}
              />
            )}

            {activeTab === 'products' && (
              <AdminProductsTab
                products={products}
                currency={currency}
                onAddNewProduct={onAddNewProduct}
                onUpdateProduct={onUpdateProduct}
                onDeleteProduct={onDeleteProduct}
                onUpdateProductStock={onUpdateProductStock}
                onAdjustProductStock={onAdjustProductStock}
                onToggleFlashSale={onToggleFlashSale}
                onBulkAddStock={onBulkAddStock}
              />
            )}

            {activeTab === 'categories' && categories && onAddCategory && onUpdateCategory && onDeleteCategory && (
              <AdminCategoriesTab
                categories={categories}
                onAddCategory={onAddCategory}
                onUpdateCategory={onUpdateCategory}
                onDeleteCategory={onDeleteCategory}
              />
            )}

            {activeTab === 'manual_fulfillment' && (
              <AdminManualOrdersTab
                currency={currency}
                manualOrders={manualOrders}
                onProcessManualOrder={onProcessManualOrder}
              />
            )}

            {activeTab === 'vouchers' && (
              <AdminPromotionsTab
                currency={currency}
                systemConfig={systemConfig}
                onUpdateSystemConfig={onUpdateSystemConfig}
                products={products}
                onToggleFlashSale={onToggleFlashSale}
              />
            )}

            {activeTab === 'banking' && topupInvoices && onApproveInvoice && onRejectInvoice && (
              <AdminBankingTopupsTab
                invoices={topupInvoices}
                currency={currency}
                onApproveInvoice={onApproveInvoice}
                onRejectInvoice={onRejectInvoice}
              />
            )}

            {activeTab === 'members' && (
              <AdminMembersTab
                members={members}
                currency={currency}
                onUpdateMemberRole={onUpdateMemberRole}
                onToggleMemberStatus={onToggleMemberStatus}
                onAdjustMemberBalance={onAdjustMemberBalance}
              />
            )}

            {(activeTab === 'tickets' || activeTab === 'livechat') && (
              <AdminSupportHubTab
                chatSessions={chatSessions}
                tickets={tickets}
                onAdminSendChatMessage={onAdminSendChatMessage}
                onAdminReplyTicket={onAdminReplyTicket}
                defaultSubTab={activeTab === 'livechat' ? 'livechat' : 'tickets'}
              />
            )}

            {activeTab === 'escrow_orders' && (
              <AdminEscrowPoolsTab
                products={products}
                orders={orders}
                currency={currency}
                onForceEscrowAction={onForceEscrowAction}
              />
            )}

            {activeTab === 'games' && (
              <AdminGamesTab
                games={games}
                currency={currency}
                onUpdateGame={onUpdateGame}
                onAddNewGame={onAddNewGame}
                onDeleteGame={onDeleteGame}
                onAddGameTier={onAddGameTier}
                onUpdateGameTier={onUpdateGameTier}
                onDeleteGameTier={onDeleteGameTier}
                onBulkAdjustGamePrices={onBulkAdjustGamePrices}
                onResetGames={onResetGames}
              />
            )}

            {activeTab === 'roles' && (
              <AdminRolesTab currency={currency} />
            )}

            {activeTab === 'security_ip' && (
              <AdminSecurityIpTab
                systemConfig={systemConfig}
                onUpdateSystemConfig={onUpdateSystemConfig}
              />
            )}

            {activeTab === 'automation_cron' && (
              <AdminAutomationCronTab />
            )}

            {activeTab === 'logs' && (
              <AdminHistoryLogsTab currency={currency} />
            )}

            {activeTab === 'suppliers' && (
              <AdminSuppliersTab
                suppliers={suppliers}
                currency={currency}
                onUpdateSupplierBalance={onUpdateSupplierBalance}
              />
            )}

            {activeTab === 'payment_system' && (
              <AdminPaymentSystemTab currency={currency} />
            )}

            {/* CYBERPOOL FIX: tab id 'source_automation' (trùng AdminSuppliersTab) đã xóa */}

            {activeTab === 'sold_orders' && (
              <AdminSoldOrdersTab currency={currency} />
            )}

            {activeTab === 'withdrawals' && (
              <AdminWithdrawalsTabContainer currency={currency} />
            )}

            {activeTab === 'order_reliability' && (
              <AdminOrderReliabilityTab currency={currency} />
            )}

            {activeTab === 'affiliate' && (
              <AdminCTVResellerTab
                currency={currency}
              />
            )}

            {activeTab === 'giftup_admin' && (
              <AdminGiftUpExchangeTab currency={currency} />
            )}

            {activeTab === 'settings' && (
              <AdminSettingsTab
                systemConfig={systemConfig}
                onUpdateSystemConfig={onUpdateSystemConfig}
                currency={currency}
              />
            )}

            {/* CYBERPOOL FIX: tab id 'audit_security' (trùng AdminSecurityIpTab) đã xóa */}

            {activeTab === 'database_schema' && (
              <AdminDatabaseSchemaTab />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
