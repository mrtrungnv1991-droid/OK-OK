import React, { useState } from 'react';
import { LifeBuoy, Send } from 'lucide-react';
import { SupportTicket } from '../../types';

interface AdminTicketsTabProps {
  tickets: SupportTicket[];
  onAdminReplyTicket: (ticketId: string, replyText: string, newStatus?: SupportTicket['status']) => void;
}

export const AdminTicketsTab: React.FC<AdminTicketsTabProps> = ({
  tickets,
  onAdminReplyTicket
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    tickets.length > 0 ? tickets[0].id : null
  );
  const [ticketReplyText, setTicketReplyText] = useState('');

  const activeTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-cyan-400" />
            <span>XỬ LÝ KHIẾU NẠI & BẢO HÀNH 1 ĐỔI 1 (TICKETS)</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Giải quyết tranh chấp key lỗi, trễ topup game và tự động đổi trả
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Tổng: <strong className="text-cyan-300">{tickets.length}</strong> tickets
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5 space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {tickets.map(t => (
            <div
              key={t.id}
              onClick={() => setSelectedTicketId(t.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedTicketId === t.id
                  ? 'bg-cyan-950/40 border-cyan-400'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 font-mono">{t.id}</span>
                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                  t.status === 'resolved'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                }`}>
                  {t.status}
                </span>
              </div>
              <div className="text-xs text-slate-200 mt-1 line-clamp-1 font-medium">{t.subject}</div>
              <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                <span>{t.category}</span>
                <span>{t.createdAt}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="md:col-span-7 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
          {activeTicket ? (
            <>
              <div className="border-b border-slate-800 pb-2">
                <div className="text-xs font-bold text-white">{activeTicket.subject}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Phân loại: <span className="text-cyan-300">{activeTicket.category}</span> • Mã: <span className="font-mono text-slate-300">{activeTicket.id}</span> • Ngày tạo: {activeTicket.createdAt}
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto flex-1 pr-1">
                {activeTicket.messages.map(m => (
                  <div key={m.id} className="p-2.5 rounded bg-black/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 font-bold">[{m.sender.toUpperCase()}]</span>
                      <span className="text-[10px] text-slate-500">{m.timestamp}</span>
                    </div>
                    <div className="text-slate-300">{m.text}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={ticketReplyText}
                  onChange={(e) => setTicketReplyText(e.target.value)}
                  placeholder="Nhập phản hồi từ Admin..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && ticketReplyText.trim()) {
                      onAdminReplyTicket(activeTicket.id, ticketReplyText.trim(), 'resolved');
                      setTicketReplyText('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (!ticketReplyText.trim()) return;
                    onAdminReplyTicket(activeTicket.id, ticketReplyText.trim(), 'resolved');
                    setTicketReplyText('');
                  }}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-xs text-slate-500 py-10">
              Chọn một ticket khiếu nại để xem chi tiết và phản hồi
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
