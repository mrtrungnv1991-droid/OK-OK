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
  }): Promise<ApiResponse<{ message: string; transaction: TransactionRecord }>> => {
    return api.post<{ message: string; transaction: TransactionRecord }>('/wallet/withdraw', payload);
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
