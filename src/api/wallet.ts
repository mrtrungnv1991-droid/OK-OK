import { api, ApiResponse } from './client';
import { TransactionRecord } from '../types';

export const walletApi = {
  getLedger: async (): Promise<ApiResponse<{ walletBalance: number; escrowLocked: number; transactions: TransactionRecord[] }>> => {
    return api.get<{ walletBalance: number; escrowLocked: number; transactions: TransactionRecord[] }>('/wallet/ledger');
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
  }): Promise<ApiResponse<{ receivedAmount: number; newBalance: number; transaction: TransactionRecord }>> => {
    return api.post<{ receivedAmount: number; newBalance: number; transaction: TransactionRecord }>('/wallet/telco-card', payload);
  },

  requestWithdrawal: async (payload: {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }): Promise<ApiResponse<{ message: string; transaction: TransactionRecord }>> => {
    return api.post<{ message: string; transaction: TransactionRecord }>('/wallet/withdraw', payload);
  }
};
