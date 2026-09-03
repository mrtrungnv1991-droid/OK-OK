import React, { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { ChatSession } from '../../types';

interface AdminLiveChatTabProps {
  chatSessions: ChatSession[];
  onAdminSendChatMessage: (sessionId: string, text: string) => void;
}

export const AdminLiveChatTab: React.FC<AdminLiveChatTabProps> = ({
  chatSessions,
  onAdminSendChatMessage
}) => {
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(
    chatSessions.length > 0 ? chatSessions[0].id : null
  );
  const [adminChatReplyInput, setAdminChatReplyInput] = useState('');

  const activeChatSession = chatSessions.find(s => s.id === activeChatSessionId);

  const handleSendAdminChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminChatReplyInput.trim() || !activeChatSessionId) return;

    onAdminSendChatMessage(activeChatSessionId, adminChatReplyInput.trim());
    setAdminChatReplyInput('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>TRUNG TÂM CSKH TRỰC TUYẾN 24/7 (LIVE HELPDESK AGENT)</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Tiếp nhận yêu cầu bảo hành, tra soát mã giao dịch và hỗ trợ khách hàng theo thời gian thực
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-bold text-[10px]">
          ● AGENT ONLINE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[460px]">
        {/* Sessions List */}
        <div className="md:col-span-4 rounded-xl bg-slate-900/40 border border-slate-800 p-2 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] text-slate-400 uppercase font-bold px-2 py-1">Phòng Chat Khách Hàng:</div>
          {chatSessions.map(session => (
            <div
              key={session.id}
              onClick={() => setActiveChatSessionId(session.id)}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                activeChatSession?.id === session.id
                  ? 'bg-cyan-950/50 border-cyan-400'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{session.userName}</span>
                <span className="text-[10px] text-slate-500">{session.updatedAt}</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-1">{session.lastMessage}</div>
            </div>
          ))}
        </div>

        {/* Active Chat Conversation Desk */}
        <div className="md:col-span-8 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col overflow-hidden">
          {activeChatSession ? (
            <>
              {/* Conversation Header */}
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{activeChatSession.userName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono">
                    UID: {activeChatSession.userId}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">Đang trò chuyện</span>
              </div>

              {/* Messages Box */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-[#06080e]/90">
                {activeChatSession.messages.map(m => {
                  const isAgent = m.sender === 'agent';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-500 mb-0.5">
                        {m.senderName} • {m.timestamp}
                      </div>
                      {m.orderRef && (
                        <div className="px-2 py-0.5 rounded bg-black/60 border border-cyan-500/30 text-[10px] text-cyan-300 mb-1 font-mono">
                          Đơn liên quan: {m.orderRef}
                        </div>
                      )}
                      <div
                        className={`p-2.5 rounded-xl max-w-[85%] text-xs ${
                          isAgent
                            ? 'bg-cyan-600 text-black font-medium'
                            : 'bg-slate-900 border border-slate-800 text-slate-200'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendAdminChat} className="p-2.5 bg-slate-950 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={adminChatReplyInput}
                  onChange={(e) => setAdminChatReplyInput(e.target.value)}
                  placeholder="Nhập câu trả lời từ CSKH / Admin..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              Chọn một phiên chat để bắt đầu hỗ trợ
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
