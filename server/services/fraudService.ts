export interface FraudAssessment {
  riskScore: number; // 0 - 100
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: string[];
  action: 'ALLOW' | 'CHALLENGE_2FA' | 'MANUAL_REVIEW' | 'BLOCK';
}

class FraudService {
  private userRecentTxCount: Map<string, { count: number; lastTime: number }> = new Map();
  private failedAttempts: Map<string, number> = new Map();

  public assessTransaction(params: {
    userId: string;
    amount: number;
    ip?: string;
    userAgent?: string;
    actionType: 'DEPOSIT' | 'WITHDRAWAL' | 'BUY_INSTANT' | 'JOIN_POOL' | 'TELCO_SUBMIT';
  }): FraudAssessment {
    const factors: string[] = [];
    let score = 0;

    // 1. Velocity check (Transactions per minute)
    const now = Date.now();
    const velocity = this.userRecentTxCount.get(params.userId) || { count: 0, lastTime: now };
    if (now - velocity.lastTime < 60000) {
      velocity.count += 1;
    } else {
      velocity.count = 1;
      velocity.lastTime = now;
    }
    this.userRecentTxCount.set(params.userId, velocity);

    if (velocity.count > 10) {
      score += 45;
      factors.push('Tần suất giao dịch bất thường (>10 req/phút)');
    } else if (velocity.count > 5) {
      score += 20;
      factors.push('Tần suất giao dịch cao');
    }

    // 2. High amount check
    if (params.amount >= 20000000) {
      score += 35;
      factors.push('Giá trị đơn hàng cực lớn (>=20M VNĐ)');
    } else if (params.amount >= 5000000) {
      score += 15;
      factors.push('Giá trị đơn hàng cao');
    }

    // 3. Telco card fraud check
    if (params.actionType === 'TELCO_SUBMIT') {
      const fails = this.failedAttempts.get(params.userId) || 0;
      if (fails >= 3) {
        score += 50;
        factors.push('Nhiều lần gửi thẻ cào không hợp lệ liên tiếp');
      }
    }

    // Determine Level and Action
    let level: FraudAssessment['level'] = 'LOW';
    let action: FraudAssessment['action'] = 'ALLOW';

    if (score >= 80) {
      level = 'CRITICAL';
      action = 'BLOCK';
    } else if (score >= 50) {
      level = 'HIGH';
      action = 'MANUAL_REVIEW';
    } else if (score >= 30) {
      level = 'MEDIUM';
      action = 'CHALLENGE_2FA';
    }

    return {
      riskScore: Math.min(100, score),
      level,
      factors,
      action
    };
  }

  public recordFailedAttempt(userId: string): void {
    const current = this.failedAttempts.get(userId) || 0;
    this.failedAttempts.set(userId, current + 1);
  }

  public resetFailedAttempts(userId: string): void {
    this.failedAttempts.delete(userId);
  }
}

export const fraudService = new FraudService();
