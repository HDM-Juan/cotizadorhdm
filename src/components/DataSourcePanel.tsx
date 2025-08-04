
import React, { useState } from 'react';
import Button from './ui/Button';
import { testGoogleSheetURLs } from '../services/inventoryService';

interface DataSourcePanelProps {
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  error: string | null;
  inventoryUrls?: {
    deviceUrl: string;
    partsUrl: string;
  };
  onInventoryUrlsChange?: (urls: { deviceUrl: string; partsUrl: string }) => void;
}

const DataSourcePanel: React.FC<DataSourcePanelProps> = ({ 
  sheetUrl, 
  setSheetUrl, 
  onRefresh, 
  isLoading, 
  error,
  inventoryUrls = { deviceUrl: '', partsUrl: '' },
  onInventoryUrlsChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localUrl, setLocalUrl] = useState(sheetUrl);
  const [localInventoryUrls, setLocalInventoryUrls] = useState(inventoryUrls);
  const [testResults, setTestResults] = useState<{ deviceUrlValid: boolean; partsUrlValid: boolean; deviceError?: string; partsError?: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleSave = () => {
    setSheetUrl(localUrl);
  };

  const handleInventorySave = () => {
    if (onInventoryUrlsChange) {
      onInventoryUrlsChange(localInventoryUrls);
    }
  };

  const handleTestUrls = async () => {
    if (!localInventoryUrls.deviceUrl && !localInventoryUrls.partsUrl) return;
    
    setTesting(true);
    try {
      const results = await testGoogleSheetURLs(localInventoryUrls.deviceUrl, localInventoryUrls.partsUrl);
      setTestResults(results);
    } catch (error) {
      console.error('Error probando URLs:', error);
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 md:px-8 mb-4">
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full p-3 text-left font-semibold text-gray-700 flex justify-between items-center focus:outline-none" aria-expanded={isOpen} aria-controls="datasource-settings">
          <span><i className="fas fa-database mr-2"></i>Fuentes de Datos (Proveedores Locales)</span>
          <i className={`fas fa-chevron-down transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
        </button>
        {isOpen && (
          <div id="datasource-settings" className="p-4 border-t">
            <div className="prose prose-sm max-w-none mb-4 text-gray-600">
                <p>Conecta una hoja de Google Sheets para cargar dinámicamente tu lista de proveedores locales.</p>
                <ol>
                    <li>Crea una hoja de Google con 10 columnas, <strong>en este orden exacto</strong>: <code>dispositivo, marca, modelo, pieza, variante1, variante2, llave, nombre_proveedor, tiempo_entrega, precio</code>.</li>
                    <li>Ve a <strong>Archivo &gt; Compartir &gt; Publicar en la web</strong>.</li>
                    <li>Selecciona la hoja correcta y elige <strong>&quot;Valores separados por comas (.csv)&quot;</strong>.</li>
                    <li>Haz clic en &quot;Publicar&quot;, copia la URL generada y pégala abajo.</li>
                </ol>
            </div>
            
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-700 mb-3">📦 Proveedores Locales</h4>
              <label className="block text-sm font-medium text-gray-600 mb-1">URL de Google Sheet (.csv)</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="url" 
                  value={localUrl}
                  onChange={(e) => setLocalUrl(e.target.value)}
                  placeholder="Pega la URL publicada aquí..." 
                  className="flex-grow block w-full rounded-md border-gray-300 shadow-sm p-2" 
                />
                <div className="flex gap-2">
                  <Button onClick={handleSave} variant="secondary">Guardar URL</Button>
                  <Button onClick={onRefresh} disabled={isLoading || !sheetUrl}>
                    {isLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Cargando...</> : <><i className="fas fa-sync-alt mr-2"></i>Refrescar</>}
                  </Button>
                </div>
              </div>
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>

            {onInventoryUrlsChange && (
              <div className="border-t pt-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3">🔧 Configuración de Inventario</h4>
                <div className="prose prose-sm max-w-none mb-4 text-gray-600">
                  <p>Configura las URLs de tus hojas de Google Sheets para cargar dinámicamente los dispositivos y piezas disponibles.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      URL de Hoja "DispMarModelo_2024" (.csv)
                    </label>
                    <input 
                      type="url" 
                      value={localInventoryUrls.deviceUrl}
                      onChange={(e) => setLocalInventoryUrls(prev => ({ ...prev, deviceUrl: e.target.value }))}
                      placeholder="URL de la hoja de dispositivos y modelos..." 
                      className="block w-full rounded-md border-gray-300 shadow-sm p-2" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      URL de Hoja "Piezas" (.csv)
                    </label>
                    <input 
                      type="url" 
                      value={localInventoryUrls.partsUrl}
                      onChange={(e) => setLocalInventoryUrls(prev => ({ ...prev, partsUrl: e.target.value }))}
                      placeholder="URL de la hoja de piezas..." 
                      className="block w-full rounded-md border-gray-300 shadow-sm p-2" 
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Button 
                      onClick={handleTestUrls} 
                      variant="secondary" 
                      disabled={testing || (!localInventoryUrls.deviceUrl && !localInventoryUrls.partsUrl)}
                    >
                      {testing ? (
                        <><i className="fas fa-spinner fa-spin mr-2"></i>Probando...</>
                      ) : (
                        <><i className="fas fa-check-circle mr-2"></i>Probar URLs</>
                      )}
                    </Button>
                    <Button onClick={handleInventorySave} variant="primary">
                      <i className="fas fa-save mr-2"></i>Actualizar Inventario
                    </Button>
                  </div>
                  
                  {testResults && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <h5 className="font-medium text-gray-700 mb-2">Resultados de Prueba:</h5>
                      <div className="space-y-2 text-sm">
                        <div className={`flex items-center ${testResults.deviceUrlValid ? 'text-green-600' : 'text-red-600'}`}>
                          <i className={`fas ${testResults.deviceUrlValid ? 'fa-check-circle' : 'fa-times-circle'} mr-2`}></i>
                          <span>URL Dispositivos: {testResults.deviceUrlValid ? 'Válida' : testResults.deviceError}</span>
                        </div>
                        <div className={`flex items-center ${testResults.partsUrlValid ? 'text-green-600' : 'text-red-600'}`}>
                          <i className={`fas ${testResults.partsUrlValid ? 'fa-check-circle' : 'fa-times-circle'} mr-2`}></i>
                          <span>URL Piezas: {testResults.partsUrlValid ? 'Válida' : testResults.partsError}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSourcePanel;