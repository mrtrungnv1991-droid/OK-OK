import React, { useState, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Flame, 
  Gift, 
  Trophy, 
  RotateCw, 
  Key, 
  Zap, 
  CheckCircle2, 
  Coins,
  History,
  AlertCircle
} from 'lucide-react';
import { UserProfile, WheelPrize, WheelSpinRecord } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTranslation } from '../i18n';
import { useUI } from '../contexts/UIContext';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSpinSuccess: (cost: number, prize: WheelPrize) => void;
  onOpenWallet: () => void;
}

const WHEEL_PRIZES: WheelPrize[] = [
  {
    id: 'p1',
    name: 'Key Cyberpunk 2077 AAA',
    type: 'key',
    value: 650000,
    itemDescription: 'Steam Key Cyberpunk 2077 Ultimate Edition',
    deliveredCode: 'CYBER-PUNK-8899-STEAM',
    color: '#06b6d4',
    probability: 0.05
  },
  {
    id: 'p2',
    name: '+50,000 Wallet Cash',
    type: 'wallet_cash',
    value: 50000,
    itemDescription: 'Direct 50,000 cash added to wallet',
    color: '#10b981',
    probability: 0.20
  },
  {
    id: 'p3',
    name: '1,080 Diamonds Free Fire',
    type: 'game_diamonds',
    value: 120000,
    itemDescription: '1,080 Diamonds Free Fire ID Package',
    deliveredCode: 'FF-DIA-1080-VAL77',
    color: '#f59e0b',
    probability: 0.15
  },
  {
    id: 'p4',
    name: 'E-GiftUp Card 100,000',
    type: 'giftup_card',
    value: 100000,
    itemDescription: 'GiftUp Multi-use Card',
    deliveredCode: 'GIFTUP-9922-8811',
    color: '#8b5cf6',
    probability: 0.10
  },
  {
    id: 'p5',
    name: '+20,000 Wallet Cash',
    type: 'wallet_cash',
    value: 20000,
    itemDescription: '100% spin cost cashback',
    color: '#3b82f6',
    probability: 0.25
  },
  {
    id: 'p6',
    name: '365 Game Gems Package',
    type: 'game_diamonds',
    value: 100000,
    itemDescription: 'Direct reload gems via UID',
    deliveredCode: 'LQ-QH-365-AUTO',
    color: '#ec4899',
    probability: 0.10
  },
  {
    id: 'p7',
    name: 'Voucher 50% Off Pool',
    type: 'voucher',
    value: 150000,
    itemDescription: '50% discount coupon for pooled orders',
    deliveredCode: 'VOUCHER-CYBER-50PCT',
    color: '#eab308',
    probability: 0.10
  },
  {
    id: 'p8',
    name: '+100,000 Super Jackpot',
    type: 'wallet_cash',
    value: 100000,
    itemDescription: 'Mini Jackpot instant +100,000',
    color: '#ef4444',
    probability: 0.05
  }
];

const SPIN_COST = 20000;

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  isOpen,
  onClose,
  user,
  onSpinSuccess,
  onOpenWallet
}) => {
  const { t } = useTranslation();
  const { showToast } = useUI();
  if (!isOpen) return null;

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const [recentWinners, setRecentWinners] = useState<WheelSpinRecord[]>([
    { id: 'w1', user: 'HoangLong99', prizeName: 'Key Cyberpunk 2077 AAA', prizeType: 'key', value: 650000, timestamp: '1m ago', txId: 'TX-SPIN-991' },
    { id: 'w2', user: 'ThanhBao_Gamer', prizeName: '+100,000 Super Jackpot', prizeType: 'wallet_cash', value: 100000, timestamp: '3m ago', txId: 'TX-SPIN-990' },
    { id: 'w3', user: 'Viper_Cyber', prizeName: '1,080 Diamonds Free Fire', prizeType: 'game_diamonds', value: 120000, timestamp: '6m ago', txId: 'TX-SPIN-989' },
    { id: 'w4', user: 'MinhAnh_HN', prizeName: 'E-GiftUp Card 100,000', prizeType: 'giftup_card', value: 100000, timestamp: '8m ago', txId: 'TX-SPIN-988' }
  ]);

  const handleStartSpin = () => {
    if (user.walletBalance < SPIN_COST) {
      showToast(`Số dư ví không đủ ${formatCurrency(SPIN_COST, user.currency)} để quay!`, 'warning', {
        title: 'SỐ DƯ KHÔNG ĐỦ',
        action: { label: 'Nạp Tiền Ngay →', onClick: onOpenWallet }
      });
      onOpenWallet();
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setWonPrize(null);

    // Pick prize based on probabilities
    const rand = Math.random();
    let cumulative = 0;
    let selectedIndex = 0;
    for (let i = 0; i < WHEEL_PRIZES.length; i++) {
      cumulative += WHEEL_PRIZES[i].probability;
      if (rand <= cumulative) {
        selectedIndex = i;
        break;
      }
    }

    const prize = WHEEL_PRIZES[selectedIndex];
    const segmentAngle = 360 / WHEEL_PRIZES.length; // 45 deg per slice
    const extraSpins = 5 * 360; // 5 full rounds
    const prizeAngle = segmentAngle * selectedIndex + segmentAngle / 2;
    const finalAngle = rotationDegrees + extraSpins + (360 - (prizeAngle % 360));

    setRotationDegrees(finalAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(prize);
      onSpinSuccess(SPIN_COST, prize);

      // Add to winner list
      setRecentWinners(prev => [
        {
          id: `w-${Date.now()}`,
          user: user.name,
          prizeName: prize.name,
          prizeType: prize.type,
          value: prize.value,
          timestamp: 'Just now',
          txId: `TX-SPIN-${Math.floor(1000 + Math.random() * 9000)}`
        },
        ...prev.slice(0, 5)
      ]);
    }, 4500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#090c15] border border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.2)] overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-[#181105] to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950 border border-amber-500/40 text-amber-400 font-mono font-bold flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                  {t('nav.lucky_wheel')} & JACKPOT
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-500/30 uppercase">
                  100% WIN
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Steam Keys, Game Diamonds, GiftUp Cards & Wallet Balance
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Wheel Visual Column */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
            {/* Pointer / Needle */}
            <div className="absolute top-2 z-20 flex flex-col items-center">
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]"></div>
            </div>

            {/* Circular Roulette Wheel */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full border-4 border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.3)] bg-slate-950 p-2 overflow-hidden flex items-center justify-center">
              <div
                className="w-full h-full rounded-full relative transition-transform duration-[4500ms] cubic-bezier(0.15, 0.9, 0.2, 1)"
                style={{
                  transform: `rotate(${rotationDegrees}deg)`,
                  background: 'conic-gradient(#06b6d4 0deg 45deg, #10b981 45deg 90deg, #f59e0b 90deg 135deg, #8b5cf6 135deg 180deg, #3b82f6 180deg 225deg, #ec4899 225deg 270deg, #eab308 270deg 315deg, #ef4444 315deg 360deg)'
                }}
              >
                {/* Center Hub Overlay */}
                <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-slate-950 border-2 border-amber-400 flex items-center justify-center shadow-lg z-10">
                  <Flame className="w-7 h-7 text-amber-400 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Spin Action Controls */}
            <div className="mt-6 w-full max-w-sm flex flex-col items-center gap-3">
              <div className="flex items-center justify-between w-full text-xs font-mono text-slate-300 px-2">
                <span>{t('wallet.balance_available')}:</span>
                <span className="text-cyan-400 font-bold">{formatCurrency(user.walletBalance, user.currency)}</span>
              </div>

              <button
                onClick={handleStartSpin}
                disabled={isSpinning}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-black font-mono font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.5)] disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSpinning ? (
                  <>
                    <RotateCw className="w-5 h-5 animate-spin" />
                    <span>{t('common.loading')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>{t('nav.lucky_wheel')} ({formatCurrency(SPIN_COST, user.currency)} / spin)</span>
                  </>
                )}
              </button>
            </div>

            {/* Won Prize Notification Banner */}
            {wonPrize && (
              <div className="mt-4 w-full p-4 rounded-xl bg-gradient-to-r from-amber-950/80 via-yellow-950/80 to-amber-950/80 border border-amber-400 shadow-lg text-center space-y-1.5 animate-bounce">
                <div className="text-[11px] font-mono uppercase text-amber-300 font-bold flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>{t('common.success')}</span>
                </div>
                <div className="text-base font-mono font-black text-white">{wonPrize.name}</div>
                <div className="text-xs text-slate-300 font-mono">{wonPrize.itemDescription}</div>
                {wonPrize.deliveredCode && (
                  <div className="text-xs font-mono bg-black/60 px-3 py-1 rounded inline-block text-cyan-300 border border-cyan-500/40">
                    Code: <strong>{wonPrize.deliveredCode}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Prizes Matrix & Live Feed */}
          <div className="lg:col-span-5 space-y-4">
            {/* Prize list preview */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-white border-b border-slate-800 pb-2">
                <span>{t('common.info')}</span>
                <span className="text-amber-400">8 VIP PRIZES</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {WHEEL_PRIZES.map((pz) => (
                  <div key={pz.id} className="p-2 rounded bg-black/40 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pz.color }}></span>
                      <span className="text-slate-200">{pz.name}</span>
                    </div>
                    <span className="text-cyan-400 font-bold">{formatCurrency(pz.value, user.currency)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Feed of Recent Winners */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <span>{t('wallet.transaction_history')}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Realtime Live</span>
              </div>

              <div className="space-y-2">
                {recentWinners.map((win) => (
                  <div key={win.id} className="p-2 rounded bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-amber-400 font-bold">{win.user}</span>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{win.prizeName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold">+{formatCurrency(win.value, user.currency)}</div>
                      <div className="text-[10px] text-slate-500">{win.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
