// Servicio para cargar datos dinámicos de inventario desde Google Sheets

interface GoogleSheetDevice {
  ID_Modelo: string;
  Dispositivo: string;
  Marca_Modelo: string;  
  Marca: string;         // ESTA es la columna correcta para Marca
  Modelo: string;
  Etiqueta: string;      // ESTA es la columna correcta para Modelo (display)
  Modelo_Activo: boolean | string;  // Puede venir como string del CSV
  'Marca Activa': boolean | string;
}

interface GoogleSheetPart {
  Pieza: string;
  Tipo: string; // 'Interior' | 'Exterior' | 'Equipo'
  'Otros Nombres': string;
  Activo: boolean | string;  // Puede venir como string del CSV
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
    // PASO 1: Limpiar el CSV de caracteres problemáticos
    let cleanedCSV = csvText
      .replace(/\r\n/g, '\n')  // Normalizar saltos de línea
      .replace(/\r/g, '\n')    // Convertir \r sueltos a \n
      .replace(/\n+/g, '\n')   // Eliminar líneas vacías múltiples
      .trim();
    
    console.log('📋 CSV limpiado, longitud original:', csvText.length, 'limpiado:', cleanedCSV.length);
    
    const lines = cleanedCSV.split('\n');
    if (lines.length < 2) {
      console.warn('CSV vacío o sin datos después de limpieza');
      return [];
    }
    
    console.log(`📊 Total de líneas después de limpieza: ${lines.length}`);
    
    // PASO 2: Parsing más robusto que maneja comillas mal cerradas
    const parseCSVLine = (line: string, lineNumber: number): string[] => {
      // Detectar líneas problemáticas que parecen continuaciones
      if (line.startsWith('Available as ') || 
          line.startsWith('For ') || 
          line.startsWith('Acer ') && !line.includes(',')) {
        console.warn(`🚨 Línea ${lineNumber} parece ser continuación de línea anterior:`, line.substring(0, 50));
        return []; // Devolver array vacío para ignorar esta línea
      }
      
      const result = [];
      let current = '';
      let inQuotes = false;
      let i = 0;
      
      while (i < line.length) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          // Manejar comillas dobles escapadas ""
          if (inQuotes && nextChar === '"') {
            current += '"';
            i += 2;
            continue;
          }
          // Alternar estado de comillas
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          // Nueva columna solo si no estamos dentro de comillas
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
        i++;
      }
      
      // Agregar el último valor
      result.push(current.trim());
      
      // Validar que la línea tenga un número razonable de columnas
      if (result.length < 10) {
        console.warn(`⚠️ Línea ${lineNumber} tiene muy pocas columnas (${result.length}):`, result);
        return []; // Ignorar líneas con muy pocas columnas
      }
      
      return result;
    };
    
    // PASO 3: Procesar headers
    const headers = parseCSVLine(lines[0], 1).map(h => h.replace(/"/g, ''));
    console.log('📋 Headers encontrados:', headers.length, 'columnas');
    console.log('📋 Primeros headers:', headers.slice(0, 10));
    
    if (headers.length === 0) {
      console.error('❌ No se pudieron extraer headers válidos');
      return [];
    }
    
    // PASO 4: Procesar datos línea por línea, saltando líneas problemáticas
    const data = [];
    let validLines = 0;
    let skippedLines = 0;
    
    for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const values = parseCSVLine(line, lineIndex + 1).map(v => v.replace(/"/g, ''));
      
      // Saltar líneas vacías o inválidas
      if (values.length === 0) {
        skippedLines++;
        continue;
      }
      
      // Intentar ajustar desalineamientos menores
      if (values.length !== headers.length) {
        const diff = Math.abs(values.length - headers.length);
        
        // Solo intentar corregir desalineamientos menores (hasta 8 columnas de diferencia)
        if (diff <= 8) {
          console.warn(`🔧 Ajustando línea ${lineIndex + 1}: esperadas ${headers.length}, encontradas ${values.length}`);
          
          // Rellenar valores faltantes
          while (values.length < headers.length) {
            values.push('');
          }
          // Truncar valores extras
          if (values.length > headers.length) {
            values.splice(headers.length);
          }
        } else {
          console.warn(`❌ Saltando línea ${lineIndex + 1} por desalineamiento severo: esperadas ${headers.length}, encontradas ${values.length}`);
          skippedLines++;
          continue;
        }
      }
      
      // Crear objeto mapeado
      const obj: any = {};
      headers.forEach((header, index) => {
        let value: any = values[index] || '';
        
        // Convertir valores booleanos
        if (typeof value === 'string') {
          if (value.toLowerCase() === 'true') value = true;
          else if (value.toLowerCase() === 'false') value = false;
        }
        
        obj[header] = value;
      });
      
      // Log detallado solo para las primeras líneas válidas
      if (validLines < 3) {
        console.log(`✅ Línea válida ${validLines + 1}:`, {
          line_number: lineIndex + 1,
          mapping_sample: {
            Dispositivo: `"${obj.Dispositivo}"`,
            Marca: `"${obj.Marca}"`,
            Etiqueta: `"${obj.Etiqueta}"`,
            Modelo_Activo: `"${obj.Modelo_Activo}"`
          }
        });
      }
      
      data.push(obj);
      validLines++;
    }
    
    console.log(`✅ Procesamiento CSV completado:`);
    console.log(`   - Líneas válidas procesadas: ${validLines}`);
    console.log(`   - Líneas saltadas: ${skippedLines}`);
    console.log(`   - Total headers: ${headers.length}`);
    
    return data;
  } catch (error) {
    console.error('❌ Error crítico al parsear CSV:', error);
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
    console.log(`📊 Dispositivos parseados exitosamente: ${devices.length} registros`);
    
    if (devices.length === 0) {
      console.warn('❌ No se encontraron dispositivos después del parsing, usando datos por defecto');
      return getDefaultDeviceData();
    }
    
    // Verificar que las columnas requeridas existen
    const firstDevice = devices[0];
    const requiredColumns = ['Dispositivo', 'Marca', 'Etiqueta', 'Modelo_Activo'];
    const missingColumns = requiredColumns.filter(col => !(col in firstDevice));
    
    if (missingColumns.length > 0) {
      console.error('❌ Columnas faltantes en el CSV:', missingColumns);
      console.error('📋 Columnas disponibles:', Object.keys(firstDevice));
      
      // Buscar columnas similares
      const availableColumns = Object.keys(firstDevice);
      missingColumns.forEach(missing => {
        const similar = availableColumns.filter(col => 
          col.toLowerCase().includes(missing.toLowerCase()) || 
          missing.toLowerCase().includes(col.toLowerCase())
        );
        if (similar.length > 0) {
          console.warn(`🔍 Columnas similares a "${missing}":`, similar);
        }
      });
      
      console.warn('Usando datos por defecto debido a columnas faltantes');
      return getDefaultDeviceData();
    }
    
    // VALIDACIÓN CRÍTICA: Verificar que los datos están en las columnas correctas
    console.log('🔍 Validando mapeo de columnas...');
    const sampleDevice = devices[0];
    console.log(`📝 Muestra de mapeo:`, {
      'Dispositivo': `"${sampleDevice.Dispositivo}"`,
      'Marca': `"${sampleDevice.Marca}"`,
      'Etiqueta': `"${sampleDevice.Etiqueta}"`,
      'Modelo_Activo': `"${sampleDevice.Modelo_Activo}"`,
    });
    
    console.log('✅ Todas las columnas requeridas están presentes:', requiredColumns);
    
    // Filtrar dispositivos activos
    const activeDevices = devices.filter((d, index) => {
      const modeloActivo = String(d.Modelo_Activo).toLowerCase();
      const isActive = modeloActivo !== 'false' && d.Modelo_Activo !== false;
      
      // Log solo para los primeros 3 registros para verificar
      if (index < 3) {
        console.log(`📋 Dispositivo ${index + 1}: ${d.Marca} - ${d.Etiqueta} (Activo: ${isActive})`);
      }
      
      return isActive;
    });
    
    console.log(`✅ Dispositivos activos: ${activeDevices.length} de ${devices.length} total`);
    
    // Extraer tipos de dispositivos únicos de la columna "Dispositivo"
    const deviceTypes = [...new Set(activeDevices
      .map(d => {
        const dispositivo = d.Dispositivo;
        
        // VALIDACIÓN ESTRICTA: Verificar que no sea un valor de otra columna
        if (typeof dispositivo !== 'string') {
          console.warn('❌ Valor no-string en columna Dispositivo:', dispositivo, 'en registro:', d.ID_Modelo);
          return null;
        }
        
        if (!dispositivo.trim()) {
          console.warn('❌ Valor vacío en columna Dispositivo para registro:', d.ID_Modelo);
          return null;
        }
        
        const dispositivoTrimmed = dispositivo.trim();
        
        // Detectar si parece ser un valor de otra columna
        if (dispositivoTrimmed.match(/^[A-Z0-9_-]+$/i) && dispositivoTrimmed.length < 4) {
          console.warn('⚠️ Posible valor mezclado en columna Dispositivo (parece código):', dispositivoTrimmed, 'en registro:', d.ID_Modelo);
        }
        
        return dispositivoTrimmed;
      })
      .filter(d => d !== null)  // Filtrar valores nulos
    )].sort();
    
    console.log('✅ Tipos de dispositivos en columna "Dispositivo":', deviceTypes.slice(0, 10), `(total: ${deviceTypes.length})`);
    
    // Extraer marcas únicas de la columna "Marca" (NO Marca_Modelo)
    const brands = [...new Set(activeDevices
      .map(d => {
        const marca = d.Marca;  // Usar columna Marca como especificaste
        
        // VALIDACIÓN ESTRICTA: Verificar que no sea un valor de otra columna
        if (typeof marca !== 'string') {
          console.warn('❌ Valor no-string en columna Marca:', marca, 'en registro:', d.ID_Modelo);
          return null;
        }
        
        if (!marca.trim()) {
          console.warn('❌ Valor vacío en columna Marca para registro:', d.ID_Modelo);
          return null;
        }
        
        // Detectar si parece ser un valor de otra columna (por ejemplo, un ID o código)
        const marcaTrimmed = marca.trim();
        if (marcaTrimmed.match(/^[A-Z0-9_-]+$/i) && marcaTrimmed.length < 3) {
          console.warn('⚠️ Posible valor mezclado en columna Marca (parece código):', marcaTrimmed, 'en registro:', d.ID_Modelo);
        }
        
        return marcaTrimmed;
      })
      .filter(m => m !== null)  // Filtrar valores nulos
    )].sort();
    
    console.log('✅ Marcas encontradas en columna "Marca":', brands.slice(0, 10), `(total: ${brands.length})`);
    
    // VERIFICACIÓN ADICIONAL: Comprobar si las marcas parecen correctas
    const suspicious = brands.filter(brand => 
      brand.length < 3 || 
      /^[0-9]+$/.test(brand) || 
      brand.includes('_') || 
      brand.includes('-')
    );
    if (suspicious.length > 0) {
      console.warn('⚠️ Marcas sospechosas detectadas (pueden ser datos mezclados):', suspicious);
    }
    
    // Organizar modelos por marca usando la columna "Etiqueta" para el display (como especificaste)
    const models: { [key: string]: { id: string; label: string; model: string }[] } = {};
    brands.forEach(brand => {
      console.log(`\n🔍 Procesando marca: "${brand}"`);
      
      const devicesForBrand = activeDevices.filter(d => d.Marca === brand);  // Filtrar por columna Marca
      console.log(`   Dispositivos encontrados para "${brand}":`, devicesForBrand.length);
      
      models[brand] = devicesForBrand
        .filter(d => {
          const etiqueta = d.Etiqueta;  // Usar columna Etiqueta como especificaste
          const isValid = etiqueta && typeof etiqueta === 'string' && etiqueta.trim();
          if (!isValid) {
            console.warn(`   ❌ Etiqueta inválida para ${brand}:`, etiqueta, 'en registro:', d);
          }
          return isValid;
        })
        .map(d => {
          const modelData = {
            id: d.ID_Modelo || `${d.Marca}_${d.Etiqueta}`, // Usar Marca y Etiqueta
            label: d.Etiqueta.trim(),  // USAR ETIQUETA como especificaste para el display
            model: d.Modelo || d.Etiqueta.trim()   // Fallback al Modelo o Etiqueta
          };
          console.log(`   ✓ Modelo agregado para ${brand}:`, modelData);
          return modelData;
        })
        .sort((a, b) => a.label.localeCompare(b.label));
        
      console.log(`   Total modelos para "${brand}":`, models[brand].length);
    });
    
    console.log('Modelos organizados por marca:', Object.keys(models).map(brand => `${brand}: ${models[brand].length} modelos`));
    console.log('Muestra de modelos por marca:', Object.keys(models).slice(0, 2).map(brand => ({
      marca: brand,
      modelos: models[brand].slice(0, 3)
    })));
    
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
    console.log('Intentando cargar piezas. URL configurada:', PARTS_SHEET_URL);
    
    if (!PARTS_SHEET_URL) {
      console.warn('URL de Google Sheet de piezas no configurada, usando datos por defecto');
      return getDefaultPartsData();
    }

    console.log('Realizando fetch a:', PARTS_SHEET_URL);
    const response = await fetch(PARTS_SHEET_URL);
    
    if (!response.ok) {
      console.error('Error en la respuesta de piezas:', response.status, response.statusText);
      throw new Error(`Error al obtener datos de piezas: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log('CSV de piezas recibido, primeras 200 caracteres:', csvText.substring(0, 200));
    
    const parts: GoogleSheetPart[] = parseCSV(csvText);
    console.log('Piezas parseadas:', parts.length);
    console.log('Muestra de piezas parseadas:', parts.slice(0, 3));
    
    if (parts.length === 0) {
      console.warn('No se encontraron piezas, usando datos por defecto');
      return getDefaultPartsData();
    }
    
    // Filtrar EXACTAMENTE como especificaste:
    // - Tipo debe ser "Interior", "Exterior" o "Equipo"  
    // - Activo NO debe ser false
    const activeParts = parts.filter(p => {
      const tipoValido = ['Interior', 'Exterior', 'Equipo'].includes(p.Tipo);
      const activoString = String(p.Activo).toLowerCase();
      const esActivo = activoString !== 'false' && p.Activo !== false;
      
      const esValido = tipoValido && esActivo;
      
      if (!esValido) {
        console.log('Pieza filtrada:', { 
          Pieza: p.Pieza, 
          Tipo: p.Tipo, 
          Activo: p.Activo,
          razon: !tipoValido ? 'Tipo inválido' : 'Inactiva'
        });
      }
      
      return esValido;
    });
    
    console.log('Piezas activas después del filtro:', activeParts.length);
    console.log('Muestra de piezas activas:', activeParts.slice(0, 3));
    
    // Extraer nombres de piezas únicos de la columna "Pieza"
    const partNames = [...new Set(activeParts
      .map(p => p.Pieza)
      .filter(p => p && p.trim())  // Filtrar valores vacíos
    )].sort();
    
    console.log('Nombres de piezas encontrados:', partNames);
    
    // Crear detalles de piezas con nombres alternativos de "Otros Nombres"
    const partDetails: { [key: string]: { names: string[]; type: string } } = {};
    activeParts.forEach(part => {
      if (!part.Pieza || !part.Pieza.trim()) return; // Skip si Pieza está vacía
      
      const otherNames = part['Otros Nombres'] ? 
        part['Otros Nombres'].split(',').map(n => n.trim()).filter(n => n) : 
        [];
      
      // Si ya existe esta pieza, combinar los otros nombres
      if (partDetails[part.Pieza]) {
        const existingNames = new Set(partDetails[part.Pieza].names);
        otherNames.forEach(name => existingNames.add(name));
        partDetails[part.Pieza].names = Array.from(existingNames);
      } else {
        partDetails[part.Pieza] = {
          names: [part.Pieza, ...otherNames],
          type: part.Tipo
        };
      }
    });
    
    console.log('Detalles de piezas creados:', Object.keys(partDetails).length);
    console.log('Muestra de detalles:', Object.keys(partDetails).slice(0, 3).map(key => ({
      pieza: key,
      nombres: partDetails[key].names,
      tipo: partDetails[key].type
    })));
    
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


