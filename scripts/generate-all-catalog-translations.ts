import fs from 'fs';
import path from 'path';

// Let's create a script that generates src/i18n/catalogData/productsTranslations.ts
const productsMap: Record<string, Record<string, {
  title: string;
  subtitle: string;
  description: string;
  deliveryEstimate: string;
  features: string[];
  instructions: string[];
  tags: string[];
  pools?: Record<string, string>;
}>> = {};

// We will populate all 21 products systematically
