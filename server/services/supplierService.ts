export interface SupplierBalanceResult {
  supplierId: string;
  supplierName: string;
  balance: number;
  currency: string;
  status: 'ONLINE' | 'LOW_BALANCE' | 'OFFLINE';
  lastChecked: string;
}

export interface SupplierOrderResult {
  success: boolean;
  supplierRef?: string;
  deliveredKeys?: string[];
  errorMessage?: string;
}

export interface SupplierAdapter {
  supplierId: string;
  supplierName: string;
  checkBalance(): Promise<SupplierBalanceResult>;
  orderProductKey(productSku: string, quantity: number): Promise<SupplierOrderResult>;
  orderDirectGameTopup(gameSku: string, uid: string, tierSku: string): Promise<SupplierOrderResult>;
}

class MockGarenaDirectAdapter implements SupplierAdapter {
  public supplierId = 'sup-garena-01';
  public supplierName = 'Garena Official Open API Gateway';

  async checkBalance(): Promise<SupplierBalanceResult> {
    return {
      supplierId: this.supplierId,
      supplierName: this.supplierName,
      balance: 14500000,
      currency: 'VND',
      status: 'ONLINE',
      lastChecked: new Date().toISOString()
    };
  }

  async orderProductKey(productSku: string, quantity: number): Promise<SupplierOrderResult> {
    const keys: string[] = [];
    for (let i = 0; i < quantity; i++) {
      keys.push(`GARENA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
    return {
      success: true,
      supplierRef: `GAR-TX-${Date.now()}`,
      deliveredKeys: keys
    };
  }

  async orderDirectGameTopup(gameSku: string, uid: string, tierSku: string): Promise<SupplierOrderResult> {
    return {
      success: true,
      supplierRef: `GAR-TOPUP-${Date.now()}`
    };
  }
}

class SupplierHub {
  private adapters: Map<string, SupplierAdapter> = new Map();

  constructor() {
    const garena = new MockGarenaDirectAdapter();
    this.adapters.set(garena.supplierId, garena);
  }

  public registerAdapter(adapter: SupplierAdapter): void {
    this.adapters.set(adapter.supplierId, adapter);
  }

  public async checkAllBalances(): Promise<SupplierBalanceResult[]> {
    const results: SupplierBalanceResult[] = [];
    for (const adapter of this.adapters.values()) {
      try {
        const bal = await adapter.checkBalance();
        results.push(bal);
      } catch (err: any) {
        results.push({
          supplierId: adapter.supplierId,
          supplierName: adapter.supplierName,
          balance: 0,
          currency: 'VND',
          status: 'OFFLINE',
          lastChecked: new Date().toISOString()
        });
      }
    }
    return results;
  }
}

export const supplierHub = new SupplierHub();
