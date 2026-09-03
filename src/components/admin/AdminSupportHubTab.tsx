import React, { useState } from 'react';
import { MessageSquare, LifeBuoy, ShieldAlert, CheckCircle2, Clock, Headphones } from 'lucide-react';
import { SupportTicket, ChatSession } from '../../types';
import { AdminLiveChatTab } from './AdminLiveChatTab';
import { AdminTicketsTab } from './AdminTicketsTab';

interface AdminSupportHubTabProps {
  chatSessions: ChatSession[];
  tickets: SupportTicket[];
  onAdminSendChatMessage: (sessionId: string, text: string) => void;
  onAdminReplyTicket: (ticketId: string, replyText: string, newStatus?: SupportTicket['status']) => void;
  defaultSubTab?: 'livechat' | 'tickets';
}

export const AdminSupportHubTab: React.FC<AdminSupportHubTabProps> = ({
  chatSessions,
  tickets,
  onAdminSendChatMessage,
  onAdminReplyTicket,
  defaultSubTab = 'tickets'
}) => {
  const [subTab, setSubTab] = useState<'livechat' | 'tickets'>(defaultSubTab);

  const openTickets = tickets.filter(t => t.status === 'open');
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');

  return (
    <div className="space-y-4">
      {/* Top Banner & Hub Controls */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 relative overflow-hidden backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold uppercase tracking-wider">
                <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                <span>Trung Tâm Hỗ Trợ & Khiếu Nại Hợp Nhất</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                ● CSKH 24/7 ONLINE
              </span>
            </div>
            <h2 className="text-base font-bold text-white uppercase tracking-tight">
              Quản Lý Khiếu Nại, Bảo Hành & Live Chat CSKH
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
              Hợp nhất kênh tương tác khách hàng: Trò chuyện trực tuyến theo thời gian thực và xử lý hồ sơ khiếu nại, bảo hành 1 đổi 1.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center min-w-[85px]">
              <div className="text-[10px] text-slate-400 uppercase font-medium">Phiên Chat</div>
              <div className="text-sm font-bold text-cyan-400 font-mono">{chatSessions.length}</div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center min-w-[85px]">
              <div className="text-[10px] text-amber-400 uppercase font-medium flex items-center justify-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>Chờ Xử Lý</span>
              </div>
              <div className="text-sm font-bold text-amber-400 font-mono">{openTickets.length}</div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center min-w-[85px]">
              <div className="text-[10px] text-emerald-400 uppercase font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Đã Giải Quyết</span>
              </div>
              <div className="text-sm font-bold text-emerald-400 font-mono">{resolvedTickets.length}</div>
            </div>
          </div>
        </div>

        {/* Unified Sub-Tabs Switcher */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setSubTab('tickets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'tickets'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/40'
                : 'bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Vé Khiếu Nại & Bảo Hành 1 Đổi 1 (Tickets)</span>
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                subTab === 'tickets'
                  ? 'bg-black/40 text-white border border-white/20'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {tickets.length}
            </span>
            {openTickets.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Có vé mới chưa giải quyết" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('livechat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'livechat'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/40'
                : 'bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Live Chat CSKH Trực Tuyến 24/7</span>
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                subTab === 'livechat'
                  ? 'bg-black/40 text-white border border-white/20'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {chatSessions.length}
            </span>
            {chatSessions.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Phiên chat đang mở" />
            )}
          </button>
        </div>
      </div>

      {/* Sub-tab view container */}
      <div className="mt-2">
        {subTab === 'tickets' ? (
          <AdminTicketsTab
            tickets={tickets}
            onAdminReplyTicket={onAdminReplyTicket}
          />
        ) : (
          <AdminLiveChatTab
            chatSessions={chatSessions}
            onAdminSendChatMessage={onAdminSendChatMessage}
          />
        )}
      </div>
    </div>
  );
};
