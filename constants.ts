
import { SearchQuery, GeminiResponse, HistoricalData } from './types';

export const DEVICE_TYPES = ['Celular', 'Tablet', 'Smartwatch'];
export const BRANDS = ['Samsung', 'Apple', 'Xiaomi', 'Motorola', 'Huawei'];
export const MODELS: { [key: string]: string[] } = {
  'Samsung': ['Galaxy S23', 'Galaxy A54', 'Galaxy Z Fold 5'],
  'Apple': ['iPhone 15', 'iPhone 14 Pro', 'iPhone SE'],
  'Xiaomi': ['Redmi Note 12', 'Poco F5', 'Xiaomi 13T'],
  'Motorola': ['Moto G84', 'Edge 40', 'Razr 40 Ultra'],
  'Huawei': ['P60 Pro', 'Nova 11', 'Mate X3'],
};
export const PARTS = ['Display', 'Batería', 'Cámara Trasera', 'Puerto de Carga'];
export const VARIANTS = ['OLED', 'LCD', 'Original', 'Compatible', 'Grado A'];

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
