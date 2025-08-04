
import { SearchQuery, GeminiResponse, HistoricalData } from './types';

// Datos por defecto - serán reemplazados por datos de Google Sheets cuando estén disponibles
export const DEVICE_TYPES = ['Celular', 'Tablet', 'Smartwatch'];
export const BRANDS = ['Samsung', 'Apple', 'Xiaomi', 'Motorola', 'Huawei'];
export const MODELS: { [key: string]: { id: string; label: string; model: string }[] } = {
  'Samsung': [
    { id: 'sam_s23', label: 'Galaxy S23', model: 'S23' },
    { id: 'sam_a54', label: 'Galaxy A54', model: 'A54' },
    { id: 'sam_zf5', label: 'Galaxy Z Fold 5', model: 'Z Fold 5' }
  ],
  'Apple': [
    { id: 'app_i15', label: 'iPhone 15', model: 'iPhone 15' },
    { id: 'app_i14p', label: 'iPhone 14 Pro', model: 'iPhone 14 Pro' },
    { id: 'app_ise', label: 'iPhone SE', model: 'iPhone SE' }
  ],
  'Xiaomi': [
    { id: 'xia_rn12', label: 'Redmi Note 12', model: 'Note 12' },
    { id: 'xia_pf5', label: 'Poco F5', model: 'F5' },
    { id: 'xia_x13t', label: 'Xiaomi 13T', model: '13T' }
  ],
  'Motorola': [
    { id: 'mot_g84', label: 'Moto G84', model: 'G84' },
    { id: 'mot_e40', label: 'Edge 40', model: 'Edge 40' },
    { id: 'mot_r40u', label: 'Razr 40 Ultra', model: 'Razr 40 Ultra' }
  ],
  'Huawei': [
    { id: 'hua_p60p', label: 'P60 Pro', model: 'P60 Pro' },
    { id: 'hua_n11', label: 'Nova 11', model: 'Nova 11' },
    { id: 'hua_mx3', label: 'Mate X3', model: 'Mate X3' }
  ]
};
export const PARTS = ['Display', 'Batería', 'Cámara Trasera', 'Puerto de Carga'];
export const VARIANTS = ['OLED', 'LCD', 'Original', 'Compatible', 'Grado A'];

// URLs de Google Sheets - configurar con tus URLs publicadas como CSV
export const GOOGLE_SHEETS_CONFIG = {
  DEVICE_SHEET_URL: '', // URL de DispMarModelo_2024 publicada como CSV
  PARTS_SHEET_URL: '',  // URL de Piezas publicada como CSV
};

export const MOCK_QUERY: SearchQuery = {
    deviceType: 'Celular',
    brand: 'Apple',
    model: 'iPhone 14 Pro',
    part: 'Display',
    variant1: 'OLED',
    variant2: 'Original'
};

export const MOCK_GEMINI_RESPONSE: GeminiResponse = {
  partResults: [
    { id: 'ml1', platform: 'MercadoLibre', priceMXN: 3500, sellerRating: 4.8, deliveryTime: '2-3 días', condition: 'Nuevo', url: '#' },
    { id: 'ml2', platform: 'MercadoLibre', priceMXN: 3250, sellerRating: 4.9, deliveryTime: '1-2 días', condition: 'Nuevo', url: '#' },
    { id: 'amz1', platform: 'Amazon MX', priceMXN: 3800, sellerRating: 4.7, deliveryTime: '1 día', condition: 'Nuevo', url: '#' },
    { id: 'ali1', platform: 'AliExpress', priceMXN: 2100, sellerRating: 4.5, deliveryTime: '15-20 días', condition: 'Nuevo', url: '#' },
    { id: 'ali2', platform: 'AliExpress', priceMXN: 2350, sellerRating: 4.6, deliveryTime: '12-18 días', condition: 'Nuevo', url: '#' },
    { id: 'ebay1', platform: 'Ebay', priceMXN: 2900, sellerRating: 4.4, deliveryTime: '10-15 días', condition: 'Usado', url: '#' },
  ],
  devicePrices: {
    new: { low: 19000, average: 21500, high: 23000 },
    used: { low: 12000, average: 14000, high: 15500 },
  },
};

export const MOCK_HISTORICAL_DATA: HistoricalData[] = [
    { id: 'h1', date: '2024-05-10', query: MOCK_QUERY, offeredPrice: 3800, accepted: true },
    { id: 'h2', date: '2024-04-22', query: MOCK_QUERY, offeredPrice: 4200, accepted: false },
    { id: 'h3', date: '2024-06-01', query: MOCK_QUERY, offeredPrice: 3650, accepted: true },
    { id: 'h4', date: '2024-06-15', query: MOCK_QUERY, offeredPrice: 4500, accepted: false },
    { id: 'h5', date: '2024-03-18', query: MOCK_QUERY, offeredPrice: 3500, accepted: true },
    { id: 'h6', date: '2024-02-05', query: MOCK_QUERY, offeredPrice: 4000, accepted: true },
];