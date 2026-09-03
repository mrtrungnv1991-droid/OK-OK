import React, { useState } from 'react';
import { Gift, Search, Plus, ShieldCheck, CheckCircle2, Clock, Copy, Check, Tag } from 'lucide-react';
import { CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface GiftUpCardAdminItem {
  id: string;
  code: string;
  brand: string;
  valueUsd: number;
  valueVnd: number;
  pin: string;
  barcode: string;
  status: 'in_stock' | 'allocated' | 'redeemed';
  allocatedTo?: string;
  createdAt: string;
}

const INITIAL_GIFTUP_CARDS: GiftUpCardAdminItem[] = [
  {
    id: 'GU-1001',
    code: 'GU-APPLE-50-882190',
    brand: 'Apple App Store & iTunes 50$',
    valueUsd: 50,
    valueVnd: 1250000,
    pin: '8821',
    barcode: '492819284918',
    status: 'in_stock',
    createdAt: '2026-08-20'
  },
  {
    id: 'GU-1002',
    code: 'GU-STEAM-100-994821',
    brand: 'Steam Wallet Card 100$',
    valueUsd: 100,
    valueVnd: 2500000,
    pin: '7721',
    barcode: '992819284911',
    status: 'allocated',
    allocatedTo: 'CyberBuyer_Vn',
    createdAt: '2026-08-22'
  },
  {
    id: 'GU-1003',
    code: 'GU-ROBLOX-25-338291',
    brand: 'Roblox Digital Gift Card 25$',
    valueUsd: 25,
    valueVnd: 625000,
    pin: '9912',
    barcode: '338291829381',
    status: 'in_stock',
    createdAt: '2026-08-25'
  }
];

export const AdminGiftUpExchangeTab: React.FC<{ currency?: CurrencyCode }> = ({ currency = 'VND' }) => {
  const [cards, setCards] = useState<GiftUpCardAdminItem[]>(INITIAL_GIFTUP_CARDS);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredCards = cards.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-400" />
            KHO THẺ QUÀ TẶNG E-GIFTUP CARDS (GIFTUP EXCHANGE)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý mã vạch barcode, thẻ quà tặng số Apple, Google Play, Steam, Amazon, Roblox
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm mã thẻ..."
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-pink-500/80"
            />
          </div>
        </div>
      </div>

      {/* Cards Table */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">ID / Mã Thẻ</th>
                <th className="p-3">Loại Thẻ & Mệnh Giá</th>
                <th className="p-3">Barcode & PIN</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3">Khách Nhận</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredCards.map(c => (
                <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3">
                    <div className="font-mono font-bold text-white">{c.id}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{c.code}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-white">{c.brand}</div>
                    <div className="text-[11px] text-pink-400 font-mono font-bold">
                      ${c.valueUsd} USD (~{formatCurrency(c.valueVnd, currency)})
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-mono text-slate-300">Barcode: {c.barcode}</div>
                    <div className="text-[11px] text-slate-400 font-mono">PIN: {c.pin}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      c.status === 'in_stock' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    }`}>
                      {c.status === 'in_stock' ? 'Sẵn sàng trong kho' : 'Đã giao khách'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">
                    {c.allocatedTo || '-'}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleCopy(c.code, c.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
