// ==============================================================================
// CYBERPOOL: DYNAMIC PRICING & ROUNDING ENGINE
// ==============================================================================
import { PriceRoundingRule, PricingRuleConfig } from './types';

export type RoundingMode = 'ROUND' | 'ROUND_UP' | 'ROUND_DOWN';

export interface PriceCalculationParams {
  originalPrice: number;
  originalCurrency: string;
  priceOverride?: number;
  productMarkupPercent?: number;
  productFixedMarkup?: number;
  categoryMarkupPercent?: number;
  categoryFixedMarkup?: number;
  accountMarkupPercent?: number;
  accountFixedMarkup?: number;
  roundingRule?: PriceRoundingRule;
  roundingMode?: RoundingMode;
}

export class PricingEngine {
  private globalDefaults: PricingRuleConfig = {
    fxRate: 1.0, // 1 for VND, or 26000 for USD
    markupPercent: 5.0, // 5% default markup
    fixedMarkup: 5000, // 5,000 VND default margin
    roundingRule: 1000,
    autoSyncPrice: true
  };

  /**
   * Calculate final sale price applying strict hierarchical overrides:
   * 1. Product Override (Hard price override)
   * 2. Product-level Markup
   * 3. Category-level Markup
   * 4. Source Account-level Markup
   * 5. Global Default
   */
  public calculateFinalPrice(params: PriceCalculationParams): {
    basePriceVnd: number;
    finalPrice: number;
    effectiveMarkupPercent: number;
    effectiveFixedMarkup: number;
    appliedRule: string;
  } {
    // 1. Direct Product Price Override has highest priority
    if (params.priceOverride !== undefined && params.priceOverride > 0) {
      return {
        basePriceVnd: params.originalPrice,
        finalPrice: params.priceOverride,
        effectiveMarkupPercent: 0,
        effectiveFixedMarkup: 0,
        appliedRule: 'PRODUCT_OVERRIDE'
      };
    }

    // Determine FX Rate (USD -> VND = 26,000, default VND -> VND = 1.0)
    let fxRate = 1.0;
    if (params.originalCurrency?.toUpperCase() === 'USD') {
      fxRate = 26000.0;
    } else if (params.originalCurrency?.toUpperCase() === 'THB') {
      fxRate = 750.0;
    }

    const basePriceVnd = params.originalPrice * fxRate;

    // Hierarchy of markups
    let markupPercent = this.globalDefaults.markupPercent;
    let fixedMarkup = this.globalDefaults.fixedMarkup;
    let appliedRule = 'GLOBAL_DEFAULT';

    if (params.accountMarkupPercent !== undefined || params.accountFixedMarkup !== undefined) {
      markupPercent = params.accountMarkupPercent ?? markupPercent;
      fixedMarkup = params.accountFixedMarkup ?? fixedMarkup;
      appliedRule = 'ACCOUNT_OVERRIDE';
    }

    if (params.categoryMarkupPercent !== undefined || params.categoryFixedMarkup !== undefined) {
      markupPercent = params.categoryMarkupPercent ?? markupPercent;
      fixedMarkup = params.categoryFixedMarkup ?? fixedMarkup;
      appliedRule = 'CATEGORY_OVERRIDE';
    }

    if (params.productMarkupPercent !== undefined || params.productFixedMarkup !== undefined) {
      markupPercent = params.productMarkupPercent ?? markupPercent;
      fixedMarkup = params.productFixedMarkup ?? fixedMarkup;
      appliedRule = 'PRODUCT_MARKUP_OVERRIDE';
    }

    // Formula: (base_price_vnd * (1 + markup_percent / 100)) + fixed_markup
    const rawCalculatedPrice = (basePriceVnd * (1 + markupPercent / 100)) + fixedMarkup;

    // Apply Rounding Rule
    const roundingRule = params.roundingRule || this.globalDefaults.roundingRule;
    const roundingMode = params.roundingMode || 'ROUND';
    const finalPrice = this.roundPrice(rawCalculatedPrice, roundingRule, roundingMode);

    return {
      basePriceVnd,
      finalPrice,
      effectiveMarkupPercent: markupPercent,
      effectiveFixedMarkup: fixedMarkup,
      appliedRule
    };
  }

  /**
   * Round price to nearest step (100, 500, 1000, 5000, 10000)
   */
  public roundPrice(price: number, step: PriceRoundingRule = 1000, mode: RoundingMode = 'ROUND'): number {
    if (step <= 0) return Math.round(price);
    switch (mode) {
      case 'ROUND_UP':
        return Math.ceil(price / step) * step;
      case 'ROUND_DOWN':
        return Math.floor(price / step) * step;
      case 'ROUND':
      default:
        return Math.round(price / step) * step;
    }
  }

  public getGlobalDefaults(): PricingRuleConfig {
    return { ...this.globalDefaults };
  }

  public updateGlobalDefaults(updates: Partial<PricingRuleConfig>): void {
    this.globalDefaults = { ...this.globalDefaults, ...updates };
  }
}

export const pricingEngine = new PricingEngine();
