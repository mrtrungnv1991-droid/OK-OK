import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Copy, 
  Check, 
  Calendar, 
  User, 
  Eye, 
  Tag, 
  Sparkles, 
  Gamepad2, 
  Gift, 
  Zap,
  Cpu
} from 'lucide-react';
import { Currency } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface SoldOrderItem {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  productTitle: string;
  productType: 'account' | 'key_game' | 'gift_card' | 'topup_manual' | 'escrow_pool';
  fulfillmentType: 'automatic' | 'manual';
  price: number;
  deliveredData: string;
  paymentMethod: 'balance' | 'vietqr' | 'card' | 'usdt';
  soldAt: string;
  status: 'delivered' | 'warranty_active' | 'refunded';
}

const INITIAL_SOLD_ORDERS: SoldOrderItem[] = [
  {
    id: 'SOLD-8821',
    orderCode: 'ORD-ACC-992144',
    customerName: 'CyberBuyer_Vn',
    customerEmail: 'cyberbuyer@gmail.com',
    productTitle: 'ChatGPT Plus 1 Tháng (Tài Khoản Riêng Tư)',
    productType: 'account',
    fulfillmentType: 'automatic',
    price: 490000,
    deliveredData: 'openai_plus_user88@cyberescrow.io | Pass: Cyber2026!Sec | Token: sk-proj-99214a88c',
    paymentMethod: 'balance',
    soldAt: '10:48:00 - 21/08/2026',
    status: 'warranty_active'
  },
  {
    id: 'SOLD-8820',
    orderCode: 'ORD-GIFT-661294',
    customerName: 'SellerKing_AI',
    customerEmail: 'sellerking.agency@gmail.com',
    productTitle: 'Apple iTunes Gift Card $50 (US Store)',
    productType: 'gift_card',
    fulfillmentType: 'manual',
    price: 2450000,
    deliveredData: 'Code 1: XX98-LKA9-9912-MM81 | Code 2: PP81-8821-NN77-QK12',
    paymentMethod: 'vietqr',
    soldAt: '09:34:00 - 21/08/2026',
    status: 'delivered'
  },
  {
    id: 'SOLD-8819',
    orderCode: 'ORD-TOPUP-551029',
    customerName: 'CryptoWhale_88',
    customerEmail: 'whale88@binance.io',
    productTitle: 'PUBG Mobile - 8,100 UC Global Direct',
    productType: 'topup_manual',
    fulfillmentType: 'manual',
    price: 2190000,
    deliveredData: 'Midasbuy Transaction ID: MID-883921094. UID: 5192837482',
    paymentMethod: 'usdt',
    soldAt: '08:18:00 - 21/08/2026',
    status: 'delivered'
  },
  {
    id: 'SOLD-8818',
    orderCode: 'ORD-ESCROW-11029',
    customerName: 'GamerPro99',
    customerEmail: 'gamerpro99@gmail.com',
    productTitle: 'Netflix Premium 4K UltraHD (Gom Đơn 5 Slot)',
    productType: 'escrow_pool',
    fulfillmentType: 'automatic',
    price: 65000,
    deliveredData: 'netflix_pool88@vietflix.com | Pass: Vietflix2026 | Profile: Slot #3 (PIN: 8821)',
    paymentMethod: 'card',
    soldAt: '07:45:00 - 21/08/2026',
    status: 'warranty_active'
  },
  {
    id: 'SOLD-8817',
    orderCode: 'ORD-KEY-00291',
    customerName: 'TranVanMinh',
    customerEmail: 'minh.tv@outlook.com',
    productTitle: 'Windows 11 Pro Retail Digital Key',
    productType: 'key_game',
    fulfillmentType: 'automatic',
    price: 180000,
    deliveredData: 'W269N-WFGWX-YVC9B-4J6C9-T83GX',
    paymentMethod: 'balance',
    soldAt: '06:12:00 - 21/08/2026',
    status: 'delivered'
  }
];

interface AdminSoldOrdersTabProps {
  currency?: Currency;
}

export const AdminSoldOrdersTab: React.FC<AdminSoldOrdersTabProps> = ({ currency = 'VND' }) => {
  const [soldOrders, setSoldOrders] = useState<SoldOrderItem[]>(INITIAL_SOLD_ORDERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewDetailOrder, setViewDetailOrder] = useState<SoldOrderItem | null>(null);

  const filteredOrders = soldOrders.filter(ord => {
    const matchSearch = ord.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.deliveredData.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchType = typeFilter === 'all' || ord.productType === typeFilter;
    return matchSearch && matchType;
  });

  const totalRevenue = soldOrders.reduce((sum, o) => sum + o.price, 0);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = 'ID,Mã Đơn,Khách Hàng,Email,Sản Phẩm,Phân Loại,Giá Tiền,Phương Thức,Thời Gian,Dữ Liệu Đã Bàn Giao\n';
    const rows = filteredOrders.map(o => 
      `"${o.id}","${o.orderCode}","${o.customerName}","${o.customerEmail}","${o.productTitle}","${o.productType}","${o.price}","${o.paymentMethod}","${o.soldAt}","${o.deliveredData.replace(/"/g, '""')}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sold_Orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 font-sans text-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2 tracking-wide">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>LỊCH SỬ ĐƠN HÀNG ĐÃ BÁN ({soldOrders.length} GIAO DỊCH HOÀN TẤT)</span>
            <span className="px-2 py-0.5 rounded text-xs bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-medium">
              Sold Archive
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Kho lưu trữ dữ liệu đơn hàng đã bán: Tài khoản tự động, Key game bản quyền, Mã thẻ và Gói nạp in-game đã bàn giao cho khách.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-bold font-mono text-xs">
            Tổng Doanh Thu Đã Bán: {formatCurrency(totalRevenue, currency)}
          </div>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Xuất File CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã đơn, khách hàng, tên sản phẩm, key/tài khoản..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Tất cả danh mục ({soldOrders.length})</option>
            <option value="account">Tài khoản tự động (Account)</option>
            <option value="key_game">Key Game bản quyền</option>
            <option value="gift_card">Thẻ quà tặng E-Gift</option>
            <option value="topup_manual">Nạp game UID/Direct</option>
            <option value="escrow_pool">Mua chung Escrow</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-bold tracking-wider">
              <th className="py-3 px-3 whitespace-nowrap w-36">Mã Đơn / Ngày</th>
              <th className="py-3 px-3 whitespace-nowrap w-36">Khách Hàng</th>
              <th className="py-3 px-3 min-w-[160px]">Sản Phẩm & Phân Loại</th>
              <th className="py-3 px-3 whitespace-nowrap w-28 text-right">Giá Bán</th>
              <th className="py-3 px-3 min-w-[200px]">Dữ Liệu Đã Bàn Giao</th>
              <th className="py-3 px-3 whitespace-nowrap w-28 text-center">Trạng Thái</th>
              <th className="py-3 px-3 whitespace-nowrap w-20 text-center">Chi Tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredOrders.map((ord) => (
              <tr key={ord.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-3 align-top">
                  <div className="font-semibold text-emerald-400 font-mono text-xs flex items-center gap-1">
                    <span>{ord.orderCode}</span>
                    <button
                      onClick={() => copyToClipboard(ord.orderCode, ord.id)}
                      className="text-slate-500 hover:text-white p-0.5 transition-colors"
                      title="Sao chép mã đơn"
                    >
                      {copiedId === ord.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{ord.soldAt}</div>
                </td>

                <td className="py-3 px-3 align-top">
                  <div className="font-semibold text-white">{ord.customerName}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 break-all">{ord.customerEmail}</div>
                </td>

                <td className="py-3 px-3 align-top">
                  <div className="font-semibold text-slate-200 leading-snug">{ord.productTitle}</div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                      ord.fulfillmentType === 'automatic' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {ord.fulfillmentType === 'automatic' ? 'Giao Tự Động' : 'Giao Thủ Công'}
                    </span>
                    <span className="text-[11px] text-slate-400 capitalize">({ord.productType.replace('_', ' ')})</span>
                  </div>
                </td>

                <td className="py-3 px-3 font-bold text-emerald-400 font-mono align-top text-right whitespace-nowrap">
                  {formatCurrency(ord.price, currency)}
                </td>

                <td className="py-3 px-3 align-top">
                  <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-slate-300 font-mono text-xs flex items-center justify-between gap-2 max-w-sm">
                    <span className="break-all select-all font-mono text-[11px]">{ord.deliveredData}</span>
                    <button
                      onClick={() => copyToClipboard(ord.deliveredData, ord.id + '_data')}
                      className="text-slate-400 hover:text-white p-1 shrink-0 bg-slate-800 rounded hover:bg-slate-700 transition-colors"
                      title="Copy dữ liệu bàn giao"
                    >
                      {copiedId === ord.id + '_data' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </td>

                <td className="py-3 px-3 whitespace-nowrap align-top text-center">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hoàn Tất</span>
                  </span>
                </td>

                <td className="py-3 px-3 text-center whitespace-nowrap align-top">
                  <button
                    onClick={() => setViewDetailOrder(ord)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer transition-colors"
                    title="Xem chi tiết đơn"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Detail Modal */}
      {viewDetailOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-white text-sm">
                  CHI TIẾT ĐƠN HÀNG ĐÃ BÁN: #{viewDetailOrder.orderCode}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setViewDetailOrder(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <span className="text-slate-500">Khách mua:</span>
                  <div className="font-bold text-white">{viewDetailOrder.customerName}</div>
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>
                  <div className="font-bold text-cyan-400">{viewDetailOrder.customerEmail}</div>
                </div>
                <div>
                  <span className="text-slate-500">Sản phẩm:</span>
                  <div className="font-bold text-slate-200">{viewDetailOrder.productTitle}</div>
                </div>
                <div>
                  <span className="text-slate-500">Giá thanh toán:</span>
                  <div className="font-bold text-emerald-400">{formatCurrency(viewDetailOrder.price, currency)}</div>
                </div>
                <div>
                  <span className="text-slate-500">Phương thức:</span>
                  <div className="font-bold text-slate-300 uppercase">{viewDetailOrder.paymentMethod}</div>
                </div>
                <div>
                  <span className="text-slate-500">Thời gian mua:</span>
                  <div className="font-bold text-slate-400">{viewDetailOrder.soldAt}</div>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">
                  Nội Dung Dữ Liệu Đã Bàn Giao (Account / Key / Pin / Topup TX):
                </label>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-mono text-xs whitespace-pre-wrap select-all">
                  {viewDetailOrder.deliveredData}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setViewDetailOrder(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
