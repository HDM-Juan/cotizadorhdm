
export interface SearchQuery {
  deviceType: string;
  brand: string;
  model: string;
  part: string;
  variant1: string;
  variant2: string;
}

export interface PartSearchResult {
  platform: string;
  priceMXN: number;
  sellerRating: number;
  deliveryTime: string;
  condition: 'Nuevo' | 'Usado';
  url: string;
  id: string;
}

export interface DevicePrices {
  new: { low: number; average: number; high: number };
  used: { low: number; average: number; high: number };
}

export interface GeminiResponse {
  partResults: PartSearchResult[];
  devicePrices: DevicePrices;
}

export interface HistoricalData {
  id: string;
  date: string;
  query: SearchQuery;
  offeredPrice: number;
  accepted: boolean;
}

export interface CustomerQuoteData {
  date: string;
  customerPrice: number;
  deliveryTime: string;
  part: string;
  variants: string;
  device: string;
  basedOn: PartSearchResult;
  notes: string;
}

export interface QuoteSettings {
  brandName: string;
  headerImage: string | null;
  phoneNumber: string;
  email: string;
  showPhoneNumber: boolean;
  showEmail: boolean;
  quoteValidity: string;
  warrantyInfo: string;
  salesperson: string;
  showSalesperson: boolean;
  showDate: boolean;
}

export interface LocalSupplierRecord {
  deviceType: string;
  brand: string;
  model: string;
  part: string;
  variant1: string;
  variant2: string;
  id: string; // llave
  platform: string; // nombre_proveedor
  deliveryTime: string;
  priceMXN: number;
}