// ==============================================================================
// CYBERPOOL CRYPTOGATE — Direct-to-wallet crypto deposit gateway
//
// Mô hình: shop sở hữu ví nhận trên 5 mạng (TRON / BSC / POLYGON / SOLANA / LTC)
// + Binance ID. Mỗi lệnh nạp được gán một SỐ COIN DUY NHẤT (unique amount với
// 6 số thập phân ngẫu nhiên) — tiền về đúng ví + đúng số = tự động cộng ví,
// không cần memo. Đây là cơ chế chuẩn của các non-custodial gateway (amount
// uniqueness thay cho attribution bằng memo).
//
// Xác thực on-chain qua API explorer CÔNG KHAI, kiểm tra nghiêm ngặt:
//   - TRON:    apilist.tronscanapi.com (TRC20 transfer list + transaction-info)
//   - BSC:     api.bscscan.com tokentx (USDT-BSC 18 decimals)
//   - POLYGON: api.polygonscan.com tokentx (USDT-Polygon 6 decimals)
//   - SOLANA:  api.mainnet-beta.solana.com RPC jsonParsed (USDT SPL mint)
//   - LTC:     api.blockchair.com (outputs → recipient)
//
// Fail-closed: mạng chưa cấu hình địa chỉ → từ chối tạo lệnh/không quét.
// Anti-replay: txHash đi qua GatewayVerificationService.isAlreadyRedeemed +
// IdempotencyService (persist disk). Tiền chỉ cộng sau đủ confirmations tối
// thiểu (admin chỉnh, mặc định theo mạng).
//
// LƯU Ý: Merchant ID/Api Key của nhà cung cấp (nếu có) được lưu trong
// systemConfig nhưng KHÔNG được dùng để giả lập credit — nguồn sự thật duy
// nhất là blockchain. Khi có tài liệu API chính thức của nhà cung cấp, nối
// thêm create-order/webhook vào đây (cryptoGateApiBase đã sẵn slot).
// ==============================================================================
import { db } from '../db/store';
import { LedgerService } from './ledgerService';
import { GatewayVerificationService } from './gatewayVerificationService';

export type CryptoGateNetwork = 'TRON' | 'BSC' | 'POLYGON' | 'SOLANA' | 'LTC';

export interface CryptoGateIntent {
  id: string;
  userId: string;
  network: CryptoGateNetwork;
  address: string;
  amountCrypto: number;
  amountVnd: number;
  coin: 'USDT' | 'LTC';
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
  txHash?: string;
  creditedVnd?: number;
  createdAt: string;
  expiresAt: string;
}

interface OnChainTransfer {
  txHash: string;
  toAddress: string;
  amount: number;          // đơn vị coin (đã chia decimals)
  confirmations: number;
  timestampMs: number;
  blockNumber?: number;
  signature?: string;      // solana
}

const NETWORK_COIN: Record<CryptoGateNetwork, 'USDT' | 'LTC'> = {
  TRON: 'USDT', BSC: 'USDT', POLYGON: 'USDT', SOLANA: 'USDT', LTC: 'LTC'
};

// Số xác nhận tối thiểu mặc định theo mạng (finality an toàn)
const DEFAULT_MIN_CONFIRMATIONS: Record<CryptoGateNetwork, number> = {
  TRON: 19,      // TRON SR finality
  BSC: 15,
  POLYGON: 64,   // ~2 phút reorg-safe
  SOLANA: 32,    // finalized
  LTC: 12
};

const USDT_CONTRACTS: Record<string, string> = {
  TRON: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',                     // 6 decimals
  BSC: '0x55d398326f99059ff775485246999027b3197955',                // 18 decimals
  POLYGON: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'             // 6 decimals
};
const USDT_SOLANA_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'; // 6 decimals

const UA = 'CyberPool-CryptoGate/1.0';

function nowIso() { return new Date().toISOString(); }

// TRON không trả block_number trong trc20 list → dùng finality theo thời gian.
// 19 SR block ≈ 57s là điểm bất thuận nghịch (irreversible) của TRON.
const TRON_FINALITY_MS = 60_000;

// EVM RPC công khai đã VERIFY chạy được (2026-09): publicnode.
// bscscan V1 đã deprecated, etherscan V2 chặn free-tier cho BSC/Polygon,
// dataseed trả null cho eth_getLogs, polygon-rpc.com 401.
const BSC_RPC = 'https://bsc-rpc.publicnode.com';
const POLYGON_RPC = 'https://polygon-bor-rpc.publicnode.com';
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

// USDT decimals theo mạng (BSC USDT = 18, Polygon/TRON/Solana USDT = 6)
const USDT_DECIMALS: Record<string, number> = { TRON: 6, BSC: 18, POLYGON: 6, SOLANA: 6 };


function configuredAddress(network: CryptoGateNetwork): string {
  const cfg = db.systemConfig || {};
  switch (network) {
    case 'TRON': return String(cfg.cryptoGateTronAddress || '').trim();
    case 'BSC': return String(cfg.cryptoGateBscAddress || '').trim();
    case 'POLYGON': return String(cfg.cryptoGatePolygonAddress || '').trim();
    case 'SOLANA': return String(cfg.cryptoGateSolanaAddress || '').trim();
    case 'LTC': return String(cfg.cryptoGateLtcAddress || '').trim();
  }
}

function minConfirmations(network: CryptoGateNetwork): number {
  const custom = Number((db.systemConfig || {})[`cryptoGateMinConf${network.charAt(0) + network.slice(1).toLowerCase()}`]);
  return Number.isFinite(custom) && custom > 0 ? Math.floor(custom) : DEFAULT_MIN_CONFIRMATIONS[network];
}

export class CryptoGateService {
  // ==========================================================================
  // 1. CREATE DEPOSIT INTENT — gán số coin duy nhất cho lệnh nạp
  // ==========================================================================
  public static createDepositIntent(params: {
    userId: string;
    network: CryptoGateNetwork;
    amountVnd: number;
  }): { success: boolean; intent?: CryptoGateIntent; error?: string } {
    const { userId, network, amountVnd } = params;

    if (!(db.systemConfig?.cryptoGateEnabled)) {
      return { success: false, error: 'Cổng nạp crypto đang tạm khóa.' };
    }
    const user = db.users.get(userId);
    if (!user) return { success: false, error: 'Tài khoản không tồn tại.' };

    const vnd = Math.round(Number(amountVnd) || 0);
    const minDeposit = Number(db.systemConfig?.minDepositAmount) || 10000;
    if (!Number.isFinite(vnd) || vnd < minDeposit) {
      return { success: false, error: `Số tiền nạp tối thiểu là ${minDeposit.toLocaleString('vi-VN')}đ.` };
    }

    const address = configuredAddress(network);
    if (!address) {
      return { success: false, error: `Mạng ${network} chưa được cấu hình ví nhận. Vui lòng chọn mạng khác hoặc liên hệ quản trị.` };
    }

    const coin = NETWORK_COIN[network];
    const usdRate = Number(db.systemConfig?.usdToVndRate) || 25400;
    const ltcRate = Number(db.systemConfig?.cryptoLtcRate) || 2150000;
    const rate = coin === 'USDT' ? usdRate : ltcRate;

    // Số coin gốc (4 chữ số có nghĩa) + đuôi ngẫu nhiên 6 chữ số thập phân
    // đảm bảo DUY NHẤT trong số các lệnh PENDING → match không cần memo.
    const decimals = Number(db.systemConfig?.cryptoGateUniqueDecimals) || 6;
    const baseCrypto = vnd / rate;

    let amountCrypto = 0;
    for (let attempt = 0; attempt < 50; attempt++) {
      // Đuôi ngẫu nhiên ở 2 chữ số thập phân cuối (5-6): 10..99 → không bao giờ .00
      const scale = Math.pow(10, decimals);
      const truncated = Math.floor(baseCrypto * scale) / scale;
      const tailUnit = 10 + Math.floor(Math.random() * 90); // 10..99
      const candidate = Math.round(truncated * scale - (Math.round(truncated * scale) % 100) + tailUnit) / scale;
      amountCrypto = Number(candidate.toFixed(decimals));

      // Chống trùng với intent PENDING cùng mạng + cùng số coin
      let clash = false;
      for (const it of db.cryptoGateIntents.values()) {
        if (it.status === 'PENDING' && it.network === network &&
            Math.round(it.amountCrypto * 1e8) === Math.round(amountCrypto * 1e8)) {
          clash = true;
          break;
        }
      }
      if (!clash && amountCrypto > 0) break;
    }
    if (!(amountCrypto > 0)) {
      return { success: false, error: 'Không tạo được mã nạp duy nhất, vui lòng thử lại.' };
    }

    const ttlMinutes = Number(db.systemConfig?.cryptoGateOrderTtlMinutes) || 30;
    const id = `CG-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const intent: CryptoGateIntent = {
      id,
      userId,
      network,
      address,
      amountCrypto,
      amountVnd: vnd,
      coin,
      status: 'PENDING',
      createdAt: nowIso(),
      expiresAt: new Date(Date.now() + ttlMinutes * 60_000).toISOString()
    };
    db.cryptoGateIntents.set(id, intent);
    db.saveSnapshot();
    return { success: true, intent };
  }

  // ==========================================================================
  // 2. ON-CHAIN SCANNERS — đọc giao dịch THẬT từ RPC/explorer công khai.
  //    ENDPOINTS đã VERIFY chạy được (2026-09): TronGrid, publicnode (BSC/
  //    Polygon), Solana mainnet RPC, BlockCypher (LTC). Các endpoint cũ
  //    (apilist.tronscanapi.com, api.bscscan.com V1, blockchair) đã chết/
  //    deprecated/rate-limit — KHÔNG dùng (dùng nhầm = gateway giả, không
  //    bao giờ thấy tiền về).
  // ==========================================================================
  private static async fetchJson(url: string, init?: RequestInit): Promise<any> {
    const res = await fetch(url, {
      ...init,
      headers: { 'User-Agent': UA, 'Content-Type': 'application/json', ...(init?.headers || {}) }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url.slice(0, 90)}`);
    return res.json();
  }

  /** JSON-RPC call (EVM / Solana) */
  private static async rpc(rpcUrl: string, method: string, params: any[]): Promise<any> {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
    });
    if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
    const j: any = await res.json();
    if (j.error) throw new Error(`RPC ${method}: ${j.error.message || JSON.stringify(j.error)}`);
    return j.result;
  }

  /** TRON: TRC20 transfers vào ví (TronGrid official) */
  public static async scanTron(address: string, sinceMs: number): Promise<OnChainTransfer[]> {
    const contract = USDT_CONTRACTS.TRON;
    const url = `https://api.trongrid.io/v1/accounts/${encodeURIComponent(address)}/transactions/trc20?only_to=true&contract_address=${contract}&limit=30`;
    const data = await this.fetchJson(url);
    const rows: any[] = data?.data || [];
    const out: OnChainTransfer[] = [];
    const now = Date.now();
    for (const r of rows) {
      if (String(r.to || '') !== address) continue;
      const ts = Number(r.block_timestamp || 0);
      if (ts && ts < sinceMs) continue;
      const decimals = Number(r.token_info?.decimals ?? USDT_DECIMALS.TRON);
      const amount = Number(r.value || 0) / Math.pow(10, decimals);
      if (!(amount > 0)) continue;
      // TronGrid trc20 list không kèm block number/confirmations. TRON đạt
      // finality (irreversible) sau ~19 SR block ≈ 57s → dùng mốc thời gian:
      // tx đã xác nhận on-chain + older hơn TRON_FINALITY_MS = coi như final.
      const ageMs = ts ? now - ts : 0;
      const isFinal = Boolean(ts) && ageMs >= TRON_FINALITY_MS;
      out.push({
        txHash: String(r.transaction_id || ''),
        toAddress: String(r.to),
        amount,
        // map thời gian finality sang "confirmations" để gate dùng chung ngưỡng
        confirmations: isFinal ? 27 : 0,
        timestampMs: ts,
        blockNumber: undefined
      });
    }
    return out;
  }

  /** EVM (BSC/Polygon): USDT Transfer logs vào ví qua eth_getLogs */
  private static async scanEvm(
    rpcUrl: string,
    address: string,
    contract: string,
    decimals: number,
    fromBlock: number,
    toBlock: number
  ): Promise<OnChainTransfer[]> {
    const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    const toPadded = '0x' + '0'.repeat(24) + address.toLowerCase().replace(/^0x/, '');
    const logs: any[] = await this.rpc(rpcUrl, 'eth_getLogs', [{
      fromBlock: '0x' + fromBlock.toString(16),
      toBlock: '0x' + toBlock.toString(16),
      address: contract,
      topics: [TRANSFER_TOPIC, null, toPadded]
    }]);
    const out: OnChainTransfer[] = [];
    for (const lg of (logs || [])) {
      const toAddr = '0x' + String(lg.topics?.[2] || '').slice(-40);
      if (toAddr.toLowerCase() !== address.toLowerCase()) continue;
      const amount = Number(BigInt(lg.data || '0x0')) / Math.pow(10, decimals);
      if (!(amount > 0)) continue;
      const blockNumber = parseInt(lg.blockNumber || '0x0', 16);
      const confirmations = toBlock >= blockNumber && blockNumber > 0 ? toBlock - blockNumber + 1 : 0;
      out.push({
        txHash: String(lg.transactionHash || ''),
        toAddress: toAddr,
        amount,
        confirmations,
        timestampMs: Number(lg.blockTimestamp || 0) * 1000,
        blockNumber
      });
    }
    return out;
  }

  public static async scanBsc(address: string, fromBlock: number): Promise<OnChainTransfer[]> {
    const head = parseInt(await this.rpc(BSC_RPC, 'eth_blockNumber', []), 16);
    // eth_getLogs giới hạn range trên RPC công khai → quét tối đa 5000 block/lần
    const start = fromBlock > 0 ? fromBlock : Math.max(0, head - 5000);
    const end = Math.min(head, start + 5000);
    return this.scanEvm(BSC_RPC, address, USDT_CONTRACTS.BSC, USDT_DECIMALS.BSC, start, end);
  }

  public static async scanPolygon(address: string, fromBlock: number): Promise<OnChainTransfer[]> {
    const head = parseInt(await this.rpc(POLYGON_RPC, 'eth_blockNumber', []), 16);
    const start = fromBlock > 0 ? fromBlock : Math.max(0, head - 5000);
    const end = Math.min(head, start + 5000);
    return this.scanEvm(POLYGON_RPC, address, USDT_CONTRACTS.POLYGON, USDT_DECIMALS.POLYGON, start, end);
  }

  /** SOLANA: RPC jsonParsed — chênh lệch SPL USDT balance của ví */
  public static async scanSolana(address: string, untilSig?: string): Promise<OnChainTransfer[]> {
    const sigParams: any = { limit: 20 };
    if (untilSig) sigParams.until = untilSig;
    const sigs: any[] = await this.rpc(SOLANA_RPC, 'getSignaturesForAddress', [address, sigParams]);
    if (!sigs || sigs.length === 0) return [];

    const statuses: any[] = (await this.rpc(SOLANA_RPC, 'getSignatureStatuses',
      [sigs.map((s: any) => s.signature), { searchTransactionHistory: false }]))?.value || [];

    const out: OnChainTransfer[] = [];
    for (let i = 0; i < sigs.length; i++) {
      const sig = sigs[i];
      const st = statuses[i];
      if (!st || st.err || st.confirmationStatus !== 'finalized') continue;
      // finalized trên Solana ≈ vượt xa ngưỡng 32 confirmations
      const confirmations = 64;

      let txDetail: any;
      try {
        txDetail = await this.rpc(SOLANA_RPC, 'getTransaction',
          [sig.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]);
      } catch { continue; }
      if (!txDetail?.meta || txDetail.meta.err) continue;

      const pre = (txDetail.meta.preTokenBalances || []).find((b: any) => b.mint === USDT_SOLANA_MINT && b.owner === address);
      const post = (txDetail.meta.postTokenBalances || []).find((b: any) => b.mint === USDT_SOLANA_MINT && b.owner === address);
      const preAmt = Number(pre?.uiTokenAmount?.uiAmount ?? 0);
      const postAmt = Number(post?.uiTokenAmount?.uiAmount ?? 0);
      const delta = postAmt - preAmt;
      if (delta > 0.0000005) {
        out.push({
          txHash: sig.signature,
          toAddress: address,
          amount: Number(delta.toFixed(6)),
          confirmations,
          timestampMs: Number(txDetail.blockTime || sig.blockTime || 0) * 1000,
          signature: sig.signature
        });
      }
    }
    return out;
  }

  /** LTC: BlockCypher — outputs chuyển vào ví */
  public static async scanLtc(address: string): Promise<OnChainTransfer[]> {
    const data = await this.fetchJson(
      `https://api.blockcypher.com/v1/ltc/main/addrs/${encodeURIComponent(address)}/full?limit=15&txlimit=15`
    );
    const txs: any[] = data?.txs || [];
    const out: OnChainTransfer[] = [];
    for (const tx of txs) {
      if (!tx || !Array.isArray(tx.outputs)) continue;
      for (const o of tx.outputs) {
        const addrs: string[] = o.addresses || [];
        if (!addrs.includes(address)) continue;
        const amount = Number(o.value || 0) / 1e8;
        if (!(amount > 0)) continue;
        out.push({
          txHash: String(tx.hash || ''),
          toAddress: address,
          amount,
          confirmations: Number(tx.confirmations || 0),
          timestampMs: tx.confirmed ? new Date(tx.confirmed).getTime() : Date.now(),
          blockNumber: Number(tx.block_height) || undefined
        });
      }
    }
    return out;
  }

  // ==========================================================================
  // 3. VERIFY TX BY HASH — user/admin dán TxID, xác minh trực tiếp
  // ==========================================================================
  public static async verifyTxByHash(params: {
    txHash: string;
    network: CryptoGateNetwork;
    userId: string;
    ipAddress?: string;
  }): Promise<{ success: boolean; message: string; creditedVnd?: number; intentId?: string }> {
    const cleanHash = String(params.txHash || '').trim();
    if (cleanHash.length < 20) {
      return { success: false, message: 'TxID không hợp lệ.' };
    }
    if (GatewayVerificationService.isAlreadyRedeemed(cleanHash)) {
      return { success: false, message: 'TxID này đã được hệ thống ghi nhận và cộng tiền trước đó (chống nạp trùng).' };
    }

    const address = configuredAddress(params.network);
    if (!address) {
      return { success: false, message: `Mạng ${params.network} chưa được cấu hình ví nhận.` };
    }

    // Lấy transfer on-chain của hash này rồi xác minh recipient + amount
    let transfers: OnChainTransfer[] = [];
    try {
      switch (params.network) {
        case 'TRON': transfers = await this.scanTron(address, 0); break;
        case 'BSC': transfers = await this.scanBsc(address, 0); break;
        case 'POLYGON': transfers = await this.scanPolygon(address, 0); break;
        case 'SOLANA': transfers = await this.scanSolana(address); break;
        case 'LTC': transfers = await this.scanLtc(address); break;
      }
    } catch (err: any) {
      return { success: false, message: `Lỗi truy vấn blockchain: ${err?.message || 'không kết nối được explorer'}` };
    }

    const tx = transfers.find(t => t.txHash.toLowerCase() === cleanHash.toLowerCase());
    if (!tx) {
      return { success: false, message: 'Không tìm thấy giao dịch này chuyển vào ví CyberPool trên mạng đã chọn. Kiểm tra lại TxID/mạng, hoặc giao dịch chưa được explorer ghi nhận (đợi 1-2 phút).' };
    }
    if (tx.confirmations < minConfirmations(params.network)) {
      return { success: false, message: `Giao dịch mới có ${tx.confirmations}/${minConfirmations(params.network)} xác nhận — chưa đủ an toàn để cộng tiền. Hệ thống sẽ TỰ ĐỘNG cộng khi đủ xác nhận, không cần thao tác thêm.` };
    }

    return this.matchAndCredit(tx, params.network, params.userId, params.ipAddress);
  }

  // ==========================================================================
  // 4. MATCH + CREDIT — trái tim của cổng (dùng chung auto-scan & manual)
  // ==========================================================================
  private static matchAndCredit(
    tx: OnChainTransfer,
    network: CryptoGateNetwork,
    userIdHint: string,
    ipAddress?: string
  ): { success: boolean; message: string; creditedVnd?: number; intentId?: string } {
    if (GatewayVerificationService.isAlreadyRedeemed(tx.txHash)) {
      return { success: false, message: 'Giao dịch đã được xử lý trước đó.' };
    }

    // Tìm intent PENDING khớp: đúng user + đúng mạng + đúng số coin duy nhất
    // (so sánh bằng đơn vị nguyên 1e-8 để tránh sai số float)
    const txUnits = Math.round(tx.amount * 1e8);
    let matched: CryptoGateIntent | null = null;
    for (const it of db.cryptoGateIntents.values()) {
      if (it.status !== 'PENDING') continue;
      if (it.network !== network) continue;
      if (new Date(it.expiresAt).getTime() < Date.now()) continue;
      if (Math.round(it.amountCrypto * 1e8) === txUnits) {
        matched = it;
        break;
      }
    }

    if (!matched) {
      return {
        success: false,
        message: 'Giao dịch hợp lệ trên blockchain nhưng KHÔNG khớp lệnh nạp đang chờ nào (sai số coin hoặc lệnh đã hết hạn). Tiền đã vào ví shop — liên hệ hỗ trợ kèm TxID để được cộng thủ công.'
      };
    }

    if (matched.userId !== userIdHint) {
      // Bảo mật: không cho user này claim intent của user khác
      return { success: false, message: 'Lệnh nạp này không thuộc tài khoản của bạn.' };
    }

    return this.creditIntent(matched, tx, ipAddress);
  }

  private static creditIntent(
    intent: CryptoGateIntent,
    tx: OnChainTransfer,
    ipAddress?: string
  ): { success: boolean; message: string; creditedVnd?: number; intentId?: string } {
    const user = db.users.get(intent.userId);
    if (!user) {
      return { success: false, message: 'Tài khoản của lệnh nạp không còn tồn tại.' };
    }

    // Cộng đúng amountVnd đã chốt khi tạo lệnh (tránh trượt tỷ giá giữa lúc
    // tạo và lúc tiền về).
    const creditedVnd = intent.amountVnd;

    const ledgerRes = { pending: true };
    // LedgerService.executeTransaction là async → gọi không chặn ở scanner;
    // nhưng với manual verify ta cần await. Dùng IIFE + đánh dấu intent ngay
    // để chống double-credit race (txHash redeem trước, credit sau).
    GatewayVerificationService.markRedeemed(tx.txHash, {
      gateway: `CRYPTOGATE_${intent.network}`,
      amount: creditedVnd,
      userId: intent.userId,
      memo: intent.id
    });
    intent.status = 'COMPLETED';
    intent.txHash = tx.txHash;
    intent.creditedVnd = creditedVnd;
    db.cryptoGateIntents.set(intent.id, intent);

    LedgerService.executeTransaction({
      userId: intent.userId,
      type: 'DEPOSIT',
      amount: creditedVnd,
      description: `Nạp CryptoGate ${intent.coin} (${intent.network}) +${intent.amountCrypto} ${intent.coin} ≈ ${creditedVnd.toLocaleString('vi-VN')}₫ — Tx: ${tx.txHash.substring(0, 18)}...`,
      referenceId: tx.txHash,
      actorId: `CRYPTOGATE_${intent.network}`,
      actorName: `CryptoGate ${intent.network} On-chain Verifier`,
      ipAddress
    }).then(r => {
      if (!r.success) {
        console.error(`[CryptoGate] Ledger credit FAILED cho intent ${intent.id}:`, r.error);
      }
    }).catch(e => console.error('[CryptoGate] Ledger credit error:', e));

    db.saveSnapshot();
    void ledgerRes;
    return {
      success: true,
      message: `Đã xác nhận ${tx.amount} ${intent.coin} (${intent.network}) on-chain — cộng +${creditedVnd.toLocaleString('vi-VN')}₫ vào ví.`,
      creditedVnd,
      intentId: intent.id
    };
  }

  // ==========================================================================
  // 5. AUTO-SCANNER — quét định kỳ các mạng có lệnh chờ
  // ==========================================================================
  public static async scanCycle(): Promise<{ scanned: number; credited: number; errors: string[] }> {
    const result = { scanned: 0, credited: 0, errors: [] as string[] };
    if (!(db.systemConfig?.cryptoGateEnabled)) return result;

    const networks: CryptoGateNetwork[] = ['TRON', 'BSC', 'POLYGON', 'SOLANA', 'LTC'];
    for (const network of networks) {
      const address = configuredAddress(network);
      if (!address) continue;

      // Chỉ quét mạng có intent PENDING (tiết kiệm rate-limit explorer công khai)
      const hasPending = Array.from(db.cryptoGateIntents.values()).some(
        it => it.status === 'PENDING' && it.network === network && new Date(it.expiresAt).getTime() > Date.now() - 3600_000
      );
      if (!hasPending) continue;

      const cursorKey = `${network}:${address}`;
      const cursor = db.cryptoGateCursors.get(cursorKey) || { updatedAt: nowIso() };

      try {
        let transfers: OnChainTransfer[] = [];
        switch (network) {
          case 'TRON':
            transfers = await this.scanTron(address, Number(cursor.lastTs || 0) || Date.now() - 3600_000);
            break;
          case 'BSC':
            transfers = await this.scanBsc(address, Number(cursor.lastBlock || 0));
            break;
          case 'POLYGON':
            transfers = await this.scanPolygon(address, Number(cursor.lastBlock || 0));
            break;
          case 'SOLANA':
            transfers = await this.scanSolana(address, cursor.lastSig);
            break;
          case 'LTC':
            transfers = await this.scanLtc(address);
            break;
        }

        result.scanned += transfers.length;

        for (const tx of transfers) {
          if (GatewayVerificationService.isAlreadyRedeemed(tx.txHash)) continue;
          if (tx.confirmations < minConfirmations(network)) continue;

          // Match với TẤT CẢ intent pending (auto-scan không có user hint —
          // intent tự xác định chủ nhân qua amount duy nhất)
          const txUnits = Math.round(tx.amount * 1e8);
          let matched: CryptoGateIntent | null = null;
          for (const it of db.cryptoGateIntents.values()) {
            if (it.status !== 'PENDING' || it.network !== network) continue;
            if (new Date(it.expiresAt).getTime() < Date.now()) continue;
            if (Math.round(it.amountCrypto * 1e8) === txUnits) { matched = it; break; }
          }
          if (!matched) continue;

          const credit = this.creditIntent(matched, tx);
          if (credit.success) result.credited++;
        }

        // Cập nhật cursor
        const newest = transfers.reduce((acc, t) => Math.max(acc, t.timestampMs || 0), 0);
        const newestBlock = transfers.reduce((acc, t) => Math.max(acc, Number(t.blockNumber || 0)), 0);
        const newestSig = transfers.length > 0 ? transfers[transfers.length - 1].signature : cursor.lastSig;
        db.cryptoGateCursors.set(cursorKey, {
          lastTs: newest || cursor.lastTs,
          lastBlock: newestBlock || cursor.lastBlock,
          lastSig: newestSig || cursor.lastSig,
          updatedAt: nowIso()
        });
      } catch (err: any) {
        // Rate-limit/mạng lỗi → bỏ qua cycle này, KHÔNG spam log
        result.errors.push(`${network}: ${err?.message || 'scan error'}`);
      }
    }

    // Đánh dấu intent quá hạn
    let changed = false;
    for (const it of db.cryptoGateIntents.values()) {
      if (it.status === 'PENDING' && new Date(it.expiresAt).getTime() < Date.now()) {
        it.status = 'EXPIRED';
        db.cryptoGateIntents.set(it.id, it);
        changed = true;
      }
    }
    if (changed || result.scanned > 0) db.saveSnapshot();
    return result;
  }

  // ==========================================================================
  // 6. HELPERS cho routes/UI
  // ==========================================================================
  public static getNetworkStatus(): Array<{
    network: CryptoGateNetwork;
    coin: 'USDT' | 'LTC';
    address: string;
    configured: boolean;
    minConfirmations: number;
  }> {
    const networks: CryptoGateNetwork[] = ['TRON', 'BSC', 'POLYGON', 'SOLANA', 'LTC'];
    return networks.map(n => {
      const addr = configuredAddress(n);
      return {
        network: n,
        coin: NETWORK_COIN[n],
        address: addr,
        configured: Boolean(addr),
        minConfirmations: minConfirmations(n)
      };
    });
  }

  public static listIntents(userId?: string): CryptoGateIntent[] {
    const all = Array.from(db.cryptoGateIntents.values());
    const list = userId ? all.filter(i => i.userId === userId) : all;
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 200);
  }
}

// ==============================================================================
// Background scanner — khởi động cùng server (unref, không giữ process sống)
// ==============================================================================
let scannerStarted = false;
export function startCryptoGateScanner(): void {
  if (scannerStarted) return;
  scannerStarted = true;
  const run = async () => {
    try {
      const r = await CryptoGateService.scanCycle();
      if (r.credited > 0) {
        console.log(`[CryptoGate] Scan cycle: ${r.scanned} transfers, ${r.credited} credited.`);
      }
      if (r.errors.length > 0) {
        console.warn('[CryptoGate] Scan errors:', r.errors.join(' | '));
      }
    } catch (e: any) {
      console.warn('[CryptoGate] Scanner cycle fatal:', e?.message);
    }
  };
  const intervalSec = Number(db.systemConfig?.cryptoGateScanIntervalSeconds) || 30;
  const t = setInterval(run, Math.max(15, intervalSec) * 1000);
  t.unref?.();
  console.log(`[CryptoGate] On-chain scanner started (interval ${Math.max(15, intervalSec)}s, networks: ${CryptoGateService.getNetworkStatus().filter(n => n.configured).map(n => n.network).join(', ') || 'NONE'})`);
}
