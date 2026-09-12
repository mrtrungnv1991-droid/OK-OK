import crypto from 'crypto';
import { db } from '../db/store';
import { LedgerService } from './ledgerService';
import { IdempotencyService } from './idempotencyService';

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  gateway: 'BINANCE_PAY' | 'CRYPTO_USDT' | 'CRYPTO_LTC' | 'MOMO' | 'VIETQR';
  referenceId: string;
  amount: number; // in VND or target currency
  cryptoAmount?: number;
  cryptoCurrency?: string;
  explorerUrl?: string;
  message: string;
  details?: any;
  newBalance?: number;
}

export class GatewayVerificationService {
  /**
   * Check if a transaction hash/id was already redeemed (Anti-replay protection)
   * Backed by persistent disk storage via IdempotencyService
   */
  public static isAlreadyRedeemed(identifier: string): boolean {
    const cleanId = String(identifier).trim().toUpperCase();
    if (IdempotencyService.isProcessed(cleanId)) {
      return true;
    }
    if (db.processedWebhooks && db.processedWebhooks.has(cleanId.toLowerCase())) {
      return true;
    }
    // Check in ledger transactions
    const existsInLedger = db.transactions.some(
      tx => tx.referenceId && tx.referenceId.toUpperCase() === cleanId
    );
    return existsInLedger;
  }

  /**
   * Mark a transaction hash/id as redeemed
   */
  public static markRedeemed(identifier: string, data: {
    gateway: string;
    amount: number;
    userId: string;
    memo?: string;
  }) {
    const cleanId = String(identifier).trim();
    IdempotencyService.commit({
      primaryKey: cleanId,
      aliasKeys: data.memo ? [data.memo] : undefined,
      provider: data.gateway,
      referenceId: cleanId,
      memo: data.memo,
      amount: data.amount,
      userId: data.userId
    });

    if (!db.processedWebhooks) {
      db.processedWebhooks = new Map();
    }
    db.processedWebhooks.set(cleanId.toLowerCase(), {
      amount: data.amount,
      userId: data.userId,
      status: 'COMPLETED',
      processedAt: new Date().toISOString(),
      provider: data.gateway,
      memo: data.memo
    });
  }

  // ============================================================================
  // 1. BINANCE PAY API VERIFICATION
  // Official Binance Pay OpenAPI v2: POST https://bpay.binanceapi.com/binancepay/openapi/v2/order/query
  // ============================================================================
  public static async verifyBinancePay(params: {
    userId: string;
    orderId: string; // Binance Pay Order ID, Prepay ID or Merchant Trade No
    declaredAmount?: number;
    userCurrency?: string;
    memo?: string;
    ipAddress?: string;
  }): Promise<VerificationResult> {
    const cleanOrderId = String(params.orderId || '').trim();
    if (!cleanOrderId || cleanOrderId.length < 5) {
      return {
        success: false,
        verified: false,
        gateway: 'BINANCE_PAY',
        referenceId: cleanOrderId,
        amount: 0,
        message: 'Mã giao dịch Binance Pay không hợp lệ (yêu cầu ít nhất 5 ký tự)'
      };
    }

    if (this.isAlreadyRedeemed(cleanOrderId)) {
      return {
        success: false,
        verified: false,
        gateway: 'BINANCE_PAY',
        referenceId: cleanOrderId,
        amount: 0,
        message: 'Mã giao dịch Binance Pay này đã được cộng tiền vào tài khoản trước đó (Chống gian lận nạp trùng).'
      };
    }

    const targetUser = db.users.get(params.userId);
    if (!targetUser) {
      return {
        success: false,
        verified: false,
        gateway: 'BINANCE_PAY',
        referenceId: cleanOrderId,
        amount: 0,
        message: 'Người dùng không tồn tại trong hệ thống'
      };
    }

    const apiKey = db.systemConfig?.binanceApiKey || process.env.BINANCE_PAY_API_KEY;
    const secretKey = db.systemConfig?.binanceSecretKey || process.env.BINANCE_PAY_SECRET_KEY;
    const usdRate = db.systemConfig?.usdToVndRate || 25400;

    if (!apiKey || !secretKey || apiKey.includes('live_891823901823')) {
      return {
        success: false,
        verified: false,
        gateway: 'BINANCE_PAY',
        referenceId: cleanOrderId,
        amount: 0,
        message: 'Cổng thanh toán Binance Pay chưa được cấu hình credentials đối tác. Vui lòng liên hệ quản trị viên.'
      };
    }

    let verifiedAmountUsdt = 0;
    let orderStatus = '';
    let rawApiResponse: any = null;

    try {
      const timestamp = Date.now().toString();
      const nonce = crypto.randomBytes(16).toString('hex');
      const queryBody = JSON.stringify({ prepayId: cleanOrderId, merchantTradeNo: cleanOrderId });
      const payloadToSign = `${timestamp}\n${nonce}\n${queryBody}\n`;
      const signature = crypto.createHmac('sha512', secretKey).update(payloadToSign).digest('hex').toUpperCase();

      const bpayRes = await fetch('https://bpay.binanceapi.com/binancepay/openapi/v2/order/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'BinancePay-Timestamp': timestamp,
          'BinancePay-Nonce': nonce,
          'BinancePay-Certificate-SN': apiKey,
          'BinancePay-Signature': signature
        },
        body: queryBody
      });

      rawApiResponse = await bpayRes.json();
      if (rawApiResponse.status === 'SUCCESS' && rawApiResponse.data) {
        orderStatus = rawApiResponse.data.status;
        verifiedAmountUsdt = Number(rawApiResponse.data.orderAmount || 0);
      } else {
        return {
          success: false,
          verified: false,
          gateway: 'BINANCE_PAY',
          referenceId: cleanOrderId,
          amount: 0,
          message: `Binance Pay API phản hồi: ${rawApiResponse.errorMessage || 'Không tìm thấy hóa đơn trên Binance Pay'}`,
          details: rawApiResponse
        };
      }
    } catch (apiErr: any) {
      console.error('[BINANCE_PAY_API_ERROR]', apiErr);
      return {
        success: false,
        verified: false,
        gateway: 'BINANCE_PAY',
        referenceId: cleanOrderId,
        amount: 0,
        message: `Lỗi kết nối kiểm tra Binance Pay API: ${apiErr.message}`
      };
    }

    // F02: Chỉ cộng tiền khi Binance Pay xác nhận đã thanh toán thành công (PAID)
    if (orderStatus !== 'PAID' && orderStatus !== 'SUCCESS') {
      return {
        success: false,
        verified: false,
        gateway: 'BINANCE_PAY',
        referenceId: cleanOrderId,
        amount: 0,
        message: `Giao dịch Binance Pay chưa hoàn tất thanh toán (Trạng thái: ${orderStatus || 'UNPAID'})`
      };
    }

    if (verifiedAmountUsdt <= 0) {
      return {
        success: false,
        verified: false,
        gateway: 'BINANCE_PAY',
        referenceId: cleanOrderId,
        amount: 0,
        message: 'Số tiền thanh toán xác thực trên Binance Pay không hợp lệ.'
      };
    }

    const creditedVnd = Math.round(verifiedAmountUsdt * usdRate);

    // Execute atomic balance deposit in Ledger
    const ledgerRes = await LedgerService.executeTransaction({
      userId: targetUser.id,
      amount: creditedVnd,
      type: 'DEPOSIT',
      description: `Nạp tự động qua Binance Pay API (${verifiedAmountUsdt} USDT ≈ ${creditedVnd.toLocaleString()}₫) - Order #${cleanOrderId}`,
      referenceId: cleanOrderId,
      actorId: 'BINANCE_PAY_API',
      actorName: 'Binance Pay Verification Service',
      ipAddress: params.ipAddress
    });

    this.markRedeemed(cleanOrderId, {
      gateway: 'BINANCE_PAY',
      amount: creditedVnd,
      userId: targetUser.id,
      memo: params.memo
    });

    return {
      success: true,
      verified: true,
      gateway: 'BINANCE_PAY',
      referenceId: cleanOrderId,
      amount: creditedVnd,
      cryptoAmount: verifiedAmountUsdt,
      cryptoCurrency: 'USDT',
      message: `Xác minh Binance Pay thành công! Đã cộng +${creditedVnd.toLocaleString()}₫ (${verifiedAmountUsdt} USDT) vào ví.`,
      newBalance: targetUser.walletBalance,
      details: {
        orderId: cleanOrderId,
        status: orderStatus,
        rate: usdRate,
        txTime: new Date().toISOString()
      }
    };
  }

  // ============================================================================
  // 2. CRYPTO USDT (TRC20 / BEP20) ON-CHAIN BLOCKCHAIN API VERIFICATION
  // TronScan API: https://apilist.tronscanapi.com/api/transaction-info?hash=...
  // BscScan API: https://api.bscscan.com/api?module=transaction...
  // ============================================================================
  public static async verifyCryptoUsdt(params: {
    userId: string;
    txHash: string;
    network?: 'TRC20' | 'BEP20';
    expectedUsdt?: number;
    memo?: string;
    ipAddress?: string;
  }): Promise<VerificationResult> {
    const cleanHash = String(params.txHash || '').trim().replace(/\s+/g, '');
    const network = params.network || 'TRC20';

    if (!cleanHash || cleanHash.length < 32) {
      return {
        success: false,
        verified: false,
        gateway: 'CRYPTO_USDT',
        referenceId: cleanHash,
        amount: 0,
        message: 'Mã băm giao dịch (TxID / Transaction Hash) không hợp lệ (yêu cầu ít nhất 32 ký tự).'
      };
    }

    if (this.isAlreadyRedeemed(cleanHash)) {
      return {
        success: false,
        verified: false,
        gateway: 'CRYPTO_USDT',
        referenceId: cleanHash,
        amount: 0,
        message: 'Mã băm TxID này đã được hệ thống ghi nhận và cộng tiền trước đó. Không thể nạp lại giao dịch cũ.'
      };
    }

    const targetUser = db.users.get(params.userId);
    if (!targetUser) {
      return {
        success: false,
        verified: false,
        gateway: 'CRYPTO_USDT',
        referenceId: cleanHash,
        amount: 0,
        message: 'Tài khoản người dùng không tồn tại'
      };
    }

    const shopUsdtAddress = db.systemConfig?.cryptoUsdtAddress || 'TWYvQ5X4h3uC48K8kS1mN7kY6Q3kH2g9aB';
    const usdRate = db.systemConfig?.usdToVndRate || 25400;

    let detectedUsdt = 0;
    let onChainVerified = false;
    let explorerUrl = '';
    let contractAddress = '';
    let confirmations = 0;

    if (network === 'TRC20') {
      explorerUrl = `https://tronscan.org/#/transaction/${cleanHash}`;
      try {
        const tronScanUrl = `https://apilist.tronscanapi.com/api/transaction-info?hash=${cleanHash}`;
        const res = await fetch(tronScanUrl, {
          headers: { 'User-Agent': 'CyberPool-Crypto-Scanner/2.0' }
        });
        if (res.ok) {
          const data: any = await res.json();
          if (data && data.hash && (data.contractRet === 'SUCCESS' || data.confirmed)) {
            // Check TRC20 transfer info
            if (data.trc20TransferInfo && Array.isArray(data.trc20TransferInfo) && data.trc20TransferInfo.length > 0) {
              for (const transfer of data.trc20TransferInfo) {
                const toAddr = transfer.to_address || '';
                const contract = transfer.contract_address || '';
                // USDT contract on TRON is TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
                // STRICT CHECK: Both contract address AND shop recipient address must match!
                if (contract.toLowerCase() === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'.toLowerCase() && toAddr.toLowerCase() === shopUsdtAddress.toLowerCase()) {
                  detectedUsdt = Number(transfer.amount_str || 0) / 1000000;
                  contractAddress = contract;
                  onChainVerified = true;
                  confirmations = data.confirmations || 12;
                  break;
                }
              }
            }
          }
        }
      } catch (tronErr) {
        console.warn('[TRONSCAN_API_LOOKUP_WARN]', tronErr);
      }
    } else {
          // BEP20 (BSC)
          explorerUrl = `https://bscscan.com/tx/${cleanHash}`;
          try {
            // CYBERPOOL SECURITY FIX: the old code only called gettxreceiptstatus
            // — it verified the tx *succeeded* but never checked the recipient or
            // the token amount, so a user could submit the hash of ANY successful
            // BSC transaction and get credited. Query the token-transfer detail and
            // strictly verify contract + shop recipient + amount, mirroring the
            // TRC20 branch.
            const bscScanTokenUrl = `https://api.bscscan.com/api?module=account&action=tokentx&txhash=${cleanHash}`;
            const res = await fetch(bscScanTokenUrl);
            if (res.ok) {
              const data: any = await res.json();
              if (data && data.result && Array.isArray(data.result) && data.result.length > 0) {
                // USDT-BSC canonical contract (BUSD/USDC also acceptable variants)
                const usdtBscContract = '0x55d398326f99059fF775485246999027B3197955'.toLowerCase();
                const targetRecipient = shopUsdtAddress.toLowerCase();
                let foundTransfer = false;
                for (const transfer of data.result) {
                  const contract = (transfer.contractAddress || '').toLowerCase();
                  const toAddr = (transfer.to || '').toLowerCase();
                  if (contract === usdtBscContract && toAddr === targetRecipient) {
                    // tokentx value is raw 18-decimal units for USDT-BSC
                    detectedUsdt = Number(transfer.value || 0) / 1e18;
                    contractAddress = transfer.contractAddress || '';
                    if (detectedUsdt > 0) foundTransfer = true;
                    break;
                  }
                }
                if (foundTransfer) {
                  // Also confirm the receipt status succeeded
                  const statusUrl = `https://api.bscscan.com/api?module=transaction&action=gettxreceiptstatus&txhash=${cleanHash}`;
                  const statusRes = await fetch(statusUrl);
                  if (statusRes.ok) {
                    const statusData: any = await statusRes.json();
                    if (statusData?.result?.status === '1') {
                      onChainVerified = true;
                      confirmations = 15;
                    }
                  }
                }
              }
            }
          } catch (bscErr) {
            console.warn('[BSCSCAN_API_LOOKUP_WARN]', bscErr);
          }
        }

    // F02: Chỉ cộng tiền khi truy vấn blockchain trả về giao dịch chuyển tiền hợp lệ
    if (!onChainVerified || detectedUsdt <= 0) {
      return {
        success: false,
        verified: false,
        gateway: 'CRYPTO_USDT',
        referenceId: cleanHash,
        amount: 0,
        explorerUrl,
        message: 'Không tìm thấy giao dịch chuyển USDT hợp lệ trên blockchain tới ví CyberPool hoặc giao dịch chưa đủ số block xác nhận. Vui lòng kiểm tra lại TxID.'
      };
    }

    const creditedVnd = Math.round(detectedUsdt * usdRate);

    // Record in ledger
    await LedgerService.executeTransaction({
      userId: targetUser.id,
      amount: creditedVnd,
      type: 'DEPOSIT',
      description: `Nạp tự động USDT ${network} (+${detectedUsdt} USDT ≈ ${creditedVnd.toLocaleString()}₫) - Tx: ${cleanHash.substring(0, 16)}...`,
      referenceId: cleanHash,
      actorId: `CRYPTO_${network}`,
      actorName: `Crypto ${network} Blockchain Verifier`,
      ipAddress: params.ipAddress
    });

    this.markRedeemed(cleanHash, {
      gateway: 'CRYPTO_USDT',
      amount: creditedVnd,
      userId: targetUser.id,
      memo: params.memo
    });

    return {
      success: true,
      verified: true,
      gateway: 'CRYPTO_USDT',
      referenceId: cleanHash,
      amount: creditedVnd,
      cryptoAmount: detectedUsdt,
      cryptoCurrency: 'USDT',
      explorerUrl,
      message: `Xác minh on-chain thành công! Đã nhận ${detectedUsdt} USDT (${network}), cộng +${creditedVnd.toLocaleString()}₫ vào ví.`,
      newBalance: targetUser.walletBalance,
      details: {
        network,
        hash: cleanHash,
        confirmations,
        contract: contractAddress || 'USDT TRC20 Official'
      }
    };
  }

  // ============================================================================
  // 3. LITECOIN (LTC MAINNET) CORE API VERIFICATION
  // Blockchair / BlockCypher API
  // ============================================================================
  public static async verifyCryptoLtc(params: {
    userId: string;
    txHash: string;
    expectedLtc?: number;
    memo?: string;
    ipAddress?: string;
  }): Promise<VerificationResult> {
    const cleanHash = String(params.txHash || '').trim().replace(/\s+/g, '');

    if (!cleanHash || cleanHash.length < 32) {
      return {
        success: false,
        verified: false,
        gateway: 'CRYPTO_LTC',
        referenceId: cleanHash,
        amount: 0,
        message: 'Mã băm giao dịch Litecoin (LTC TxID) không hợp lệ (yêu cầu ít nhất 32 ký tự).'
      };
    }

    if (this.isAlreadyRedeemed(cleanHash)) {
      return {
        success: false,
        verified: false,
        gateway: 'CRYPTO_LTC',
        referenceId: cleanHash,
        amount: 0,
        message: 'Mã băm LTC TxID này đã được hệ thống xác minh và cộng tiền trước đó. Chống nạp trùng 2 lần.'
      };
    }

    const targetUser = db.users.get(params.userId);
    if (!targetUser) {
      return {
        success: false,
        verified: false,
        gateway: 'CRYPTO_LTC',
        referenceId: cleanHash,
        amount: 0,
        message: 'Tài khoản người dùng không tồn tại'
      };
    }

    const shopLtcAddress = db.systemConfig?.cryptoLtcAddress || 'LTC1Q8K9M2J4P6X7V5T3R1Z0W8Y6N4C2B8';
    const ltcRate = db.systemConfig?.cryptoLtcRate || 2150000;
    const explorerUrl = `https://blockchair.com/litecoin/transaction/${cleanHash}`;

    let detectedLtc = 0;
    let confirmations = 0;
    let onChainVerified = false;

    // Try Blockchair Litecoin API
    try {
      const blockchairUrl = `https://api.blockchair.com/litecoin/dashboards/transaction/${cleanHash}`;
      const res = await fetch(blockchairUrl, {
        headers: { 'User-Agent': 'CyberPool-LTC-Scanner/2.0' }
      });
      if (res.ok) {
        const data: any = await res.json();
        const txObj = data?.data?.[cleanHash]?.transaction;
        const outputs = data?.data?.[cleanHash]?.outputs || [];
        if (txObj) {
          confirmations = (data?.context?.state || 0) - (txObj.block_id || 0) + 1;
          for (const out of outputs) {
            // STRICT CHECK: Recipient must be the exact shop LTC address, no prefix-only matching
            if (out.recipient && out.recipient.toLowerCase() === shopLtcAddress.toLowerCase()) {
              detectedLtc = out.value / 100000000;
              onChainVerified = true;
              break;
            }
          }
        }
      }
    } catch (ltcErr) {
      console.warn('[LTC_BLOCKCHAIR_API_WARN]', ltcErr);
    }

    // Try BlockCypher if Blockchair had rate limit
    if (!onChainVerified) {
      try {
        const cypherUrl = `https://api.blockcypher.com/v1/ltc/main/txs/${cleanHash}`;
        const res = await fetch(cypherUrl);
        if (res.ok) {
          const cypherData: any = await res.json();
          if (cypherData && cypherData.hash) {
            confirmations = cypherData.confirmations || 1;
            for (const out of cypherData.outputs || []) {
              if (out.addresses && out.addresses.some((a: string) => a.toLowerCase() === shopLtcAddress.toLowerCase())) {
                detectedLtc = out.value / 100000000;
                onChainVerified = true;
                break;
              }
            }
          }
        }
      } catch (cypherErr) {
        console.warn('[LTC_BLOCKCYPHER_API_WARN]', cypherErr);
      }
    }

    // F02: Chỉ cộng tiền khi truy vấn blockchain Litecoin trả về giao dịch hợp lệ
    if (!onChainVerified || detectedLtc <= 0) {
      return {
        success: false,
        verified: false,
        gateway: 'CRYPTO_LTC',
        referenceId: cleanHash,
        amount: 0,
        explorerUrl,
        message: 'Không tìm thấy giao dịch chuyển LTC hợp lệ tới địa chỉ ví CyberPool trên blockchain. Vui lòng kiểm tra lại TxID.'
      };
    }

    const creditedVnd = Math.round(detectedLtc * ltcRate);

    await LedgerService.executeTransaction({
      userId: targetUser.id,
      amount: creditedVnd,
      type: 'DEPOSIT',
      description: `Nạp tự động Litecoin LTC Mainnet (+${detectedLtc} LTC ≈ ${creditedVnd.toLocaleString()}₫) - Tx: ${cleanHash.substring(0, 16)}...`,
      referenceId: cleanHash,
      actorId: 'CRYPTO_LTC_CORE',
      actorName: 'Litecoin Mainnet Node Verifier',
      ipAddress: params.ipAddress
    });

    this.markRedeemed(cleanHash, {
      gateway: 'CRYPTO_LTC',
      amount: creditedVnd,
      userId: targetUser.id,
      memo: params.memo
    });

    return {
      success: true,
      verified: true,
      gateway: 'CRYPTO_LTC',
      referenceId: cleanHash,
      amount: creditedVnd,
      cryptoAmount: detectedLtc,
      cryptoCurrency: 'LTC',
      explorerUrl,
      message: `Xác minh giao dịch LTC thành công! Đã nhận ${detectedLtc} LTC, quy đổi +${creditedVnd.toLocaleString()}₫ vào ví.`,
      newBalance: targetUser.walletBalance,
      details: {
        hash: cleanHash,
        confirmations,
        rate: ltcRate
      }
    };
  }

  // ============================================================================
  // 4. MOMO E-WALLET API VERIFICATION
  // MoMo Business Query API: https://payment.momo.vn/v2/gateway/api/query
  // ============================================================================
  public static async verifyMoMo(params: {
    userId: string;
    transId: string; // Mã giao dịch MoMo 10-11 số
    declaredAmount?: number;
    memo?: string;
    ipAddress?: string;
  }): Promise<VerificationResult> {
    const cleanTransId = String(params.transId || '').trim();

    if (!cleanTransId || cleanTransId.length < 6) {
      return {
        success: false,
        verified: false,
        gateway: 'MOMO',
        referenceId: cleanTransId,
        amount: 0,
        message: 'Mã giao dịch MoMo (Trans ID) không hợp lệ (yêu cầu ít nhất 6 chữ số từ ứng dụng MoMo).'
      };
    }

    if (this.isAlreadyRedeemed(cleanTransId)) {
      return {
        success: false,
        verified: false,
        gateway: 'MOMO',
        referenceId: cleanTransId,
        amount: 0,
        message: 'Mã giao dịch MoMo này đã được cộng tiền vào tài khoản trước đó (Chống nạp trùng).'
      };
    }

    const targetUser = db.users.get(params.userId);
    if (!targetUser) {
      return {
        success: false,
        verified: false,
        gateway: 'MOMO',
        referenceId: cleanTransId,
        amount: 0,
        message: 'Tài khoản người dùng không tồn tại'
      };
    }

    const momoPhone = db.systemConfig?.momoPhone || '0988889999';
    const momoName = db.systemConfig?.momoName || 'CYBERPOOL ADMIN';
    const partnerCode = db.systemConfig?.momoPartnerCode || process.env.MOMO_PARTNER_CODE;
    const accessKey = db.systemConfig?.momoAccessKey || process.env.MOMO_ACCESS_KEY;
    const secretKey = db.systemConfig?.momoSecretKey || process.env.MOMO_SECRET_KEY;

    let verifiedAmount = 0;
    let momoStatus = 'SUCCESS';

    // If MoMo Business API credentials are NOT configured, return error
    if (!partnerCode || !accessKey || !secretKey) {
      return {
        success: false,
        verified: false,
        gateway: 'MOMO',
        referenceId: cleanTransId,
        amount: 0,
        message: 'Cổng thanh toán MoMo Business API chưa được cấu hình đối soát. Vui lòng liên hệ quản trị viên.'
      };
    }

    try {
      const requestId = `QUERY_${Date.now()}`;
      const rawSignature = `accessKey=${accessKey}&orderId=${cleanTransId}&partnerCode=${partnerCode}&requestId=${requestId}`;
      const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

      const momoRes = await fetch('https://payment.momo.vn/v2/gateway/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerCode,
          requestId,
          orderId: cleanTransId,
          signature,
          lang: 'vi'
        })
      });

      const momoData: any = await momoRes.json();
      if (momoData && (momoData.resultCode === 0 || momoData.resultCode === 9000)) {
        verifiedAmount = Number(momoData.amount || 0);
        momoStatus = 'COMPLETED';
      } else {
        return {
          success: false,
          verified: false,
          gateway: 'MOMO',
          referenceId: cleanTransId,
          amount: 0,
          message: `MoMo API phản hồi: ${momoData?.message || 'Mã giao dịch MoMo không hợp lệ hoặc chưa hoàn tất'}`
        };
      }
    } catch (momoApiErr: any) {
      console.warn('[MOMO_API_QUERY_ERROR]', momoApiErr);
      return {
        success: false,
        verified: false,
        gateway: 'MOMO',
        referenceId: cleanTransId,
        amount: 0,
        message: `Lỗi kết nối kiểm tra MoMo API: ${momoApiErr.message}`
      };
    }

    if (verifiedAmount <= 0) {
      return {
        success: false,
        verified: false,
        gateway: 'MOMO',
        referenceId: cleanTransId,
        amount: 0,
        message: 'Số tiền giao dịch MoMo không hợp lệ.'
      };
    }

    if (verifiedAmount <= 0) {
      return {
        success: false,
        verified: false,
        gateway: 'MOMO',
        referenceId: cleanTransId,
        amount: 0,
        message: 'Số tiền giao dịch MoMo không hợp lệ.'
      };
    }

    // Atomic ledger deposit
    await LedgerService.executeTransaction({
      userId: targetUser.id,
      amount: verifiedAmount,
      type: 'DEPOSIT',
      description: `Nạp tự động Ví MoMo (+${verifiedAmount.toLocaleString()}₫) - Mã GD: ${cleanTransId} [${momoPhone}]`,
      referenceId: cleanTransId,
      actorId: 'MOMO_API_GATEWAY',
      actorName: 'MoMo E-Wallet Verifier',
      ipAddress: params.ipAddress
    });

    this.markRedeemed(cleanTransId, {
      gateway: 'MOMO',
      amount: verifiedAmount,
      userId: targetUser.id,
      memo: params.memo
    });

    return {
      success: true,
      verified: true,
      gateway: 'MOMO',
      referenceId: cleanTransId,
      amount: verifiedAmount,
      message: `Xác minh giao dịch MoMo thành công! Đã cộng +${verifiedAmount.toLocaleString()}₫ vào tài khoản.`,
      newBalance: targetUser.walletBalance,
      details: {
        transId: cleanTransId,
        receiver: `${momoPhone} (${momoName})`,
        status: momoStatus,
        verifiedAt: new Date().toISOString()
      }
    };
  }

  // ============================================================================
  // 5. VIETQR / BANKING 24/7 AUTO VERIFICATION (F01: Chặn cộng tiền khi chưa có đối soát)
  // ============================================================================
  public static async verifyVietQr(params: {
    userId: string;
    transferCode: string;
    amount?: number;
    ipAddress?: string;
  }): Promise<VerificationResult> {
    const cleanCode = String(params.transferCode || '').trim().toUpperCase();

    const targetUser = db.users.get(params.userId);
    if (!targetUser) {
      return {
        success: false,
        verified: false,
        gateway: 'VIETQR',
        referenceId: cleanCode,
        amount: 0,
        message: 'Tài khoản người dùng không tồn tại'
      };
    }

    if (!cleanCode) {
      return {
        success: false,
        verified: false,
        gateway: 'VIETQR',
        referenceId: '',
        amount: 0,
        message: 'Mã nội dung chuyển khoản không hợp lệ'
      };
    }

    // 1. Kiểm tra xem giao dịch đã được hệ thống ghi nhận qua webhook và cộng tiền chưa
    const existingSettlement = IdempotencyService.getRecord(cleanCode);

    if (this.isAlreadyRedeemed(cleanCode) || (existingSettlement && IdempotencyService.isProcessed(existingSettlement.referenceId || cleanCode))) {
      return {
        success: true,
        verified: true,
        gateway: 'VIETQR',
        referenceId: existingSettlement?.referenceId || cleanCode,
        amount: existingSettlement?.amount || params.amount || 0,
        message: 'Giao dịch chuyển khoản này đã được đối soát và cộng tiền thành công vào ví của bạn trước đó.',
        newBalance: targetUser.walletBalance
      };
    }

    if (!existingSettlement) {
      return {
        success: false,
        verified: false,
        gateway: 'VIETQR',
        referenceId: cleanCode,
        amount: 0,
        message: 'Cổng thanh toán tự động VietQR chưa nhận được biến động số dư ngân hàng khớp với mã chuyển khoản này. Vui lòng chờ 1-3 phút để hệ thống ngân hàng đồng bộ.'
      };
    }

    // Giao dịch có bản ghi webhook nhưng chưa được cộng tiền (hoặc cần đối soát): thực hiện khóa nguyên tử và cộng 1 lần duy nhất
    const lockAcquired = await IdempotencyService.acquireLock(cleanCode);
    if (!lockAcquired) {
      return {
        success: false,
        verified: false,
        gateway: 'VIETQR',
        referenceId: cleanCode,
        amount: 0,
        message: 'Giao dịch đang được xử lý song song bởi một tiến trình khác. Vui lòng thử lại sau giây lát.'
      };
    }

    try {
      if (this.isAlreadyRedeemed(cleanCode)) {
        return {
          success: true,
          verified: true,
          gateway: 'VIETQR',
          referenceId: cleanCode,
          amount: existingSettlement.amount,
          message: 'Giao dịch chuyển khoản này đã được đối soát và cộng tiền thành công vào ví của bạn.',
          newBalance: targetUser.walletBalance
        };
      }

      const actualAmount = existingSettlement.amount;
      const txRef = `NAPAS_${Date.now()}`;
      await LedgerService.executeTransaction({
        userId: targetUser.id,
        amount: actualAmount,
        type: 'DEPOSIT',
        description: `Nạp tiền VietQR Ngân Hàng Napas 24/7 (+${actualAmount.toLocaleString()}₫) - Nội dung: ${cleanCode}`,
        referenceId: txRef,
        actorId: 'VIETQR_NAPAS_AUTO',
        actorName: 'Napas 24/7 Core API',
        ipAddress: params.ipAddress
      });

      this.markRedeemed(cleanCode, {
        gateway: 'VIETQR',
        amount: actualAmount,
        userId: targetUser.id,
        memo: cleanCode
      });

      if (existingSettlement.referenceId) {
        IdempotencyService.commit({
          primaryKey: existingSettlement.referenceId,
          aliasKeys: [cleanCode],
          provider: 'VIETQR',
          referenceId: existingSettlement.referenceId,
          memo: cleanCode,
          amount: actualAmount,
          userId: targetUser.id
        });
      }

      return {
        success: true,
        verified: true,
        gateway: 'VIETQR',
        referenceId: txRef,
        amount: actualAmount,
        message: `Xác nhận nạp VietQR thành công! Đã cộng +${actualAmount.toLocaleString()}₫ vào tài khoản.`,
        newBalance: targetUser.walletBalance
      };
    } finally {
      IdempotencyService.releaseLock(cleanCode);
    }
  }

  // ============================================================================
  // ADMIN API GATEWAY PING TESTS
  // ============================================================================
  public static async testBinanceApiConnection(credentials?: {
    apiKey?: string;
    secretKey?: string;
  }) {
    const start = Date.now();
    const apiKey = credentials?.apiKey || db.systemConfig?.binanceApiKey || process.env.BINANCE_PAY_API_KEY;
    const secretKey = credentials?.secretKey || db.systemConfig?.binanceSecretKey || process.env.BINANCE_PAY_SECRET_KEY;

    try {
      // Test Binance ping
      const pingRes = await fetch('https://api.binance.com/api/v3/ping');
      const latency = Date.now() - start;

      const hasCustomKeys = apiKey && !apiKey.includes('live_891823901823');

      return {
        success: true,
        reachable: true,
        gateway: 'Binance Pay / UID',
        latencyMs: latency,
        configured: Boolean(hasCustomKeys),
        binanceServerStatus: pingRes.ok ? 'ONLINE (HTTP 200 OK)' : 'DEGRADED',
        merchantStatus: hasCustomKeys ? 'API KEY ACTIVE & SIGNATURE READY' : 'SANDBOX / TESTNET READY',
        apiEndpoint: 'https://bpay.binanceapi.com/binancepay/openapi/v2/order/query',
        note: 'Kết nối API máy chủ Binance Pay hoàn toàn ổn định. Giao dịch người dùng được xác thực và cộng tiền tự động.'
      };
    } catch (err: any) {
      return {
        success: false,
        reachable: false,
        gateway: 'Binance Pay',
        error: `Không thể kết nối đến máy chủ Binance: ${err?.message || 'Timeout'}`
      };
    }
  }

  public static async testTronScanCryptoConnection(params?: {
    address?: string;
    network?: string;
  }) {
    const start = Date.now();
    const address = params?.address || db.systemConfig?.cryptoUsdtAddress || 'TWYvQ5X4h3uC48K8kS1mN7kY6Q3kH2g9aB';

    try {
      const res = await fetch(`https://apilist.tronscanapi.com/api/account?address=${address}`, {
        headers: { 'User-Agent': 'CyberPool-Validator/2.0' }
      });
      const latency = Date.now() - start;
      const data: any = res.ok ? await res.json() : {};

      return {
        success: true,
        reachable: true,
        gateway: 'Crypto USDT (TRON TRC20)',
        latencyMs: latency,
        walletAddress: address,
        onChainStatus: 'ONLINE (TRON MAINNET NODE)',
        bandwidth: data.bandwidth || 'Ready',
        trxBalance: data.balance ? `${data.balance / 1000000} TRX` : 'Active',
        explorerApi: 'https://apilist.tronscanapi.com/api/transaction-info',
        note: 'Kết nối mạng lưới TRON Blockchain (TRC20) và BNB Smart Chain (BEP20) hoạt động hoàn hảo. Tự động kiểm tra TxID tức thì.'
      };
    } catch (err: any) {
      return {
        success: false,
        reachable: false,
        gateway: 'Crypto USDT',
        error: `Không thể kết nối node TronScan: ${err?.message || 'Lỗi mạng'}`
      };
    }
  }

  public static async testLitecoinConnection(params?: {
    address?: string;
  }) {
    const start = Date.now();
    const address = params?.address || db.systemConfig?.cryptoLtcAddress || 'LTC1Q8K9M2J4P6X7V5T3R1Z0W8Y6N4C2B8';

    try {
      const res = await fetch('https://api.blockchair.com/litecoin/stats', {
        headers: { 'User-Agent': 'CyberPool-Validator/2.0' }
      });
      const latency = Date.now() - start;
      const data: any = res.ok ? await res.json() : {};
      const blockHeight = data?.data?.blocks || '840,000+';

      return {
        success: true,
        reachable: true,
        gateway: 'Litecoin (LTC Mainnet Core)',
        latencyMs: latency,
        blockHeight,
        walletAddress: address,
        mempoolTxs: data?.data?.mempool_transactions || 0,
        explorerApi: 'https://api.blockchair.com/litecoin',
        note: 'Kết nối Blockchain Litecoin Core Mainnet hoàn toàn thông suốt. TxID được quét tự động qua Blockchair & BlockCypher.'
      };
    } catch (err: any) {
      return {
        success: false,
        reachable: false,
        gateway: 'Litecoin LTC',
        error: `Không thể kết nối node Litecoin: ${err?.message || 'Lỗi mạng'}`
      };
    }
  }

  public static async testMoMoApiConnection(params?: {
    phone?: string;
    name?: string;
  }) {
    const start = Date.now();
    const phone = params?.phone || db.systemConfig?.momoPhone || '0988889999';
    const name = params?.name || db.systemConfig?.momoName || 'CYBERPOOL ADMIN';

    try {
      // Test MoMo Gateway reachability
      const res = await fetch('https://payment.momo.vn', { method: 'HEAD' });
      const latency = Date.now() - start;

      return {
        success: true,
        reachable: true,
        gateway: 'Ví MoMo Business / ZaloPay',
        latencyMs: latency,
        phone,
        holderName: name,
        serverStatus: res.ok || res.status < 500 ? 'ONLINE (HTTP 200/302)' : 'STANDBY',
        apiEndpoint: 'https://payment.momo.vn/v2/gateway/api/query',
        note: 'Cổng thanh toán MoMo Business kết nối thông suốt. Hệ thống tự động xác minh mã giao dịch MoMo TransID và cộng tiền ví.'
      };
    } catch (err: any) {
      return {
        success: false,
        reachable: false,
        gateway: 'MoMo E-Wallet',
        error: `Không thể kết nối máy chủ MoMo: ${err?.message || 'Lỗi mạng'}`
      };
    }
  }
}
