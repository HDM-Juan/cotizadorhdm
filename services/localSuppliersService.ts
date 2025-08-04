import { LocalSupplierRecord } from '../types';

/**
 * Fetches and parses supplier data from a Google Sheet CSV URL.
 * Assumes the CSV has 10 columns in a specific order and no header row.
 * Order: dispositivo,marca,modelo,pieza,variante1,variante2,llave,nombre_proveedor,tiempo_entrega,precio
 */
export const fetchAndParseSupplierData = async (sheetUrl: string): Promise<LocalSupplierRecord[]> => {
  if (!sheetUrl || !sheetUrl.startsWith('https://docs.google.com/spreadsheets/')) {
    console.warn("Invalid or missing Google Sheet URL.");
    return [];
  }

  try {
    const response = await fetch(sheetUrl);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const csvText = await response.text();
    const records: LocalSupplierRecord[] = [];
    const rows = csvText.trim().replace(/\r\n/g, '\n').split('\n');

    for (const row of rows) {
      if (!row) continue; // Skip empty rows

      // Basic CSV parsing - won't handle commas within quoted fields.
      const columns = row.split(',').map(c => c.trim());

      if (columns.length < 10) {
        console.warn('Skipping malformed row:', row);
        continue;
      }
      
      const price = parseFloat(columns[9]);

      if(isNaN(price)) {
        console.warn('Skipping row with invalid price:', row);
        continue;
      }

      records.push({
        deviceType: columns[0],
        brand: columns[1],
        model: columns[2],
        part: columns[3],
        variant1: columns[4],
        variant2: columns[5],
        id: columns[6], // llave
        platform: columns[7], // nombre_proveedor
        deliveryTime: columns[8],
        priceMXN: price,
      });
    }
    return records;
  } catch (error: any) {
    console.error('Error fetching or parsing supplier data:', error);
    throw new Error('No se pudieron cargar los datos de proveedores locales. Revisa la URL y el formato del CSV.');
  }
};