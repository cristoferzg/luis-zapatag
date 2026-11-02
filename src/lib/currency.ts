// Centralized Currency & Exchange Rate Utility for Innova Contratistas
import { useState, useEffect } from 'react';
import { safeStorage } from './storageManager';

export interface CurrencyConfig {
  code: string;           // ISO code e.g. 'PEN', 'USD', 'EUR', 'MXN', 'COP'
  name: string;           // e.g. 'Sol Peruano'
  symbol: string;         // e.g. 'S/', '$', '€', 'Bs.'
  flag: string;           // e.g. '🇵🇪', '🇺🇸'
  country: string;        // e.g. 'Perú', 'Estados Unidos'
  locale: string;         // e.g. 'es-PE', 'en-US'
  rateVsUSD: number;      // Exchange rate vs 1 USD (e.g. USD=1.0, PEN=3.75, EUR=0.92, MXN=18.5)
}

export const WORLD_CURRENCIES: CurrencyConfig[] = [
  { code: 'PEN', name: 'Sol Peruano', symbol: 'S/', flag: '🇵🇪', country: 'Perú', locale: 'es-PE', rateVsUSD: 3.75 },
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$', flag: '🇺🇸', country: 'Estados Unidos', locale: 'en-US', rateVsUSD: 1.00 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', country: 'Unión Europea', locale: 'es-ES', rateVsUSD: 0.92 },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$', flag: '🇲🇽', country: 'México', locale: 'es-MX', rateVsUSD: 18.50 },
  { code: 'COP', name: 'Peso Colombiano', symbol: '$', flag: '🇨🇴', country: 'Colombia', locale: 'es-CO', rateVsUSD: 3950.00 },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$', flag: '🇨🇱', country: 'Chile', locale: 'es-CL', rateVsUSD: 940.00 },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$', flag: '🇦🇷', country: 'Argentina', locale: 'es-AR', rateVsUSD: 980.00 },
  { code: 'BOB', name: 'Boliviano', symbol: 'Bs.', flag: '🇧🇴', country: 'Bolivia', locale: 'es-BO', rateVsUSD: 6.91 },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$', flag: '🇧🇷', country: 'Brasil', locale: 'pt-BR', rateVsUSD: 5.45 },
  { code: 'CRC', name: 'Colón Costarricense', symbol: '₡', flag: '🇨🇷', country: 'Costa Rica', locale: 'es-CR', rateVsUSD: 525.00 },
  { code: 'DOP', name: 'Peso Dominicano', symbol: 'RD$', flag: '🇩🇴', country: 'República Dominicana', locale: 'es-DO', rateVsUSD: 59.50 },
  { code: 'GTQ', name: 'Quetzal Guatemalteco', symbol: 'Q', flag: '🇬🇹', country: 'Guatemala', locale: 'es-GT', rateVsUSD: 7.75 },
  { code: 'HNL', name: 'Lempira Hondureño', symbol: 'L', flag: '🇭🇳', country: 'Honduras', locale: 'es-HN', rateVsUSD: 24.70 },
  { code: 'NIO', name: 'Córdoba Nicaragüense', symbol: 'C$', flag: '🇳🇮', country: 'Nicaragua', locale: 'es-NI', rateVsUSD: 36.70 },
  { code: 'PYG', name: 'Guaraní Paraguayo', symbol: '₲', flag: '🇵🇾', country: 'Paraguay', locale: 'es-PY', rateVsUSD: 7550.00 },
  { code: 'UYU', name: 'Peso Uruguayo', symbol: '$U', flag: '🇺🇾', country: 'Uruguay', locale: 'es-UY', rateVsUSD: 40.20 },
  { code: 'VES', name: 'Bolívar Venezolano', symbol: 'Bs.S', flag: '🇻🇪', country: 'Venezuela', locale: 'es-VE', rateVsUSD: 36.60 },
  { code: 'CAD', name: 'Dólar Canadiense', symbol: 'CA$', flag: '🇨🇦', country: 'Canadá', locale: 'en-CA', rateVsUSD: 1.37 },
  { code: 'GBP', name: 'Libra Esterlina', symbol: '£', flag: '🇬🇧', country: 'Reino Unido', locale: 'en-GB', rateVsUSD: 0.78 },
  { code: 'CHF', name: 'Franco Suizo', symbol: 'CHF', flag: '🇨🇭', country: 'Suiza', locale: 'de-CH', rateVsUSD: 0.89 },
  { code: 'JPY', name: 'Yen Japonés', symbol: '¥', flag: '🇯🇵', country: 'Japón', locale: 'ja-JP', rateVsUSD: 158.00 },
  { code: 'AUD', name: 'Dólar Australiano', symbol: 'A$', flag: '🇦🇺', country: 'Australia', locale: 'en-AU', rateVsUSD: 1.50 },
  { code: 'PAB', name: 'Balboa Panameño', symbol: 'B/.', flag: '🇵🇦', country: 'Panamá', locale: 'es-PA', rateVsUSD: 1.00 },
  { code: 'SVC', name: 'Colón Salvadoreño', symbol: '$', flag: '🇸🇻', country: 'El Salvador', locale: 'es-SV', rateVsUSD: 1.00 }
];

const CURRENCY_STORAGE_KEY = 'innova_company_currency_config';

export function getCompanyCurrency(): CurrencyConfig {
  const saved = safeStorage.getItem<CurrencyConfig | null>(CURRENCY_STORAGE_KEY, null);
  if (saved && saved.code) {
    return saved;
  }
  return WORLD_CURRENCIES[0]; // PEN default
}

export function saveCompanyCurrency(config: CurrencyConfig): void {
  safeStorage.setItem(CURRENCY_STORAGE_KEY, config);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('company_currency_changed', { detail: config }));
  }
}

export function useCompanyCurrency(): CurrencyConfig {
  const [currency, setCurrency] = useState<CurrencyConfig>(() => getCompanyCurrency());

  useEffect(() => {
    const handleUpdate = () => {
      setCurrency(getCompanyCurrency());
    };
    window.addEventListener('company_currency_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('company_currency_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return currency;
}

export function formatCurrencyWithSymbol(amount: number, customConfig?: Partial<CurrencyConfig>): string {
  const config = { ...getCompanyCurrency(), ...customConfig };
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  
  try {
    const formatted = new Intl.NumberFormat(config.locale || 'es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
    
    return `${config.symbol} ${formatted}`;
  } catch {
    return `${config.symbol} ${num.toFixed(2)}`;
  }
}

export function convertAmount(amount: number, fromCode: string, toCode: string): number {
  const fromCurr = WORLD_CURRENCIES.find(c => c.code === fromCode) || WORLD_CURRENCIES[0];
  const toCurr = WORLD_CURRENCIES.find(c => c.code === toCode) || WORLD_CURRENCIES[0];
  
  if (fromCurr.code === toCurr.code) return amount;
  
  // Convert from origin currency to USD, then to target currency
  const amountInUSD = amount / fromCurr.rateVsUSD;
  return amountInUSD * toCurr.rateVsUSD;
}

export function convertFromPEN(amountInPEN: number, targetCurrency?: CurrencyConfig): { 
  amount: number; 
  formatted: string; 
  symbol: string; 
  code: string 
} {
  const target = targetCurrency || getCompanyCurrency();
  const converted = convertAmount(amountInPEN, 'PEN', target.code);
  return {
    amount: converted,
    formatted: formatCurrencyWithSymbol(converted, target),
    symbol: target.symbol,
    code: target.code
  };
}

export function formatConvertedPrice(
  basePriceInPEN: number = 0,
  originalPriceInPEN?: number,
  discountPercentage?: number,
  customCurrency?: CurrencyConfig
): {
  finalPrice: number;
  finalPriceFormatted: string;
  originalPrice?: number;
  originalPriceFormatted?: string;
  discountPct?: number;
  symbol: string;
  code: string;
} {
  const curr = customCurrency || getCompanyCurrency();
  const convertedFinal = convertAmount(basePriceInPEN, 'PEN', curr.code);
  const formattedFinal = formatCurrencyWithSymbol(convertedFinal, curr);
  
  let convertedOriginal: number | undefined;
  let formattedOriginal: string | undefined;
  let discountPct = discountPercentage;

  if (originalPriceInPEN && originalPriceInPEN > basePriceInPEN) {
    convertedOriginal = convertAmount(originalPriceInPEN, 'PEN', curr.code);
    formattedOriginal = formatCurrencyWithSymbol(convertedOriginal, curr);
    if (!discountPct) {
      discountPct = Math.round(((originalPriceInPEN - basePriceInPEN) / originalPriceInPEN) * 100);
    }
  }

  return {
    finalPrice: convertedFinal,
    finalPriceFormatted: formattedFinal,
    originalPrice: convertedOriginal,
    originalPriceFormatted: formattedOriginal,
    discountPct,
    symbol: curr.symbol,
    code: curr.code
  };
}

