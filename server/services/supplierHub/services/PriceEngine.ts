import { PriceConfig, PriceRoundingUnit, RoundingMode } from '../types';

export class PriceEngine {
  /**
   * Calculates final selling price from supplier cost and price rules
   */
  public static calculatePrice(params: {
    supplierPrice: number;
    priceConfig: PriceConfig;
    manualPrice?: number;
    manualPriceOverride?: boolean;
  }): {
    calculatedPrice: number;
    finalPrice: number;
    markupAmount: number;
    projectedProfit: number;
  } {
    const { supplierPrice, priceConfig, manualPrice, manualPriceOverride } = params;

    // 1. Calculate raw markup
    let markupAmount = 0;
    if (priceConfig.markupType === 'PERCENT') {
      markupAmount = Math.round(supplierPrice * (priceConfig.markupValue / 100));
    } else {
      markupAmount = Math.round(priceConfig.markupValue);
    }

    let rawCalculated = supplierPrice + markupAmount;

    // 2. Apply rounding
    const calculatedPrice = this.applyRounding(
      rawCalculated, 
      priceConfig.roundingUnit, 
      priceConfig.roundingMode
    );

    // 3. Check Manual Override rule
    let finalPrice = calculatedPrice;
    if (manualPriceOverride && typeof manualPrice === 'number' && manualPrice > 0) {
      finalPrice = manualPrice;
    }

    const projectedProfit = Math.max(0, finalPrice - supplierPrice);

    return {
      calculatedPrice,
      finalPrice,
      markupAmount,
      projectedProfit
    };
  }

  /**
   * Applies rounding according to configured unit and direction
   */
  public static applyRounding(
    amount: number, 
    unit: PriceRoundingUnit, 
    mode: RoundingMode
  ): number {
    if (unit === 0 || mode === 'OFF') {
      return amount;
    }

    switch (mode) {
      case 'ROUND_UP':
        return Math.ceil(amount / unit) * unit;
      case 'ROUND_DOWN':
        return Math.floor(amount / unit) * unit;
      case 'ROUND_NEAREST':
      default:
        return Math.round(amount / unit) * unit;
    }
  }
}
