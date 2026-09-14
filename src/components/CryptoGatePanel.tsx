// ==============================================================================
// CYBERPOOL CRYPTOGATE PANEL — cổng nạp crypto multi-network direct-to-wallet
//
// Luồng:
//  1. User chọn mạng (TRON/BSC/POLYGON/SOLANA/LTC) + nhập số tiền VNĐ
//  2. Server tạo intent với SỐ COIN DUY NHẤT (6 số thập phân) — user chuyển
//     ĐÚNG số coin đó vào đúng ví mạng
//  3. Scanner on-chain tự phát hiện + tự cộng ví (hoặc user dán TxID verify ngay)
//
// Không hardcode ví: mọi địa chỉ lấy từ GET /wallet/crypto-gate/networks
// (admin cấu hình qua systemConfig). Mạng chưa cấu hình → disabled, fail-closed.
// ==============================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { Coins, Copy, Check, Loader2, RefreshCw, AlertTriangle, Search, Wallet } from 'lucide-react';
import { walletApi } from '../api/wallet';
import { formatCurrency } from '../utils/formatters';
import { CurrencyCode } from '../types';

interface CryptoGateNetwork {
  network: string;
  coin: string;
  address: string;
  configured: boolean;
  minConfirmations: number;
}

interface CryptoGateIntent {
  id: string;
  network: string;
  address: string;
  amountCrypto: number;
  amountVnd: number;
  coin: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  txHash?: string;
  creditedVnd?: number;
}

interface Props {
  currency: CurrencyCode;
  userBalance: number;
  onDepositSuccess?: (amount: number, method: string, txCode?: string) => void;
  showToast?: (msg: string, type?: string) => void;
}

const NETWORK_META: Record<string, { label: string; color: string; icon: string }> = {
  TRON: { label: 'TRON (TRC20)', color: 'border-rose-500/50 text-rose-300 bg-rose-950/30', icon: 'TRX' },
  BSC: { label: 'BNB Chain (BEP20)', color: 'border-amber-500/50 text-amber-300 bg-amber-950/30', icon: 'BSC' },
  POLYGON: { label: 'Polygon', color: 'border-purple-500/50 text-purple-300 bg-purple-950/30', icon: 'POL' },
  SOLANA: { label: 'Solana', color: 'border-cyan-500/50 text-cyan-300 bg-cyan-950/30', icon: 'SOL' },
  LTC: { label: 'Litecoin', color: 'border-blue-500/50 text-blue-300 bg-blue-950/30', icon: 'LTC' }
};

export const CryptoGatePanel: React.FC<Props> = ({ currency, userBalance, onDepositSuccess, showToast }) => {
  const [networks, setNetworks] = useState<CryptoGateNetwork[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [binanceId, setBinanceId] = useState('');
  const [usdRate, setUsdRate] = useState(25400);
  const [ltcRate, setLtcRate] = useState(2150000);
  const [ttlMinutes, setTtlMinutes] = useState(30);
  const [loading, setLoading] = useState(true);

  const [selectedNetwork, setSelectedNetwork] = useState<string>('TRON');
  const [amountVnd, setAmountVnd] = useState<number>(100000);
  const [intent, setIntent] = useState<CryptoGateIntent | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [txHash, setTxHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const loadNetworks = useCallback(async () => {
    try {
      const res = await walletApi.getCryptoGateNetworks();
      if (res.success && res.data) {
        setEnabled(res.data.enabled);
        setNetworks(res.data.networks || []);
        setBinanceId(res.data.binanceId || '');
        setUsdRate(res.data.usdToVndRate);
        setLtcRate(res.data.ltcRate);
        setTtlMinutes(res.data.orderTtlMinutes);
        // Chọn mạng khả dụng đầu tiên làm mặc định
        const firstOk = (res.data.networks || []).find((n: CryptoGateNetwork) => n.configured);
        if (firstOk) setSelectedNetwork(prev => (networks.length === 0 ? firstOk.network : prev));
      }
    } catch (e: any) {
      setError(e?.message || 'Không tải được cấu hình cổng crypto.');
    } finally {
      setLoading(false);
    }
  }, [networks.length]);

  useEffect(() => { loadNetworks(); }, [loadNetworks]);

  // Poll trạng thái intent (scanner tự cộng tiền nền — UI phải tự refresh)
  useEffect(() => {
    if (!intent || intent.status !== 'PENDING') return;
    const iv = setInterval(async () => {
      try {
        const res = await walletApi.getMyCryptoGateIntents();
        if (res.success && res.data) {
          const fresh = (res.data.intents || []).find((i: CryptoGateIntent) => i.id === intent.id);
          if (fresh && fresh.status !== intent.status) {
            setIntent(fresh);
            if (fresh.status === 'COMPLETED') {
              const credited = fresh.creditedVnd || fresh.amountVnd;
              showToast?.(`Đã nhận ${fresh.amountCrypto} ${fresh.coin} — cộng +${formatCurrency(credited, currency)} vào ví!`, 'success');
              onDepositSuccess?.(credited, `CryptoGate ${fresh.coin} (${fresh.network})`, fresh.txHash);
            }
          }
        }
      } catch { /* ignore poll error */ }
    }, 8000);
    return () => clearInterval(iv);
  }, [intent, currency, onDepositSuccess, showToast]);

  // Đếm ngược TTL
  useEffect(() => {
    if (!intent || intent.status !== 'PENDING') { setSecondsLeft(0); return; }
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(intent.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) setIntent(prev => prev ? { ...prev, status: 'EXPIRED' } : prev);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [intent]);

  const handleCreate = async () => {
    setError(null);
    setVerifyMsg(null);
    if (!amountVnd || amountVnd < 10000) {
      setError('Số tiền nạp tối thiểu là 10.000đ.');
      return;
    }
    setCreating(true);
    try {
      const res = await walletApi.createCryptoGateIntent({ network: selectedNetwork, amount: amountVnd });
      if (res.success && res.data?.intent) {
        setIntent(res.data.intent as CryptoGateIntent);
        setTxHash('');
      } else {
        setError(res.error || 'Không tạo được lệnh nạp.');
      }
    } catch (e: any) {
      setError(e?.message || 'Lỗi mạng khi tạo lệnh nạp.');
    } finally {
      setCreating(false);
    }
  };

  const handleVerifyTx = async () => {
    setVerifyMsg(null);
    const hash = txHash.trim();
    if (!hash || hash.length < 20) {
      setVerifyMsg({ ok: false, text: 'TxID không hợp lệ (quá ngắn).' });
      return;
    }
    setVerifying(true);
    try {
      const res = await walletApi.verifyCryptoGateTx({ txHash: hash, network: intent?.network || selectedNetwork });
      if (res.success) {
        setVerifyMsg({ ok: true, text: res.data?.message || 'Xác minh thành công!' });
        // Refresh intent + balance
        const listRes = await walletApi.getMyCryptoGateIntents();
        if (listRes.success && listRes.data) {
          const fresh = (listRes.data.intents || []).find((i: CryptoGateIntent) => i.id === intent?.id);
          if (fresh) setIntent(fresh as CryptoGateIntent);
        }
        if (res.data?.creditedVnd) onDepositSuccess?.(res.data.creditedVnd, `CryptoGate ${intent?.coin || 'USDT'} (${intent?.network || selectedNetwork})`, hash);
      } else {
        setVerifyMsg({ ok: false, text: res.error || 'Xác minh thất bại.' });
      }
    } catch (e: any) {
      setVerifyMsg({ ok: false, text: e?.message || 'Lỗi mạng khi xác minh.' });
    } finally {
      setVerifying(false);
    }
  };

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 1800);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải cổng crypto...
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <div className="text-sm font-bold text-amber-300">Cổng nạp Crypto đang tạm khóa</div>
        <div className="text-xs text-slate-400 mt-1">Vui lòng thử lại sau hoặc liên hệ hỗ trợ.</div>
      </div>
    );
  }

  const configuredNetworks = networks.filter(n => n.configured);
  const netMeta = (n: string) => NETWORK_META[n] || { label: n, color: 'border-slate-600 text-slate-300 bg-slate-900', icon: n };

  return (
    <div className="space-y-4">
      {/* ===== BƯỚC 1: chọn mạng + số tiền ===== */}
      {!intent && (
        <>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="text-[11px] font-mono text-slate-400 uppercase font-bold">1. Chọn mạng chuyển khoản</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {networks.map(n => {
                const meta = netMeta(n.network);
                return (
                  <button
                    key={n.network}
                    disabled={!n.configured}
                    onClick={() => setSelectedNetwork(n.network)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      selectedNetwork === n.network
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        : n.configured
                          ? 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                          : 'border-slate-800 bg-slate-950/40 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black ${meta.color}`}>{meta.icon}</span>
                      <span className="text-xs font-bold text-white">{meta.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                      {n.configured ? `${n.coin} • ≥${n.minConfirmations} conf` : 'Chưa cấu hình'}
                    </div>
                  </button>
                );
              })}
            </div>
            {configuredNetworks.length === 0 && (
              <div className="text-xs text-rose-300 font-mono">⚠ Chưa có mạng nào được cấu hình ví nhận. Liên hệ quản trị.</div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="text-[11px] font-mono text-slate-400 uppercase font-bold">2. Số tiền nạp (VNĐ)</div>
            <input
              type="number"
              min={10000}
              step={10000}
              value={amountVnd}
              onChange={e => setAmountVnd(Number(e.target.value))}
              className="w-full bg-black/50 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2.5 text-sm font-mono text-white outline-none"
            />
            <div className="flex gap-1.5 flex-wrap">
              {[50000, 100000, 200000, 500000, 1000000].map(v => (
                <button key={v} onClick={() => setAmountVnd(v)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold border ${amountVnd === v ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  {formatCurrency(v, currency)}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Tỷ giá tham chiếu: 1 USDT ≈ {formatCurrency(usdRate, currency)} • 1 LTC ≈ {formatCurrency(ltcRate, currency)}
              {binanceId && <span> • Binance ID: <span className="text-amber-300 font-bold">{binanceId}</span> (chuyển nội bộ qua Binance Pay, dùng tab Binance)</span>}
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">✗ {error}</div>
          )}

          <button
            onClick={handleCreate}
            disabled={creating || configuredNetworks.length === 0 || !networks.find(n => n.network === selectedNetwork)?.configured}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-black font-black font-mono text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
            {creating ? 'ĐANG TẠO LỆNH...' : 'TẠO LỆNH NẠP CRYPTO'}
          </button>
        </>
      )}

      {/* ===== BƯỚC 2: thông tin chuyển khoản ===== */}
      {intent && (
        <div className="space-y-3">
          {intent.status === 'PENDING' && (
            <>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30">
                <span className="text-xs font-mono text-cyan-300">
                  Chuyển <b className="text-white">CHÍNH XÁC</b> số {intent.coin} bên dưới vào ví {netMeta(intent.network).label} — sai số hệ thống sẽ không nhận diện được giao dịch!
                </span>
                <span className={`text-sm font-mono font-black ${secondsLeft < 300 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}>
                  {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 space-y-3">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Số {intent.coin} cần chuyển (duy nhất cho lệnh này)</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2.5 py-2 rounded-lg bg-black/60 border border-emerald-500/40 text-emerald-300 font-mono text-base font-black">
                      {intent.amountCrypto} {intent.coin}
                    </code>
                    <button onClick={() => copy(String(intent.amountCrypto), 'amount')}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
                      {copied === 'amount' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Địa chỉ ví {netMeta(intent.network).label}</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2.5 py-2 rounded-lg bg-black/60 border border-slate-700 text-cyan-300 font-mono text-[11px] break-all">
                      {intent.address}
                    </code>
                    <button onClick={() => copy(intent.address, 'addr')}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0">
                      {copied === 'addr' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      // CYBERPOOL: QR nhúng SỐ LẺ DUY NHẤT + memo reference để khách
                      // chuyển ĐÚNG số coin của đơn (10.000023 chứ không phải 10.00)
                      // → hệ thống match chính xác, không cần memo chung.
                      // URI scheme theo chuẩn từng chain; EVM (BSC/Polygon) không có
                      // URI chuẩn cho ERC20 amount → vẫn show số lẻ to + copy.
                      intent.coin === 'LTC'
                        ? `litecoin:${intent.address}?amount=${intent.amountCrypto}&message=CG${intent.id.replace(/[^A-Za-z0-9]/g, '')}`
                        : intent.network === 'TRON'
                          ? `tron:${intent.address}?amount=${intent.amountCrypto}&memo=CG${intent.id.replace(/[^A-Za-z0-9]/g, '')}`
                          : intent.network === 'SOLANA'
                            ? `solana:${intent.address}?amount=${intent.amountCrypto}&memo=CG${intent.id.replace(/[^A-Za-z0-9]/g, '')}`
                            : intent.address
                    )}`}
                    alt="QR địa chỉ ví"
                    className="w-40 h-40 rounded-lg border border-slate-700 bg-white p-1"
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-mono text-center">
                  Hệ thống TỰ ĐỘNG phát hiện giao dịch on-chain mỗi 30s và cộng ví khi đủ xác nhận (≥{networks.find(n => n.network === intent.network)?.minConfirmations || '?'} blocks). Không cần thao tác thêm.
                </div>
              </div>

              {/* Verify thủ công bằng TxID */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-[11px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" /> Đã chuyển xong? Dán TxID để kiểm tra ngay
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={txHash}
                    onChange={e => setTxHash(e.target.value)}
                    placeholder="Transaction Hash / TxID..."
                    className="flex-1 bg-black/50 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none"
                  />
                  <button onClick={handleVerifyTx} disabled={verifying}
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold text-xs font-mono flex items-center gap-1.5">
                    {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    KIỂM TRA
                  </button>
                </div>
                {verifyMsg && (
                  <div className={`p-2 rounded-lg text-xs font-mono border ${verifyMsg.ok ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
                    {verifyMsg.ok ? '✓' : '✗'} {verifyMsg.text}
                  </div>
                )}
              </div>
            </>
          )}

          {intent.status === 'COMPLETED' && (
            <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-2">
              <Check className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-sm font-black text-emerald-300 font-mono">NẠP THÀNH CÔNG!</div>
              <div className="text-xs text-slate-300 font-mono">
                Đã nhận {intent.amountCrypto} {intent.coin} ({intent.network}) — Tx: {intent.txHash?.substring(0, 24)}...
              </div>
              <div className="text-lg font-black text-emerald-400 font-mono">
                +{formatCurrency(intent.creditedVnd || intent.amountVnd, currency)}
              </div>
              <button onClick={() => setIntent(null)}
                className="mt-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold">
                Tạo lệnh nạp khác
              </button>
            </div>
          )}

          {intent.status === 'EXPIRED' && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
              <div className="text-sm font-bold text-rose-300 font-mono">Lệnh nạp đã hết hạn ({ttlMinutes} phút)</div>
              <div className="text-xs text-slate-400">
                Nếu bạn ĐÃ chuyển tiền: gửi TxID cho hỗ trợ kèm mã lệnh <code className="text-cyan-300">{intent.id}</code> — tiền đã vào ví shop sẽ được cộng thủ công.
              </div>
              <button onClick={() => setIntent(null)}
                className="mt-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold">
                Tạo lệnh mới
              </button>
            </div>
          )}
        </div>
      )}

      {/* Số dư hiện tại */}
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-cyan-400" /> Số dư ví hiện tại
        </span>
        <span className="text-sm font-black font-mono text-emerald-400">{formatCurrency(userBalance, currency)}</span>
        <button onClick={() => { loadNetworks(); }} title="Làm mới" className="p-1 text-slate-400 hover:text-cyan-300">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
