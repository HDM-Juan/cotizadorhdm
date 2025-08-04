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

// Función para parsear CSV
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
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
}

// Función para obtener dispositivos desde Google Sheets
export async function fetchDevicesFromSheet(): Promise<{
  deviceTypes: string[];
  brands: string[];
  models: { [key: string]: { id: string; label: string; model: string }[] };
}> {
  try {
    if (!DEVICE_SHEET_URL) {
      console.warn('URL de Google Sheet no configurada, usando datos por defecto');
      return getDefaultDeviceData();
    }

    const response = await fetch(DEVICE_SHEET_URL);
    if (!response.ok) throw new Error('Error al obtener datos de dispositivos');
    
    const csvText = await response.text();
    const devices: GoogleSheetDevice[] = parseCSV(csvText);
    
    // Filtrar solo dispositivos activos
    const activeDevices = devices.filter(d => d.Modelo_Activo !== false);
    
    // Extraer tipos de dispositivos únicos
    const deviceTypes = [...new Set(activeDevices.map(d => d.Dispositivo))].sort();
    
    // Extraer marcas únicas
    const brands = [...new Set(activeDevices.map(d => d.Marca))].sort();
    
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


