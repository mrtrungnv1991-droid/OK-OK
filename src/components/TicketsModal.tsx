import React, { useState } from 'react';
import { 
  X, 
  LifeBuoy, 
  Send, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Bot, 
  User, 
  Sparkles,
  Key,
  Copy,
  Check,
  PlusCircle,
  MessageSquare
} from 'lucide-react';
import { SupportTicket, UserProfile } from '../types';
import { useTranslation } from '../i18n';

interface TicketsModalProps {
  tickets: SupportTicket[];
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onCreateTicket: (subject: string, category: any, message: string) => void;
  onReplyTicket: (ticketId: string, message: string) => void;
}

export const TicketsModal: React.FC<TicketsModalProps> = ({
  tickets,
  isOpen,
  onClose,
  user,
  onCreateTicket,
  onReplyTicket
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const [activeTicketId, setActiveTicketId] = useState<string>(tickets[0]?.id || '');
  const [replyText, setReplyText] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<'Key Issue' | 'Top-Up Delay' | 'Escrow Refund' | 'General Support'>('Key Issue');
  const [newMessage, setNewMessage] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeTicket = tickets.find(t => t.id === activeTicketId) || tickets[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !activeTicket) return;
    onReplyTicket(activeTicket.id, replyText.trim());
    setReplyText('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;
    onCreateTicket(newSubject.trim(), newCategory, newMessage.trim());
    setIsCreatingNew(false);
    setNewSubject('');
    setNewMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl bg-[#0b0e17] border border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.2)] overflow-hidden my-8 flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white flex items-center gap-2">
                <span>{t('tickets.center_title') || 'ESCROW DISPUTE & WARRANTY CENTER'}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 uppercase">
                  Auto-Replace 24/7
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {t('tickets.center_desc') || 'Automated verification and 1:1 instant key replacement protocol'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Split View */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Column: Tickets List */}
          <div className="md:col-span-4 border-r border-slate-800/80 bg-[#080b12] flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300">
                {t('tickets.ticket_list') || 'Tickets'} ({tickets.length})
              </span>
              <button
                onClick={() => setIsCreatingNew(true)}
                className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t('tickets.new_ticket') || 'New Ticket'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {tickets.map(ticket => {
                const isActive = activeTicket?.id === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => {
                      setActiveTicketId(ticket.id);
                      setIsCreatingNew(false);
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isActive && !isCreatingNew
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-sm'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono font-bold text-cyan-400">
                        {ticket.id}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${
                        ticket.status === 'auto_replaced'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                          : ticket.status === 'resolved'
                          ? 'bg-cyan-950 text-cyan-400'
                          : 'bg-amber-950 text-amber-400'
                      }`}>
                        {ticket.status === 'auto_replaced' ? 'REPLACED' : ticket.status}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-200 line-clamp-1">
                      {ticket.subject}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center justify-between">
                      <span>{ticket.category}</span>
                      <span>{ticket.createdAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Chat View or Create Form */}
          <div className="md:col-span-8 bg-[#0b0e17] flex flex-col overflow-hidden">
            {isCreatingNew ? (
              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>CREATE WARRANTY & DISPUTE TICKET</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
                  >
                    {t('modal.close')}
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Key Issue">Key Issue (Invalid / Already Used)</option>
                    <option value="Top-Up Delay">Top-Up Delay / Items Not Received</option>
                    <option value="Escrow Refund">Escrow Refund Request</option>
                    <option value="General Support">Technical & API Support</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Subject</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. Steam key received reported already redeemed"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Description & Order ID</label>
                  <textarea
                    rows={4}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Detailed description of the issue for automated review..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Submit & Trigger Auto-Replacement
                </button>
              </form>
            ) : activeTicket ? (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Active Ticket Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {activeTicket.id}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">• {activeTicket.category}</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-white mt-0.5">
                      {activeTicket.subject}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Escrow Guaranteed 100%</span>
                  </div>
                </div>

                {/* Messages Thread */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activeTicket.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-xl ${
                        msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        msg.sender === 'bot'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40'
                          : msg.sender === 'agent'
                          ? 'bg-purple-950 text-purple-400 border border-purple-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {msg.sender === 'bot' ? (
                          <Bot className="w-4 h-4" />
                        ) : msg.sender === 'agent' ? (
                          <LifeBuoy className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>

                      <div className={`space-y-2 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                        <div className={`p-3.5 rounded-xl text-xs font-mono leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-cyan-600 text-black font-semibold'
                            : 'bg-slate-900 border border-slate-800 text-slate-200'
                        }`}>
                          {msg.text}

                          {/* Auto Replaced Key Box */}
                          {msg.attachmentKey && (
                            <div className="mt-3 p-3 rounded-lg bg-black/80 border border-emerald-500/50 space-y-2 text-left">
                              <div className="text-[10px] font-bold font-mono text-emerald-400 flex items-center gap-1.5 uppercase">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>REPLACED KEY CODE:</span>
                              </div>
                              <div className="flex items-center justify-between gap-2 p-2 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-white">
                                <span className="font-bold text-cyan-300 break-all">
                                  {msg.attachmentKey}
                                </span>
                                <button
                                  onClick={() => handleCopy(msg.attachmentKey!)}
                                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 shrink-0 cursor-pointer"
                                >
                                  {copiedKey === msg.attachmentKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono">
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input Bar */}
                <div className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    placeholder="Type your reply or additional info..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-3 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleSendReply}
                    className="p-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
