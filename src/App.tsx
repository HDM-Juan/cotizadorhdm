
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { SearchQuery, PartSearchResult, HistoricalData, DevicePrices, QuoteSettings, GeminiResponse, LocalSupplierRecord } from './types';
import { fetchQuotes } from './services/geminiService';
import { fetchAndParseSupplierData } from './services/localSuppliersService';
import { MOCK_QUERY, MOCK_HISTORICAL_DATA, DEVICE_TYPES, BRANDS, MODELS, PARTS, VARIANTS } from './constants';
import AnalysisChart from './components/AnalysisChart';
import Button from './components/ui/Button';
import DataSourcePanel from './components/DataSourcePanel';

// DATA TYPES
interface QuoteDisplayData {
    customerPrice: number;
    deliveryTime: string;
    notes: string;
}

// UI HELPER COMPONENTS
const Header: React.FC = () => (
    <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_x_sC1z-A3yUe_U-V2sIzr7SZYwP_T83o-Q&s" alt="Hospital del Móvil Logo" className="h-12 w-12 rounded-full object-cover" />
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                    Cotizador de Refacciones <span className="text-brand-red">Hospital del Móvil</span>
                </h1>
            </div>
        </div>
    </header>
);

const QuoteTemplatePanel: React.FC<{ settings: QuoteSettings, setSettings: React.Dispatch<React.SetStateAction<QuoteSettings>> }> = ({ settings, setSettings }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = (e.target as HTMLInputElement).checked;
        
        setSettings(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSettings(prev => ({ ...prev, headerImage: event.target?.result as string }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <div className="container mx-auto px-4 md:px-8 mb-4">
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <button onClick={() => setIsOpen(!isOpen)} className="w-full p-3 text-left font-semibold text-gray-700 flex justify-between items-center focus:outline-none" aria-expanded={isOpen} aria-controls="template-settings">
                    <span><i className="fas fa-edit mr-2"></i>Personalizar Plantilla de Cotización</span>
                    <i className={`fas fa-chevron-down transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                </button>
                {isOpen && (
                    <div id="template-settings" className="p-4 border-t divide-y">
                        {/* Section: Header */}
                        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <h3 className="md:col-span-2 text-lg font-semibold text-gray-700">Encabezado y Marca</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Nombre de la Empresa</label>
                                <input type="text" name="brandName" value={settings.brandName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Logo / Imagen de Encabezado</label>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-red file:text-white hover:file:bg-brand-red-dark"/>
                            </div>
                        </div>

                        {/* Section: Contact Info */}
                        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                             <h3 className="md:col-span-2 text-lg font-semibold text-gray-700">Información de Contacto</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Teléfono</label>
                                <input type="text" name="phoneNumber" value={settings.phoneNumber} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                                <label className="flex items-center mt-2 text-sm"><input type="checkbox" name="showPhoneNumber" checked={settings.showPhoneNumber} onChange={handleChange} className="mr-2"/>Mostrar Teléfono</label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Correo Electrónico</label>
                                <input type="text" name="email" value={settings.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                                <label className="flex items-center mt-2 text-sm"><input type="checkbox" name="showEmail" checked={settings.showEmail} onChange={handleChange} className="mr-2"/>Mostrar Correo</label>
                            </div>
                        </div>

                        {/* Section: Terms */}
                        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <h3 className="md:col-span-2 text-lg font-semibold text-gray-700">Términos de la Cotización</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Texto de Garantía</label>
                                <textarea name="warrantyInfo" value={settings.warrantyInfo} onChange={handleChange} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-600">Vigencia</label>
                                <input type="text" name="quoteValidity" value={settings.quoteValidity} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                            </div>
                        </div>
                        
                        {/* Section: Attribution */}
                        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <h3 className="md:col-span-2 text-lg font-semibold text-gray-700">Atribución y Fecha</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">Atendido por</label>
                                <input type="text" name="salesperson" value={settings.salesperson} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                                <label className="flex items-center mt-2 text-sm"><input type="checkbox" name="showSalesperson" checked={settings.showSalesperson} onChange={handleChange} className="mr-2"/>Mostrar "Atendido por"</label>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-600">Fecha Automática</label>
                                <div className="p-2 mt-1 bg-gray-100 rounded-md text-gray-700">{new Date().toLocaleDateString('es-MX')}</div>
                                <label className="flex items-center mt-2 text-sm"><input type="checkbox" name="showDate" checked={settings.showDate} onChange={handleChange} className="mr-2"/>Mostrar Fecha</label>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// SECTION 1: SEARCH FORM
const QuoteForm: React.FC<{ onSearch: (query: SearchQuery) => void; isLoading: boolean; }> = ({ onSearch, isLoading }) => {
    const [formState, setFormState] = useState<SearchQuery>(MOCK_QUERY);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prevState => {
            const newState = { ...prevState, [name]: value };
            // If brand changes, reset model to the first available one
            if (name === 'brand') {
                newState.model = MODELS[value]?.[0] || '';
            }
            return newState;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(formState);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-700">1. Iniciar Búsqueda</h2>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label htmlFor="deviceType" className="block text-sm font-medium text-gray-600">Tipo Dispositivo</label>
                        <select id="deviceType" name="deviceType" value={formState.deviceType} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500">
                            {DEVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="brand" className="block text-sm font-medium text-gray-600">Marca</label>
                        <select id="brand" name="brand" value={formState.brand} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500">
                            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="model" className="block text-sm font-medium text-gray-600">Modelo</label>
                        <select id="model" name="model" value={formState.model} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500">
                            {MODELS[formState.brand]?.map(m => <option key={m} value={m}>{m}</option>) || <option value="">Seleccione marca</option>}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="part" className="block text-sm font-medium text-gray-600">Pieza</label>
                        <select id="part" name="part" value={formState.part} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500">
                            {PARTS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="variant1" className="block text-sm font-medium text-gray-600">Variante 1</label>
                        <select id="variant1" name="variant1" value={formState.variant1} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500">
                            {VARIANTS.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="variant2" className="block text-sm font-medium text-gray-600">Variante 2</label>
                        <select id="variant2" name="variant2" value={formState.variant2} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500">
                            {VARIANTS.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading} leftIcon={isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}>
                        {isLoading ? 'Buscando...' : 'Cotizar Pieza'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

// SECTION 2 & 3: ANALYSIS & HISTORY
const ResultsTable: React.FC<{ title: string, results: PartSearchResult[] }> = ({ title, results }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">{title}</h3>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Plataforma/Proveedor</th>
                        <th scope="col" className="px-6 py-3">Precio (MXN)</th>
                        <th scope="col" className="px-6 py-3">Rating</th>
                        <th scope="col" className="px-6 py-3">Entrega</th>
                        <th scope="col" className="px-6 py-3">Condición</th>
                        <th scope="col" className="px-6 py-3">Enlace</th>
                    </tr>
                </thead>
                <tbody>
                    {results.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-4 text-gray-500">No se encontraron resultados.</td></tr>
                    ) : (
                        results.map((item) => (
                            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{item.platform}</td>
                                <td className="px-6 py-4">${item.priceMXN.toLocaleString('es-MX')}</td>
                                <td className="px-6 py-4">{item.sellerRating.toFixed(1)} ★</td>
                                <td className="px-6 py-4">{item.deliveryTime}</td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${item.condition === 'Nuevo' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.condition}</span></td>
                                <td className="px-6 py-4"><a href={item.url} target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline">Ver <i className="fas fa-external-link-alt fa-xs"></i></a></td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const HistorySection: React.FC<{ data: HistoricalData[] }> = ({ data }) => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-700">3. Historial de Cotizaciones (Misma Pieza)</h2>
        <div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr>
                <th scope="col" className="px-6 py-3">Fecha</th><th scope="col" className="px-6 py-3">Precio Ofrecido (MXN)</th><th scope="col" className="px-6 py-3">Resultado</th>
            </tr></thead>
            <tbody>{data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                <tr key={item.id} className={`border-b ${item.accepted ? 'bg-green-50' : 'bg-red-50'} hover:bg-gray-100`}>
                    <td className="px-6 py-4">{new Date(item.date).toLocaleDateString('es-MX')}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">${item.offeredPrice.toLocaleString('es-MX')}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-bold rounded-full ${item.accepted ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{item.accepted ? 'ACEPTADO' : 'NO ACEPTADO'}</span></td>
                </tr>
            ))}</tbody>
        </table></div>
    </div>
);

// SECTION 4: CUSTOMER QUOTE GENERATOR
const QuoteConfigurator: React.FC<{ title: string; allResults: PartSearchResult[]; defaultSort: 'fast' | 'cheap'; onUpdate: (data: QuoteDisplayData) => void; }> = ({ title, allResults, defaultSort, onUpdate }) => {
    const [config, setConfig] = useState({ customerPrice: 0, deliveryTime: '', notes: 'Incluye instalación y mano de obra profesional.', basedOnId: '' });

    useEffect(() => {
        if (allResults.length > 0) {
            const sorted = defaultSort === 'fast'
                ? [...allResults].sort((a, b) => (parseInt(a.deliveryTime) || 99) - (parseInt(b.deliveryTime) || 99) || a.priceMXN - b.priceMXN)
                : [...allResults].sort((a, b) => a.priceMXN - b.priceMXN);
            
            if (sorted[0]) handleBaseSelection(sorted[0].id, sorted[0]);
        }
    }, [allResults, defaultSort]);

    useEffect(() => {
        const { basedOnId, ...displayData } = config;
        onUpdate(displayData);
    }, [config, onUpdate]);

    const handleBaseSelection = (resultId: string, preloadedResult?: PartSearchResult) => {
        const result = preloadedResult || allResults.find(r => r.id === resultId);
        if (!result) return;
        setConfig({
            basedOnId: result.id,
            customerPrice: Math.ceil(result.priceMXN * 1.35 / 10) * 10,
            deliveryTime: result.deliveryTime,
            notes: 'Incluye instalación y mano de obra profesional.',
        });
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-bold text-lg mb-3 text-gray-800">{title}</h4>
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-600">Basado en opción:</label>
                    <select onChange={(e) => handleBaseSelection(e.target.value)} value={config.basedOnId} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
                        <option value="">Seleccionar...</option>
                        {allResults.map(r => <option key={r.id} value={r.id}>{r.platform} - ${r.priceMXN.toLocaleString('es-MX')} ({r.deliveryTime})</option>)}
                    </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-600">Precio al Cliente (MXN)</label><input type="number" name="customerPrice" value={config.customerPrice} onChange={handleInputChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-600">Tiempo de Entrega</label><input type="text" name="deliveryTime" value={config.deliveryTime} onChange={handleInputChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-600">Notas Adicionales</label><textarea name="notes" value={config.notes} onChange={handleInputChange} rows={2} className="mt-1 block w-full p-2 rounded-md border-gray-300 shadow-sm"></textarea></div>
            </div>
        </div>
    );
};

const QuoteCard: React.FC<{ title: string; data: QuoteDisplayData; query: SearchQuery }> = ({ title, data, query }) => (
    <div className="border rounded-lg shadow-sm p-4 bg-white flex flex-col h-full">
        <div className="flex-grow">
            <div className="mb-2">
                <p className="text-xs text-gray-500">Cotización para:</p>
                <p className="font-semibold text-sm text-gray-800">{query.part} para {query.brand} {query.model}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center my-2 border border-gray-200">
                <p className="text-sm font-semibold text-brand-red">{title}</p>
                <p className="text-4xl font-extrabold text-gray-900 my-1">${Number(data.customerPrice).toLocaleString('es-MX')}</p>
                <p className="text-sm text-gray-700">Entrega: <span className="font-semibold">{data.deliveryTime}</span></p>
            </div>
        </div>
        <div className="text-xs text-gray-600 mt-2"><strong className="font-semibold">Notas:</strong> {data.notes}</div>
    </div>
);

const CustomerQuoteGenerator: React.FC<{ allResults: PartSearchResult[], settings: QuoteSettings, query: SearchQuery }> = ({ allResults, settings, query }) => {
    const exportRef = useRef<HTMLDivElement>(null);
    const [quotes, setQuotes] = useState<{ option1: QuoteDisplayData | null; option2: QuoteDisplayData | null; }>({ option1: null, option2: null });

    const handleQuoteUpdate = useCallback((optionKey: 'option1' | 'option2', data: QuoteDisplayData) => {
        setQuotes(prev => ({ ...prev, [optionKey]: data }));
    }, []);

    const handleExport = useCallback(() => {
        if (!exportRef.current) return;
        toPng(exportRef.current, { cacheBust: true, backgroundColor: '#ffffff', quality: 0.98, pixelRatio: 2 })
            .then(dataUrl => {
                const link = document.createElement('a');
                link.download = `Cotizacion-HMOV-${query.model.replace(/\s/g, '')}-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
            }).catch(err => console.error('Error al exportar imagen:', err));
    }, [query]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-700">4. Generar Cotización para Cliente</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <QuoteConfigurator title="Opción 1: Entrega Rápida" allResults={allResults} defaultSort="fast" onUpdate={(data) => handleQuoteUpdate('option1', data)} />
                <QuoteConfigurator title="Opción 2: Más Económica" allResults={allResults} defaultSort="cheap" onUpdate={(data) => handleQuoteUpdate('option2', data)} />
            </div>

            <h3 className="text-lg font-semibold mb-2 text-gray-700">Vista Previa para Exportar</h3>
            <div ref={exportRef} className="p-6 bg-white rounded-lg border">
                {/* Header */}
                <div className="text-center border-b pb-4 mb-4">
                    {settings.headerImage && (
                        <img src={settings.headerImage} alt="Encabezado de la empresa" className="max-w-full h-auto mx-auto mb-4 max-h-32 object-contain" />
                    )}
                    <h3 className="font-bold text-2xl text-gray-800">{settings.brandName}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {settings.showPhoneNumber && <span>Tel: {settings.phoneNumber}</span>}
                        {settings.showPhoneNumber && settings.showEmail && <span className="mx-2">|</span>}
                        {settings.showEmail && <span>{settings.email}</span>}
                    </p>
                </div>
                
                {/* Body */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                    {quotes.option1 && <QuoteCard title="Entrega Rápida" data={quotes.option1} query={query} />}
                    {quotes.option2 && <QuoteCard title="Más Económica" data={quotes.option2} query={query} />}
                </div>

                {/* Footer */}
                <div className="text-center mt-4 pt-4 border-t text-xs text-gray-500 space-y-1">
                    <p><strong className="font-semibold">Garantía:</strong> {settings.warrantyInfo}</p>
                    <p>
                        {settings.showSalesperson && <span>Atendido por: {settings.salesperson}</span>}
                        {settings.showSalesperson && settings.showDate && <span className="mx-2">|</span>}
                        {settings.showDate && <span>Fecha: {new Date().toLocaleDateString('es-MX')}</span>}
                        {(settings.showSalesperson || settings.showDate) && <span className="mx-2">|</span>}
                        <span><strong className="font-semibold">Vigencia:</strong> {settings.quoteValidity}</span>
                    </p>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <Button onClick={handleExport} leftIcon={<i className="fas fa-camera"></i>}>Exportar a PNG</Button>
            </div>
        </div>
    );
};

// MAIN APP COMPONENT
const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showResults, setShowResults] = useState<boolean>(false);
    const [analysisData, setAnalysisData] = useState<GeminiResponse | null>(null);
    const [historicalData] = useState<HistoricalData[]>(MOCK_HISTORICAL_DATA);
    const [query, setQuery] = useState<SearchQuery>(MOCK_QUERY);
    
    // Local Suppliers State
    const [sheetUrl, setSheetUrl] = useState<string>('');
    const [localSuppliersLoading, setLocalSuppliersLoading] = useState<boolean>(false);
    const [localSuppliersError, setLocalSuppliersError] = useState<string | null>(null);
    const [allLocalSupplierRecords, setAllLocalSupplierRecords] = useState<LocalSupplierRecord[]>([]);
    const [filteredLocalSuppliers, setFilteredLocalSuppliers] = useState<PartSearchResult[]>([]);

    const [allPartResults, setAllPartResults] = useState<PartSearchResult[]>([]);
    
    const [showChart, setShowChart] = useState<boolean>(true);
    const [showTables, setShowTables] = useState<boolean>(true);
    
    const [settings, setSettings] = useState<QuoteSettings>({
        brandName: 'Hospital del Móvil',
        headerImage: null,
        phoneNumber: '55-1234-5678',
        email: 'contacto@hospitaldelmovil.com',
        showPhoneNumber: true,
        showEmail: true,
        quoteValidity: '7 días',
        warrantyInfo: 'Garantía de 90 días en la instalación y pieza.',
        salesperson: 'Juan Pérez',
        showSalesperson: true,
        showDate: true
    });
    
    const loadSupplierData = useCallback(async () => {
        if (!sheetUrl) return;
        setLocalSuppliersLoading(true);
        setLocalSuppliersError(null);
        try {
            const data = await fetchAndParseSupplierData(sheetUrl);
            setAllLocalSupplierRecords(data);
        } catch (err: any) {
            setLocalSuppliersError(err.message);
        } finally {
            setLocalSuppliersLoading(false);
        }
    }, [sheetUrl]);

    useEffect(() => {
        loadSupplierData();
    }, [loadSupplierData]);

    const handleSearch = useCallback(async (searchQuery: SearchQuery) => {
        setIsLoading(true);
        setError(null);
        setShowResults(false);
        setQuery(searchQuery);

        // Filter local suppliers based on the search query
        const relevantLocalRecords = allLocalSupplierRecords.filter(r =>
            r.brand.toLowerCase() === searchQuery.brand.toLowerCase() &&
            r.model.toLowerCase() === searchQuery.model.toLowerCase() &&
            r.part.toLowerCase() === searchQuery.part.toLowerCase()
        );

        const localResultsForDisplay: PartSearchResult[] = relevantLocalRecords.map(r => ({
            id: r.id,
            platform: r.platform,
            priceMXN: r.priceMXN,
            sellerRating: 5.0, // Defaulting as not available from sheet
            deliveryTime: r.deliveryTime,
            condition: 'Nuevo', // Assuming all local parts are new
            url: '#'
        }));
        setFilteredLocalSuppliers(localResultsForDisplay);

        try {
            const data = await fetchQuotes(searchQuery);
            setAnalysisData(data);
            setAllPartResults(Array.from(new Map([...data.partResults, ...localResultsForDisplay].map(item => [item.id, item])).values()));
            setShowResults(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [allLocalSupplierRecords]);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Header />
            <DataSourcePanel 
                sheetUrl={sheetUrl} 
                setSheetUrl={setSheetUrl} 
                onRefresh={loadSupplierData}
                isLoading={localSuppliersLoading}
                error={localSuppliersError}
            />
            <QuoteTemplatePanel settings={settings} setSettings={setSettings} />
            <main className="container mx-auto p-4 md:p-8">
                <QuoteForm onSearch={handleSearch} isLoading={isLoading} />
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">{error}</div>}

                {showResults && analysisData && (
                    <>
                        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-700">2. Análisis de Precios</h2>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={showChart} onChange={() => setShowChart(!showChart)} className="form-checkbox h-5 w-5" /><span className="text-sm">Ver Gráfica</span></label>
                                    <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={showTables} onChange={() => setShowTables(!showTables)} className="form-checkbox h-5 w-5" /><span className="text-sm">Ver Tablas</span></label>
                                </div>
                            </div>
                            {showChart && <AnalysisChart partResults={allPartResults} devicePrices={analysisData.devicePrices} historicalData={historicalData} />}
                            {showTables && (
                                <div className="mt-8">
                                    <ResultsTable title="Resultados de Búsqueda en Línea" results={analysisData.partResults} />
                                    <ResultsTable title="Proveedores Locales" results={filteredLocalSuppliers} />
                                </div>
                            )}
                        </div>

                        <HistorySection data={historicalData} />
                        
                        <CustomerQuoteGenerator allResults={allPartResults} settings={settings} query={query} />
                    </>
                )}
            </main>
        </div>
    );
};

export default App;