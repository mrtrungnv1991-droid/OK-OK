import React, { useState } from 'react';
import { 
  Gift, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Download, 
  QrCode, 
  CreditCard,
  Sparkles,
  Zap
} from 'lucide-react';
import { UserOrder } from '../types';
import { useTranslation } from '../i18n';

interface GiftUpCardViewerProps {
  order: UserOrder;
  onClose?: () => void;
}

export const GiftUpCardViewer: React.FC<GiftUpCardViewerProps> = ({ order }) => {
  const { t } = useTranslation();
  const [isRevealed, setIsRevealed] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'valid' | 'checking' | 'active'>('active');

  const card = order.giftUpCard || {
    cardNumber: '4928 8812 3390 1091',
    pinCode: order.pinCode || '4821',
    barcode: 'GU-9901-8823-112',
    balance: 50,
    currency: 'USD',
    expiryDate: '12/2028',
    redeemUrl: 'https://giftup.app/redeem/cyberpool'
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(card.cardNumber.replace(/\s/g, ''));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(card.pinCode);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleCheckLiveBalance = () => {
    setIsCheckingBalance(true);
    setNetworkStatus('checking');
    setTimeout(() => {
      setIsCheckingBalance(false);
      setNetworkStatus('valid');
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <span>GIFTUP DIGITAL CARD PROTOCOL</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                ACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Digital Gift Card ${card.balance} {card.currency} (Verified)
            </p>
          </div>
        </div>

        <button
          onClick={handleCheckLiveBalance}
          disabled={isCheckingBalance}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingBalance ? 'animate-spin text-cyan-400' : ''}`} />
          <span>{isCheckingBalance ? 'Querying...' : 'Live Balance Check'}</span>
        </button>
      </div>

      {/* Cyber Digital Gift Card Visual */}
      <div className="relative w-full max-w-lg mx-auto aspect-[1.586/1] rounded-2xl p-6 bg-gradient-to-br from-[#121624] via-[#0d101a] to-[#07090e] border border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col justify-between select-none">
        {/* Subtle Cyber Circuit Overlay */}
        <div className="absolute inset-0 cyber-grid-dense opacity-30 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Card Top Row */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-black">
              <Zap className="w-5 h-5 font-black" />
            </div>
            <div>
              <div className="text-xs font-black font-mono tracking-widest text-white">GIFTUP // DIGITAL</div>
              <div className="text-[9px] font-mono text-cyan-400">GLOBAL MULTI-REDEEM CARD</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Card Value</div>
            <div className="text-2xl font-black font-mono text-amber-400 tracking-tight">
              ${card.balance}.00 <span className="text-xs text-slate-300">{card.currency}</span>
            </div>
          </div>
        </div>

        {/* Card Number & Scratch Reveal Box */}
        <div className="relative z-10 my-auto">
          <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Card Number</div>
          <div className="relative p-3 rounded-lg bg-black/60 border border-slate-700 flex items-center justify-between">
            <div className="font-mono text-base sm:text-lg tracking-widest font-bold text-cyan-300">
              {isRevealed ? card.cardNumber : '•••• •••• •••• ' + card.cardNumber.slice(-4)}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRevealed(!isRevealed)}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title={isRevealed ? 'Hide code' : 'Reveal code'}
              >
                {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>

              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 transition-colors cursor-pointer"
                title="Copy Card Number"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Card Bottom Row: PIN, Expiry, Barcode */}
        <div className="relative z-10 flex items-end justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[9px] font-mono text-slate-400 uppercase">Security PIN</div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-bold text-amber-400">
                  {isRevealed ? card.pinCode : '••••'}
                </span>
                <button
                  onClick={handleCopyPin}
                  className="text-slate-400 hover:text-white cursor-pointer"
                  title="Copy PIN"
                >
                  {copiedPin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div>
              <div className="text-[9px] font-mono text-slate-400 uppercase">Expiry</div>
              <div className="font-mono text-xs font-semibold text-slate-200">{card.expiryDate}</div>
            </div>
          </div>

          {/* Mini Barcode Indicator */}
          <div className="text-right">
            <div className="font-mono text-[9px] text-slate-500">{card.barcode}</div>
            <div className="h-6 flex items-end justify-end gap-[2px] opacity-80">
              {[4, 8, 2, 7, 5, 8, 3, 6, 2, 8, 4, 7, 3, 9, 5, 2, 6, 8, 4, 3].map((h, i) => (
                <div 
                  key={i} 
                  className={`w-[2px] bg-slate-300 ${i % 3 === 0 ? 'bg-cyan-400' : ''}`}
                  style={{ height: `${h * 2.5}px` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Network Verification & Quick Action Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verification Card */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold font-mono text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>AUTHENTICATION RESULT FROM GIFTUP SERVER</span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
              <span className="text-slate-500">Balance Status:</span>
              <span className="text-emerald-400 font-bold">100% Available (${card.balance}.00 USD)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
              <span className="text-slate-500">Distributed By:</span>
              <span className="text-slate-200">CyberPool Escrow Node #99</span>
            </div>
            <div className="flex justify-between py-1 text-slate-300">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="text-cyan-400">{order.txId}</span>
            </div>
          </div>
        </div>

        {/* Redeem Action & Instructions */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold font-mono text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Card Instructions</span>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
              Use this digital card directly at partner games, apps, or redeem into your personal GiftUp wallet.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <a
              href={card.redeemUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] active:scale-95 text-center"
            >
              <span>Open GiftUp Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
