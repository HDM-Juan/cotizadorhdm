
import React, { useState } from 'react';
import Button from './ui/Button';

interface DataSourcePanelProps {
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  error: string | null;
}

const DataSourcePanel: React.FC<DataSourcePanelProps> = ({ sheetUrl, setSheetUrl, onRefresh, isLoading, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localUrl, setLocalUrl] = useState(sheetUrl);

  const handleSave = () => {
    setSheetUrl(localUrl);
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
            
            <div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSourcePanel;