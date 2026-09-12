import React, { useState, useRef, useEffect } from 'react';
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
import { UserProfile, WheelPrize, WheelSpinRecord, CurrencyCode } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTranslation } from '../i18n';
import { useUI } from '../contexts/UIContext';
import { walletApi } from '../api/wallet';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  currency?: CurrencyCode;
  prizes?: WheelPrize[];
  onSpinSuccess: (cost: number, prize: WheelPrize) => void;
  onOpenWallet: () => void;
}

// CYBERPOOL FIX (#5 frontend audit): bảng giải thưởng cũ hardcode
// deliveredCode GIẢ ('CYBER-PUNK-8899-STEAM'...) trong bundle công khai và
// prize được chọn bằng Math.random client-side, phí quay không bao giờ bị trừ.
// Giờ: bảng giải thưởng + kết quả quay + lịch sử trúng đều đến TỪ SERVER
// (walletApi.getWheelConfig / spinWheel / getWheelRecentWinners). Hằng số dưới
// đây chỉ là fallback hiển thị khớp default server (KHÔNG chứa code giả).
const DEFAULT_WHEEL_PRIZES: WheelPrize[] = [
  { id: 'p-cash-50', name: '+50,000 Wallet Cash', type: 'wallet_cash', value: 50000, itemDescription: 'Cộng 50.000đ trực tiếp vào ví', color: '#10b981', probability: 0.08 },
  { id: 'p-cash-20', name: '+20,000 Wallet Cash', type: 'wallet_cash', value: 20000, itemDescription: 'Hoàn 100% phí quay', color: '#3b82f6', probability: 0.17 },
  { id: 'p-cash-10', name: '+10,000 Wallet Cash', type: 'wallet_cash', value: 10000, itemDescription: 'Cộng 10.000đ vào ví', color: '#06b6d4', probability: 0.25 },
  { id: 'p-voucher', name: 'Voucher CYBERWHEEL 10%', type: 'voucher', value: 10, itemDescription: 'Voucher giảm 10% (7 ngày, 1 lần dùng)', color: '#eab308', probability: 0.10 },
  { id: 'p-badluck', name: 'Chúc bạn may mắn lần sau', type: 'bad_luck', value: 0, itemDescription: 'Không trúng — thử lại lần sau!', color: '#64748b', probability: 0.40 }
];

const DEFAULT_SPIN_COST = 20000;

const PRIZE_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#eab308', '#ef4444'];

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  isOpen,
  onClose,
  user,
  currency = 'VND',
  prizes,
  onSpinSuccess,
  onOpenWallet
}) => {
  const { t } = useTranslation();
  const { showToast } = useUI();

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const [wonCode, setWonCode] = useState<string | undefined>(undefined);
  const [recentWinners, setRecentWinners] = useState<WheelSpinRecord[]>([]);

  // CYBERPOOL FIX: prizes + spinCost lấy từ server config (props override được)
  const [serverPrizes, setServerPrizes] = useState<WheelPrize[]>(prizes && prizes.length > 0 ? prizes : DEFAULT_WHEEL_PRIZES);
  const [spinCost, setSpinCost] = useState<number>(DEFAULT_SPIN_COST);

  useEffect(() => {
    if (!isOpen) return;
    // Tải bảng giải thưởng + lịch sử trúng THẬT từ server
    walletApi.getWheelConfig().then(res => {
      if (res.success && res.data?.prizes?.length) {
        const mapped: WheelPrize[] = res.data.prizes.map((p: any, idx: number) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          value: p.value,
          color: PRIZE_COLORS[idx % PRIZE_COLORS.length],
          probability: p.probability
        }));
        if (!prizes || prizes.length === 0) setServerPrizes(mapped);
        setSpinCost(res.data.spinCost || DEFAULT_SPIN_COST);
      }
    }).catch(() => {});
    walletApi.getWheelRecentWinners().then(res => {
      if (res.success && Array.isArray(res.data?.winners)) {
        setRecentWinners(res.data.winners.map((w: any) => ({
          id: w.id,
          user: w.user,
          prizeName: w.prizeName,
          prizeType: w.prizeType,
          value: w.value,
          timestamp: w.timestamp ? new Date(w.timestamp).toLocaleString('vi-VN') : '',
          txId: w.txId || ''
        })));
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartSpin = async () => {
    if (user.walletBalance < spinCost) {
      showToast(`Số dư ví không đủ ${formatCurrency(spinCost, user.currency)} để quay!`, 'warning', {
        title: 'SỐ DƯ KHÔNG ĐỦ',
        action: { label: 'Nạp Tiền Ngay →', onClick: onOpenWallet }
      });
      onOpenWallet();
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setWonPrize(null);
    setWonCode(undefined);

    // CYBERPOOL FIX (#5 frontend audit): KẾT QUẢ ĐẾN TỪ SERVER — server trừ
    // phí quay qua ledger, quay bằng crypto RNG, trả thưởng thật. Client chỉ
    // quay animation tới ô server đã chọn. Trước đây: Math.random client,
    // không trừ phí, code trúng thưởng hardcode giả.
    let serverResult: any = null;
    try {
      const res = await walletApi.spinWheel();
      if (res.success && res.data?.prize) {
        serverResult = res.data;
      } else {
        setIsSpinning(false);
        showToast(res.error || 'Không thể thực hiện lượt quay. Vui lòng thử lại.', 'error', {
          title: 'QUAY THẤT BẠI'
        });
        return;
      }
    } catch (err: any) {
      setIsSpinning(false);
      showToast(err?.message || 'Lỗi kết nối khi quay.', 'error', { title: 'LỖI HỆ THỐNG' });
      return;
    }

    const wonServerPrize = serverResult.prize;
    const selectedIndex = Math.max(0, serverPrizes.findIndex(p => p.id === wonServerPrize.id));
    const prize: WheelPrize = serverPrizes[selectedIndex] || {
      id: wonServerPrize.id,
      name: wonServerPrize.name,
      type: wonServerPrize.type,
      value: wonServerPrize.value,
      color: PRIZE_COLORS[selectedIndex % PRIZE_COLORS.length],
      probability: 0
    };

    const segmentAngle = 360 / Math.max(1, serverPrizes.length);
    const extraSpins = 5 * 360; // 5 full rounds
    const prizeAngle = segmentAngle * selectedIndex + segmentAngle / 2;
    const finalAngle = rotationDegrees + extraSpins + (360 - (prizeAngle % 360));

    setRotationDegrees(finalAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(prize);
      setWonCode(wonServerPrize.deliveredCode);
      onSpinSuccess(spinCost, prize);

      // Lịch sử người trúng: reload từ server (record thật, không bịa txId)
      walletApi.getWheelRecentWinners().then(res => {
        if (res.success && Array.isArray(res.data?.winners)) {
          setRecentWinners(res.data.winners.map((w: any) => ({
            id: w.id,
            user: w.user,
            prizeName: w.prizeName,
            prizeType: w.prizeType,
            value: w.value,
            timestamp: w.timestamp ? new Date(w.timestamp).toLocaleString('vi-VN') : '',
            txId: w.txId || ''
          })));
        }
      }).catch(() => {});
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
                  SERVER RNG
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
                    <span>{t('nav.lucky_wheel')} ({formatCurrency(spinCost, user.currency)} / spin)</span>
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
                {/* CYBERPOOL FIX: hiển thị code THẬT do server trả (voucher phát
                    hành / key từ inventory) — không còn code hardcode giả */}
                {wonCode && (
                  <div className="text-xs font-mono bg-black/60 px-3 py-1 rounded inline-block text-cyan-300 border border-cyan-500/40">
                    Code: <strong>{wonCode}</strong>
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
                <span className="text-amber-400">{serverPrizes.length} PRIZES</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {serverPrizes.map((pz) => (
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
