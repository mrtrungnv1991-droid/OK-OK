import { api, ApiResponse } from './client';
import { TransactionRecord } from '../types';

export interface GatewayVerificationResponse {
  success: boolean;
  verified: boolean;
  gateway?: 'BINANCE_PAY' | 'CRYPTO_USDT' | 'CRYPTO_LTC' | 'MOMO' | 'VIETQR';
  referenceId?: string;
  amount: number;
  cryptoAmount?: number;
  cryptoCurrency?: string;
  explorerUrl?: string;
  message: string;
  newBalance?: number;
  details?: any;
}

export const walletApi = {
  getLedger: async (): Promise<ApiResponse<{ walletBalance: number; escrowLocked: number; transactions: TransactionRecord[] }>> => {
    return api.get<{ walletBalance: number; escrowLocked: number; transactions: TransactionRecord[] }>('/wallet/ledger');
  },

  // CYBERPOOL FIX: tạo lệnh thu tiền thật từ Binance Pay (Mô hình A - Merchant Checkout)
  createBinancePayOrder: async (payload: {
    amount: number;
    returnUrl?: string;
    cancelUrl?: string;
  }): Promise<ApiResponse<{
    success: boolean;
    gateway: string;
    prepayId?: string;
    checkoutUrl?: string;
    qrContent?: string;
    qrcodeLink?: string;
    deeplink?: string;
    universalUrl?: string;
    merchantTradeNo?: string;
    message?: string;
  }>> => {
    return api.post('/wallet/binance-pay/create-order', payload);
  },

  // CYBERPOOL FIX: tạo lệnh thu tiền thật từ MoMo captureWallet
  createMoMoPayment: async (payload: {
    amount: number;
    redirectUrl?: string;
    orderInfo?: string;
  }): Promise<ApiResponse<{
    success: boolean;
    gateway: string;
    orderId?: string;
    requestId?: string;
    payUrl?: string;
    deeplink?: string;
    qrCodeUrl?: string;
    message?: string;
  }>> => {
    return api.post('/wallet/momo/create-payment', payload);
  },

  deposit: async (amount: number, methodTitle: string, idempotencyKey?: string): Promise<ApiResponse<{ newBalance: number; transaction: TransactionRecord }>> => {
    return api.post<{ newBalance: number; transaction: TransactionRecord }>('/wallet/deposit', {
      amount,
      methodTitle,
      idempotencyKey
    });
  },

  submitTelcoCard: async (payload: {
    telco: string;
    declaredAmount: number;
    pin: string;
    serial: string;
  }): Promise<ApiResponse<{ 
    receivedAmount: number; 
    newBalance: number; 
    status?: string;
    requestId?: string;
    message?: string;
    transaction?: TransactionRecord 
  }>> => {
    return api.post<{ 
      receivedAmount: number; 
      newBalance: number; 
      status?: string;
      requestId?: string;
      message?: string;
      transaction?: TransactionRecord 
    }>('/wallet/telco-card', payload);
  },

  requestWithdrawal: async (payload: {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    paymentMethod?: string;
    withdrawalType?: string;
  }): Promise<ApiResponse<{ message: string; transaction: TransactionRecord; withdrawal?: any }>> => {
    return api.post<{ message: string; transaction: TransactionRecord; withdrawal?: any }>('/wallet/withdraw', payload);
  },

  // CYBERPOOL FIX: lịch sử rút tiền thật từ server
  getMyWithdrawals: async (): Promise<ApiResponse<{ withdrawals: any[] }>> => {
    return api.get<{ withdrawals: any[] }>('/wallet/withdrawals');
  },
  // CYBERPOOL FIX (#5 frontend audit): Lucky Wheel server-authoritative
  getWheelConfig: async (): Promise<ApiResponse<{ spinCost: number; prizes: any[] }>> => {
    return api.get<{ spinCost: number; prizes: any[] }>('/wallet/wheel/config');
  },

  getWheelRecentWinners: async (): Promise<ApiResponse<{ winners: any[] }>> => {
    return api.get<{ winners: any[] }>('/wallet/wheel/recent');
  },

  spinWheel: async (): Promise<ApiResponse<{
    spinCost: number;
    prize: { id: string; name: string; type: string; value: number; deliveredCode?: string };
    ledgerTxId?: string;
    newBalance?: number;
  }>> => {
    return api.post('/wallet/wheel/spin', {});
  },

  // ==========================================================================
  // CYBERPOOL CRYPTOGATE — cổng nạp crypto multi-network direct-to-wallet
  // ==========================================================================
  getCryptoGateNetworks: async (): Promise<ApiResponse<{
    enabled: boolean;
    usdToVndRate: number;
    ltcRate: number;
    binanceId: string;
    orderTtlMinutes: number;
    networks: Array<{ network: string; coin: string; address: string; configured: boolean; minConfirmations: number }>;
  }>> => {
    return api.get('/wallet/crypto-gate/networks');
  },

  createCryptoGateIntent: async (payload: { network: string; amount: number }): Promise<ApiResponse<{ intent: {
    id: string; userId: string; network: string; address: string; amountCrypto: number;
    amountVnd: number; coin: string; status: string; createdAt: string; expiresAt: string;
  } }>> => {
    return api.post('/wallet/crypto-gate/create-intent', payload);
  },

  verifyCryptoGateTx: async (payload: { txHash: string; network: string }): Promise<ApiResponse<{
    message: string; creditedVnd?: number; intentId?: string;
  }>> => {
    return api.post('/wallet/crypto-gate/verify-tx', payload);
  },

  getMyCryptoGateIntents: async (): Promise<ApiResponse<{ intents: any[] }>> => {
    return api.get('/wallet/crypto-gate/my-intents');
  },

  verifyBinancePay: async (payload: {
    orderId: string;
    amount?: number;
    memo?: string;
  }): Promise<ApiResponse<GatewayVerificationResponse>> => {
    return api.post('/wallet/verify-binance', payload);
  },

  verifyCryptoUsdt: async (payload: {
    txHash: string;
    network?: 'TRC20' | 'BEP20';
    expectedUsdt?: number;
    memo?: string;
  }): Promise<ApiResponse<GatewayVerificationResponse>> => {
    return api.post('/wallet/verify-crypto-usdt', payload);
  },

  verifyCryptoLtc: async (payload: {
    txHash: string;
    expectedLtc?: number;
    memo?: string;
  }): Promise<ApiResponse<GatewayVerificationResponse>> => {
    return api.post('/wallet/verify-ltc', payload);
  },

  verifyMoMo: async (payload: {
    transId: string;
    amount?: number;
    memo?: string;
  }): Promise<ApiResponse<GatewayVerificationResponse>> => {
    return api.post('/wallet/verify-momo', payload);
  },

  verifyVietQr: async (payload: {
    transferCode: string;
    amount?: number;
  }): Promise<ApiResponse<GatewayVerificationResponse>> => {
    return api.post('/wallet/verify-vietqr', payload);
  }
};
