// ==============================================================================
// CYBERPOOL: SOURCE OFFERS & MULTI-SOURCE ROUTING SERVICE
// ==============================================================================
import { SourceOffer, SourceAccount } from './types';

export interface RouteResolutionResult {
  selectedOffer: SourceOffer | null;
  routingReason: string;
  evaluatedOffers: Array<{
    offerId: string;
    sourceAccount: string;
    price: number;
    stock: number;
    status: string;
    eligible: boolean;
    disqualificationReason?: string;
  }>;
}

export class SourceOfferService {
  private offers: Map<string, SourceOffer> = new Map();

  /**
   * Upsert a source offer from scanned product data
   */
  public upsertOffer(offer: SourceOffer): void {
    const key = `${offer.internal_product_id}:${offer.source_account_id}:${offer.source_product_id}`;
    this.offers.set(key, offer);
  }

  public getOffersForProduct(internalProductId: string): SourceOffer[] {
    return Array.from(this.offers.values()).filter(
      o => o.internal_product_id === internalProductId
    );
  }

  public getAllOffers(): SourceOffer[] {
    return Array.from(this.offers.values());
  }

  /**
   * Selects the optimal source for an internal product order
   * Evaluates: Stock > Account Balance > Account Health > Lowest Price > Priority
   */
  public routeBestSource(
    internalProductId: string,
    quantity: number,
    accountsMap: Map<string, SourceAccount>
  ): RouteResolutionResult {
    const candidates = this.getOffersForProduct(internalProductId);
    if (candidates.length === 0) {
      return {
        selectedOffer: null,
        routingReason: 'NO_OFFERS_FOUND_FOR_PRODUCT',
        evaluatedOffers: []
      };
    }

    const evaluations = candidates.map(offer => {
      const account = accountsMap.get(offer.source_account_id);
      let eligible = true;
      let disqualificationReason = '';

      if (!account) {
        eligible = false;
        disqualificationReason = 'Source account does not exist';
      } else if (account.status !== 'ONLINE') {
        eligible = false;
        disqualificationReason = `Account status is ${account.status}`;
      } else if (offer.stock < quantity) {
        eligible = false;
        disqualificationReason = `Insufficient stock: Needs ${quantity}, source has ${offer.stock}`;
      } else if (account.balance < (offer.source_price * quantity)) {
        eligible = false;
        disqualificationReason = `Insufficient balance: Needs ${(offer.source_price * quantity).toLocaleString('vi-VN')} VND, balance is ${account.balance.toLocaleString('vi-VN')} VND`;
      }

      return {
        offer,
        evaluation: {
          offerId: offer.id,
          sourceAccount: account?.name || offer.source_name || offer.source_account_id,
          price: offer.source_price,
          stock: offer.stock,
          status: offer.status,
          eligible,
          disqualificationReason: disqualificationReason || undefined
        }
      };
    });

    const eligibleOffers = evaluations
      .filter(e => e.evaluation.eligible)
      .map(e => e.offer);

    if (eligibleOffers.length === 0) {
      return {
        selectedOffer: null,
        routingReason: 'ALL_SOURCES_DISQUALIFIED',
        evaluatedOffers: evaluations.map(e => e.evaluation)
      };
    }

    // Sort by: Lowest Cost -> Highest Priority
    eligibleOffers.sort((a, b) => {
      if (a.source_price !== b.source_price) {
        return a.source_price - b.source_price; // Lowest price first
      }
      return b.priority - a.priority; // Higher priority number wins ties
    });

    const best = eligibleOffers[0];
    return {
      selectedOffer: best,
      routingReason: `Selected optimal source ${best.source_name} at lowest cost (${best.source_price.toLocaleString('vi-VN')} VND)`,
      evaluatedOffers: evaluations.map(e => e.evaluation)
    };
  }
}

export const sourceOfferService = new SourceOfferService();
