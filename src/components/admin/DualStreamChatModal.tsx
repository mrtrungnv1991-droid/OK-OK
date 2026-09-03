import React, { useState } from 'react';
import { 
  X, 
  Send, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  User, 
  Headphones, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertTriangle,
  Zap,
  Sparkles,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { SourcePendingOrder, DualStreamChatMessage, CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface DualStreamChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SourcePendingOrder;
  currency: CurrencyCode;
  initialMessages?: DualStreamChatMessage[];
  onSendMessage: (
    stream: 'CUSTOMER' | 'SOURCE_PROVIDER',
    sender: 'ADMIN',
    text: string,
    isForwarded?: boolean
  ) => void;
  onFulfillOrder: (orderId: string, deliveredKey: string) => void;
}

export const DualStreamChatModal: React.FC<DualStreamChatModalProps> = ({
  isOpen,
  onClose,
  order,
  currency,
  initialMessages = [],
  onSendMessage,
  onFulfillOrder
}) => {
  const [messages, setMessages] = useState<DualStreamChatMessage[]>(initialMessages);
  const [customerInput, setCustomerInput] = useState('');
  const [providerInput, setProviderInput] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [completionKey, setCompletionKey] = useState(order.deliveredContent || '');
  const [showFulfillBox, setShowFulfillBox] = useState(false);

  if (!isOpen) return null;

  const customerMessages = messages.filter(m => m.stream === 'CUSTOMER');
  const providerMessages = messages.filter(m => m.stream === 'SOURCE_PROVIDER');

  const handleSendToCustomer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customerInput.trim()) return;

    const newMsg: DualStreamChatMessage = {
      id: `msg-${Date.now()}`,
      orderId: order.orderCode,
      stream: 'CUSTOMER',
      sender: 'ADMIN',
      senderName: 'CyberPool Escrow Admin',
      text: customerInput.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);
    onSendMessage('CUSTOMER', 'ADMIN', customerInput.trim());
    setCustomerInput('');
  };

  const handleSendToProvider = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!providerInput.trim()) return;

    const newMsg: DualStreamChatMessage = {
      id: `msg-${Date.now()}`,
      orderId: order.orderCode,
      stream: 'SOURCE_PROVIDER',
      sender: 'ADMIN',
      senderName: 'Admin CyberPool (Gửi qua Muakey Ticket)',
      text: providerInput.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);
    onSendMessage('SOURCE_PROVIDER', 'ADMIN', providerInput.trim());
    setProviderInput('');
  };

  // 1-Click Forward: Copy customer's latest email/UID/OTP into Muakey provider chat
  const handleForwardToProvider = (textToForward: string) => {
    setProviderInput(`[Chuyển tiếp từ khách ${order.customerName}]: ${textToForward}`);
  };

  // 1-Click Forward Provider info to customer
  const handleForwardToCustomer = (textToForward: string) => {
    setCustomerInput(`[Thông báo từ nhà cung cấp ${order.sourceName}]: ${textToForward}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#090e1c] border border-cyan-500/50 rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white font-mono uppercase tracking-wider">
                  CẦU CHAT SONG SONG // DUAL-STREAM SUPPORT BRIDGE
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  ĐƠN #{order.orderCode}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  ESCROW: {formatCurrency(order.retailPrice, currency)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Xử lý song song giữa Khách Hàng CyberPool ⟷ Quản Trị Viên ⟷ Nhà Cung Cấp ({order.sourceName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFulfillBox(!showFulfillBox)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black text-xs font-bold font-mono shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Bàn Giao & Hoàn Tất Đơn</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Fulfill Box Dropdown (If toggled) */}
        {showFulfillBox && (
          <div className="p-4 bg-emerald-950/40 border-b border-emerald-500/40 animate-in fade-in duration-150">
            <div className="max-w-3xl mx-auto space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-300">
                <span>NỘI DUNG BÀN GIAO CHO KHÁCH (KEY / LINK INVITE / TÀI KHOẢN):</span>
                <span className="text-slate-400">Tự động ghi vào Key Vault & Mở khóa tiền Escrow</span>
              </div>
              <textarea
                value={completionKey}
                onChange={e => setCompletionKey(e.target.value)}
                placeholder="Nhập Key hoặc Link mời team nhận được từ Muakey để gửi cho khách..."
                rows={2}
                className="w-full bg-black/60 border border-emerald-500/50 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowFulfillBox(false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (!completionKey.trim()) return;
                    onFulfillOrder(order.id, completionKey.trim());
                    setShowFulfillBox(false);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold font-mono cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Bàn Giao Ngay</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Quick Strip */}
        <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs font-mono flex flex-wrap items-center justify-between gap-3 text-slate-300">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500">Sản phẩm:</span>{' '}
              <span className="font-bold text-cyan-300">{order.productTitle}</span>
            </div>
            <div>
              <span className="text-slate-500">Khách:</span>{' '}
              <span className="font-bold text-white">{order.customerName}</span>
            </div>
            {order.accountDetails?.emailDelivery && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Email:</span>{' '}
                <span className="font-bold text-amber-300">{order.accountDetails.emailDelivery}</span>
                <button
                  onClick={() => copyToClipboard(order.accountDetails!.emailDelivery!)}
                  className="text-slate-400 hover:text-white cursor-pointer ml-1"
                  title="Copy Email"
                >
                  {copiedText === order.accountDetails.emailDelivery ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}
            {order.accountDetails?.uid && (
              <div>
                <span className="text-slate-500">UID:</span> <span className="font-bold text-amber-300">{order.accountDetails.uid}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div>
              <span className="text-slate-500">Idempotency:</span>{' '}
              <code className="text-[11px] text-slate-400">{order.idempotencyKey}</code>
            </div>
            <a
              href="https://muakey.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] underline"
            >
              <span>Mở Muakey.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Dual-Stream 2-Column Workspace */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden">
          
          {/* COLUMN 1: CUSTOMER STREAM */}
          <div className="flex flex-col h-full overflow-hidden bg-slate-950/40">
            {/* Stream Header */}
            <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-bold font-mono text-cyan-300 uppercase">
                  LUỒNG KHÁCH HÀNG (CYBERPOOL CHAT)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {customerMessages.length} tin nhắn
              </span>
            </div>

            {/* Customer Chat Message Feed */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto font-mono text-xs">
              {customerMessages.map(msg => {
                const isCustomer = msg.sender === 'CUSTOMER';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                      <span className="font-bold text-slate-300">{msg.senderName}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString('vi-VN')}</span>
                      {msg.isForwarded && (
                        <span className="px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/30 text-[9px]">
                          Forwarded
                        </span>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] p-2.5 rounded-xl border ${
                        isCustomer
                          ? 'bg-cyan-950/40 border-cyan-500/30 text-slate-200'
                          : 'bg-slate-800/90 border-slate-700 text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {isCustomer && (
                      <button
                        onClick={() => handleForwardToProvider(msg.text)}
                        className="mt-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer bg-slate-900 px-2 py-0.5 rounded border border-slate-800 hover:border-cyan-500/40"
                        title="Chuyển tiếp nội dung này sang web Muakey"
                      >
                        <span>Chuyển sang Muakey</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Templates for Customer */}
            <div className="p-2 bg-slate-900/40 border-t border-slate-800 flex gap-1.5 overflow-x-auto text-[10px] font-mono">
              <button
                onClick={() => setCustomerInput('Dạ chào bạn, shop đang liên hệ bên hệ thống Muakey để kích hoạt. Bạn vui lòng đợi 3-5 phút nhé!')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
              >
                + Báo đang xử lý (3-5p)
              </button>
              <button
                onClick={() => setCustomerInput('Bạn vui lòng kiểm tra hòm thư / email để bấm vào liên kết xác nhận giúp shop nhé.')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
              >
                + Yêu cầu check mail
              </button>
              <button
                onClick={() => setCustomerInput('Bạn gửi giúp shop mã OTP 6 chữ số vừa được gửi về email/số điện thoại nhé!')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
              >
                + Xin mã OTP
              </button>
            </div>

            {/* Input Box for Customer */}
            <form onSubmit={handleSendToCustomer} className="p-2.5 bg-slate-950 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={customerInput}
                onChange={e => setCustomerInput(e.target.value)}
                placeholder="Nhắn tin cho khách hàng..."
                className="flex-1 bg-black/60 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-mono flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gửi Khách</span>
              </button>
            </form>
          </div>

          {/* COLUMN 2: SOURCE PROVIDER STREAM */}
          <div className="flex flex-col h-full overflow-hidden bg-slate-950/40">
            {/* Stream Header */}
            <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold font-mono text-amber-300 uppercase">
                  LUỒNG NHÀ CUNG CẤP ({order.sourceName.toUpperCase()} TICKET / LIVECHAT)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Đấu nối tài khoản mua
              </span>
            </div>

            {/* Provider Chat Message Feed */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto font-mono text-xs">
              {providerMessages.map(msg => {
                const isProvider = msg.sender === 'PROVIDER_SUPPORT';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isProvider ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                      <span className="font-bold text-slate-300">{msg.senderName}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString('vi-VN')}</span>
                      {msg.isForwarded && (
                        <span className="px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[9px]">
                          Fwd từ khách
                        </span>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] p-2.5 rounded-xl border ${
                        isProvider
                          ? 'bg-amber-950/40 border-amber-500/30 text-slate-200'
                          : 'bg-slate-800/90 border-slate-700 text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {isProvider && (
                      <button
                        onClick={() => handleForwardToCustomer(msg.text)}
                        className="mt-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer bg-slate-900 px-2 py-0.5 rounded border border-slate-800 hover:border-amber-500/40"
                        title="Chuyển tiếp nội dung này sang cho khách hàng"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Chuyển cho Khách</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Templates for Provider */}
            <div className="p-2 bg-slate-900/40 border-t border-slate-800 flex gap-1.5 overflow-x-auto text-[10px] font-mono">
              <button
                onClick={() => setProviderInput(`Admin Muakey check giúp mình đơn #${order.orderCode} email: ${order.accountDetails?.emailDelivery || ''} với ạ`)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
              >
                + Yêu cầu xử lý đơn
              </button>
              <button
                onClick={() => setProviderInput('Khách đã gửi mã OTP, nhờ bên bạn nhập và xác thực hoàn tất giúp mình nhé.')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
              >
                + Báo đã có OTP
              </button>
            </div>

            {/* Input Box for Provider */}
            <form onSubmit={handleSendToProvider} className="p-2.5 bg-slate-950 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={providerInput}
                onChange={e => setProviderInput(e.target.value)}
                placeholder="Nhắn tin cho support Muakey / Ghi chú đơn..."
                className="flex-1 bg-black/60 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-mono flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gửi Nguồn</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
