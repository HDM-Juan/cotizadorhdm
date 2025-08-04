// Servicio para cargar datos dinámicos de inventario desde Google Sheets

interface GoogleSheetDevice {
  Dispositivo: string;
  Marca: string;
  Modelo: string;
  Etiqueta: string;
  ID_Modelo: string;
  Modelo_Activo: boolean;
}

interface GoogleSheetPart {
  Pieza: string;
  Tipo: string; // 'Interior' | 'Exterior' | 'Equipo'
  'Otros Nombres': string;
  Activo: boolean;
}

// URLs de las hojas publicadas como CSV (se configuran dinámicamente)
let DEVICE_SHEET_URL = ''; // URL de la hoja DispMarModelo_2024 publicada como CSV
let PARTS_SHEET_URL = '';  // URL de la hoja Piezas publicada como CSV

// Función para configurar las URLs de Google Sheets
export function configureGoogleSheetURLs(deviceUrl: string, partsUrl: string) {
  DEVICE_SHEET_URL = deviceUrl;
  PARTS_SHEET_URL = partsUrl;
  console.log('URLs configuradas:', { DEVICE_SHEET_URL, PARTS_SHEET_URL });
}

// Función para probar las URLs de Google Sheets
export async function testGoogleSheetURLs(deviceUrl: string, partsUrl: string): Promise<{
  deviceUrlValid: boolean;
  partsUrlValid: boolean;
  deviceError?: string;
  partsError?: string;
}> {
  const result = {
    deviceUrlValid: false,
    partsUrlValid: false,
    deviceError: undefined as string | undefined,
    partsError: undefined as string | undefined
  };

  // Probar URL de dispositivos
  if (deviceUrl) {
    try {
      console.log('Probando URL de dispositivos:', deviceUrl);
      const response = await fetch(deviceUrl);
      if (response.ok) {
        const text = await response.text();
        if (text.length > 10) {
          result.deviceUrlValid = true;
          console.log('URL de dispositivos válida ✓');
        } else {
          result.deviceError = 'La URL devuelve contenido vacío';
        }
      } else {
        result.deviceError = `Error HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error) {
      result.deviceError = `Error de red: ${error}`;
    }
  }

  // Probar URL de piezas
  if (partsUrl) {
    try {
      console.log('Probando URL de piezas:', partsUrl);
      const response = await fetch(partsUrl);
      if (response.ok) {
        const text = await response.text();
        if (text.length > 10) {
          result.partsUrlValid = true;
          console.log('URL de piezas válida ✓');
        } else {
          result.partsError = 'La URL devuelve contenido vacío';
        }
      } else {
        result.partsError = `Error HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error) {
      result.partsError = `Error de red: ${error}`;
    }
  }

  return result;
}

// Función para parsear CSV con mejor manejo de errores
function parseCSV(csvText: string): any[] {
  try {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      console.warn('CSV vacío o sin datos');
      return [];
    }
    
    // Manejo más robusto de CSV con comillas y comas dentro de valores
    const parseCSVLine = (line: string): string[] => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));
    console.log('Headers encontrados:', headers);
    
    const data = lines.slice(1).map(line => {
      const values = parseCSVLine(line).map(v => v.replace(/"/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        let value: any = values[index] || '';
        
        // Convertir valores booleanos
        if (value.toLowerCase() === 'true') value = true;
        else if (value.toLowerCase() === 'false') value = false;
        
        obj[header] = value;
      });
      return obj;
    });
    
    console.log(`Parseados ${data.length} registros del CSV`);
    return data;
  } catch (error) {
    console.error('Error al parsear CSV:', error);
    return [];
  }
}

// Función para obtener dispositivos desde Google Sheets
export async function fetchDevicesFromSheet(): Promise<{
  deviceTypes: string[];
  brands: string[];
  models: { [key: string]: { id: string; label: string; model: string }[] };
}> {
  try {
    console.log('Intentando cargar dispositivos. URL configurada:', DEVICE_SHEET_URL);
    
    if (!DEVICE_SHEET_URL) {
      console.warn('URL de Google Sheet no configurada, usando datos por defecto');
      return getDefaultDeviceData();
    }

    console.log('Realizando fetch a:', DEVICE_SHEET_URL);
    const response = await fetch(DEVICE_SHEET_URL);
    
    if (!response.ok) {
      console.error('Error en la respuesta:', response.status, response.statusText);
      throw new Error(`Error al obtener datos de dispositivos: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log('CSV recibido, primeras 200 caracteres:', csvText.substring(0, 200));
    
    const devices: GoogleSheetDevice[] = parseCSV(csvText);
    console.log('Dispositivos parseados:', devices.length);
    
    if (devices.length === 0) {
      console.warn('No se encontraron dispositivos, usando datos por defecto');
      return getDefaultDeviceData();
    }
    
    // Filtrar solo dispositivos activos
    const activeDevices = devices.filter(d => d.Modelo_Activo !== false);
    console.log('Dispositivos activos:', activeDevices.length);
    
    // Extraer tipos de dispositivos únicos
    const deviceTypes = [...new Set(activeDevices.map(d => d.Dispositivo))].sort();
    console.log('Tipos de dispositivos encontrados:', deviceTypes);
    
    // Extraer marcas únicas
    const brands = [...new Set(activeDevices.map(d => d.Marca))].sort();
    console.log('Marcas encontradas:', brands);
    
    // Organizar modelos por marca
    const models: { [key: string]: { id: string; label: string; model: string }[] } = {};
    brands.forEach(brand => {
      models[brand] = activeDevices
        .filter(d => d.Marca === brand)
        .map(d => ({
          id: d.ID_Modelo,
          label: d.Etiqueta,
          model: d.Modelo
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    });
    
    console.log('Modelos organizados por marca:', Object.keys(models).map(brand => `${brand}: ${models[brand].length} modelos`));
    
    return { deviceTypes, brands, models };
    
  } catch (error) {
    console.error('Error al cargar dispositivos desde Google Sheets:', error);
    return getDefaultDeviceData();
  }
}

// Función para obtener piezas desde Google Sheets
export async function fetchPartsFromSheet(): Promise<{
  parts: string[];
  partDetails: { [key: string]: { names: string[]; type: string } };
}> {
  try {
    if (!PARTS_SHEET_URL) {
      console.warn('URL de Google Sheet no configurada, usando datos por defecto');
      return getDefaultPartsData();
    }

    const response = await fetch(PARTS_SHEET_URL);
    if (!response.ok) throw new Error('Error al obtener datos de piezas');
    
    const csvText = await response.text();
    const parts: GoogleSheetPart[] = parseCSV(csvText);
    
    // Filtrar solo piezas activas de tipos válidos
    const activeParts = parts.filter(p => 
      p.Activo !== false && 
      ['Interior', 'Exterior', 'Equipo'].includes(p.Tipo)
    );
    
    // Extraer nombres de piezas únicos
    const partNames = [...new Set(activeParts.map(p => p.Pieza))].sort();
    
    // Crear detalles de piezas con nombres alternativos
    const partDetails: { [key: string]: { names: string[]; type: string } } = {};
    activeParts.forEach(part => {
      const otherNames = part['Otros Nombres'] ? 
        part['Otros Nombres'].split(',').map(n => n.trim()).filter(n => n) : 
        [];
      
      partDetails[part.Pieza] = {
        names: [part.Pieza, ...otherNames],
        type: part.Tipo
      };
    });
    
    return { parts: partNames, partDetails };
    
  } catch (error) {
    console.error('Error al cargar piezas desde Google Sheets:', error);
    return getDefaultPartsData();
  }
}

// Datos por defecto como fallback
function getDefaultDeviceData() {
  return {
    deviceTypes: ['Celular', 'Tablet', 'Smartwatch'],
    brands: ['Samsung', 'Apple', 'Xiaomi', 'Motorola', 'Huawei'],
    models: {
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
    }
  };
}

function getDefaultPartsData() {
  return {
    parts: ['Display', 'Batería', 'Cámara Trasera', 'Puerto de Carga'],
    partDetails: {
      'Display': { names: ['Display', 'Pantalla', 'LCD', 'OLED'], type: 'Exterior' },
      'Batería': { names: ['Batería', 'Battery', 'Pila'], type: 'Interior' },
      'Cámara Trasera': { names: ['Cámara Trasera', 'Cámara Principal', 'Main Camera'], type: 'Equipo' },
      'Puerto de Carga': { names: ['Puerto de Carga', 'Conector USB', 'Puerto USB-C'], type: 'Interior' }
    }
  };
}


