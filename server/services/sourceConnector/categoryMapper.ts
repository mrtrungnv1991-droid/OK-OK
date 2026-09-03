// ==============================================================================
// CYBERPOOL: CATEGORY MAPPING ENGINE
// ==============================================================================
import { CategoryMappingMode, SourceCategoryMapping } from './types';

export class CategoryMapper {
  private mappings: Map<string, SourceCategoryMapping> = new Map();

  constructor() {
    // Seed standard mappings
    this.seedDefaultMappings();
  }

  private seedDefaultMappings(): void {
    const defaults: Array<Partial<SourceCategoryMapping>> = [
      { source_category_id: 'cat-muakey-roblox', source_category_name: 'Robux & Gift Card Roblox', internal_category_id: 'game-roblox', internal_category_name: 'Game Topup / Roblox', mode: 'AUTO' },
      { source_category_id: 'cat-muakey-steam', source_category_name: 'Steam Wallet & Game Key', internal_category_id: 'gift-cards-steam', internal_category_name: 'Gift Cards / Steam', mode: 'AUTO' },
      { source_category_id: 'cat-muakey-entertainment', source_category_name: 'Tài Khoản Giải Trí', internal_category_id: 'accounts-streaming', internal_category_name: 'Premium Accounts / Streaming', mode: 'AUTO' },
      { source_category_id: 'cat-muakey-work', source_category_name: 'Phần Mềm & Công Việc', internal_category_id: 'software-licenses', internal_category_name: 'Software Licenses / Office', mode: 'AUTO' },
      { source_category_id: 'cat-muakey-ai', source_category_name: 'Tài Khoản AI', internal_category_id: 'ai-tools', internal_category_name: 'AI Tools / Accounts', mode: 'AUTO' }
    ];

    for (const d of defaults) {
      const key = `${d.source_category_id}`;
      this.mappings.set(key, {
        id: `map_${d.source_category_id}`,
        source_account_id: 'all',
        source_category_id: d.source_category_id!,
        source_category_name: d.source_category_name!,
        internal_category_id: d.internal_category_id,
        internal_category_name: d.internal_category_name,
        mode: (d.mode as CategoryMappingMode) || 'AUTO',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }

  public resolveCategory(sourceCatId: string, sourceCatName: string): {
    internalCategoryId: string;
    internalCategoryName: string;
    isIgnored: boolean;
  } {
    const mapping = this.mappings.get(sourceCatId);
    if (mapping) {
      if (mapping.mode === 'IGNORE') {
        return { internalCategoryId: '', internalCategoryName: '', isIgnored: true };
      }
      return {
        internalCategoryId: mapping.internal_category_id || 'general',
        internalCategoryName: mapping.internal_category_name || 'General Digital Goods',
        isIgnored: false
      };
    }

    // Auto discover heuristic
    const nameLower = sourceCatName.toLowerCase();
    let intId = 'general';
    let intName = 'General Digital Goods';

    if (nameLower.includes('roblox') || nameLower.includes('robux')) {
      intId = 'game-roblox';
      intName = 'Game Topup / Roblox';
    } else if (nameLower.includes('steam')) {
      intId = 'gift-cards-steam';
      intName = 'Gift Cards / Steam';
    } else if (nameLower.includes('valorant') || nameLower.includes('riot')) {
      intId = 'game-valorant';
      intName = 'Game Topup / Valorant';
    } else if (nameLower.includes('netflix') || nameLower.includes('spotify') || nameLower.includes('youtube')) {
      intId = 'accounts-streaming';
      intName = 'Premium Accounts / Streaming';
    } else if (nameLower.includes('office') || nameLower.includes('windows') || nameLower.includes('software')) {
      intId = 'software-licenses';
      intName = 'Software Licenses';
    }

    return {
      internalCategoryId: intId,
      internalCategoryName: intName,
      isIgnored: false
    };
  }

  public setMapping(mapping: SourceCategoryMapping): void {
    this.mappings.set(mapping.source_category_id, mapping);
  }

  public getAllMappings(): SourceCategoryMapping[] {
    return Array.from(this.mappings.values());
  }
}

export const categoryMapper = new CategoryMapper();
