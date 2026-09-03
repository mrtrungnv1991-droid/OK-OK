export interface AffiliateCommission {
  id: string;
  referrerId: string;
  refereeId: string;
  orderId: string;
  orderAmount: number;
  commissionRate: number; // e.g. 5%
  commissionAmount: number;
  status: 'HOLDING_WARRANTY' | 'UNLOCKED' | 'PAID' | 'REVOKED';
  holdUntil: string; // 7 days after order completion
  createdAt: string;
}

export interface AffiliateStats {
  referralCode: string;
  totalReferees: number;
  totalEarned: number;
  pendingHolding: number;
  availableBalance: number;
}

class AffiliateService {
  private commissions: AffiliateCommission[] = [
    {
      id: 'aff-001',
      referrerId: 'usr-buyer-01',
      refereeId: 'usr-002',
      orderId: 'ord-1001',
      orderAmount: 500000,
      commissionRate: 0.05,
      commissionAmount: 25000,
      status: 'HOLDING_WARRANTY',
      holdUntil: new Date(Date.now() + 5 * 86400000).toISOString(),
      createdAt: new Date().toISOString()
    }
  ];

  private referralCodes: Map<string, string> = new Map([
    ['usr-buyer-01', 'CYBERVIP88'],
    ['usr-admin-01', 'CYBERMASTER']
  ]);

  public getCodeForUser(userId: string): string {
    if (!this.referralCodes.has(userId)) {
      const code = `REF${userId.slice(-4).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
      this.referralCodes.set(userId, code);
    }
    return this.referralCodes.get(userId)!;
  }

  public trackCommission(params: {
    referrerId: string;
    refereeId: string;
    orderId: string;
    orderAmount: number;
    commissionRate?: number;
  }): AffiliateCommission {
    const rate = params.commissionRate || 0.05;
    const amount = Math.round(params.orderAmount * rate);

    // 7-day warranty holding period
    const holdUntil = new Date(Date.now() + 7 * 86400000).toISOString();

    const commission: AffiliateCommission = {
      id: `aff-${Date.now()}`,
      referrerId: params.referrerId,
      refereeId: params.refereeId,
      orderId: params.orderId,
      orderAmount: params.orderAmount,
      commissionRate: rate,
      commissionAmount: amount,
      status: 'HOLDING_WARRANTY',
      holdUntil,
      createdAt: new Date().toISOString()
    };

    this.commissions.unshift(commission);
    return commission;
  }

  public getStats(userId: string): { stats: AffiliateStats; history: AffiliateCommission[] } {
    const userComms = this.commissions.filter(c => c.referrerId === userId);
    const code = this.getCodeForUser(userId);

    let totalEarned = 0;
    let pendingHolding = 0;
    let availableBalance = 0;

    userComms.forEach(c => {
      if (c.status === 'UNLOCKED' || c.status === 'PAID') {
        totalEarned += c.commissionAmount;
        if (c.status === 'UNLOCKED') availableBalance += c.commissionAmount;
      } else if (c.status === 'HOLDING_WARRANTY') {
        pendingHolding += c.commissionAmount;
      }
    });

    const referees = new Set(userComms.map(c => c.refereeId)).size;

    return {
      stats: {
        referralCode: code,
        totalReferees: referees,
        totalEarned,
        pendingHolding,
        availableBalance
      },
      history: userComms
    };
  }

  public releaseMaturedCommissions(): number {
    const now = new Date().toISOString();
    let releasedCount = 0;

    this.commissions.forEach(c => {
      if (c.status === 'HOLDING_WARRANTY' && c.holdUntil <= now) {
        c.status = 'UNLOCKED';
        releasedCount += 1;
      }
    });

    return releasedCount;
  }
}

export const affiliateService = new AffiliateService();
