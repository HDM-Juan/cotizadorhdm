import React, { useMemo, useCallback } from 'react';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, Legend, Scatter, Line, ReferenceLine, Area, Label } from 'recharts';
import { PartSearchResult, DevicePrices, HistoricalData } from '../types';

interface AnalysisChartProps {
  partResults: PartSearchResult[];
  devicePrices: DevicePrices | null;
  historicalData: HistoricalData[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.type === 'part') {
        return (
            <div className="p-2 bg-white border rounded shadow-lg text-sm">
              <p className="font-bold">{data.platform}</p>
              <p>Precio: ${data.price.toLocaleString('es-MX')}</p>
              <p>Condición: {data.condition}</p>
              <p>Rating: {data.sellerRating} ★</p>
            </div>
          );
    }
    if(data.type === 'indicator') {
        return (
            <div className="p-2 bg-white border rounded shadow-lg text-sm">
                <p className="font-bold">{data.name}</p>
                <p>Precio: ${data.price.toLocaleString('es-MX')}</p>
            </div>
        );
    }
  }
  return null;
};

const StarShape = (props: any) => {
    const { cx, cy, fill } = props;
    return (
      <path
        d={`M ${cx} ${cy - 5} L ${cx + 1.18} ${cy - 1.55} L ${cx + 4.76} ${cy - 1.55} L ${cx + 1.93} ${cy + 0.59} L ${cx + 3.09} ${cy + 4.05} L ${cx} ${cy + 2} L ${cx - 3.09} ${cy + 4.05} L ${cx - 1.93} ${cy + 0.59} L ${cx - 4.76} ${cy - 1.55} L ${cx - 1.18} ${cy - 1.55} Z`}
        fill={fill}
      />
    );
};

const AnalysisChart: React.FC<AnalysisChartProps> = ({ partResults, devicePrices, historicalData }) => {

    const findClosestIndex = useCallback((price: number, data: any[]) => {
        if (data.length === 0) return 0;
        return data.reduce((prev, curr, i) =>
            (Math.abs(curr.price - price) < Math.abs(data[prev].price - price) ? i : prev), 0);
    }, []);

    const chartData = useMemo(() => {
        const sortedParts = [...partResults].sort((a, b) => a.priceMXN - b.priceMXN);
        return sortedParts.map((part, index) => ({
            index,
            price: part.priceMXN,
            platform: part.platform,
            condition: part.condition,
            sellerRating: part.sellerRating,
            type: 'part'
        }));
    }, [partResults]);

    const indicators = useMemo(() => {
        if (partResults.length === 0) return { line: [], points: [] };

        const prices = partResults.map(p => p.priceMXN);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const threeQuartersAvgPrice = avgPrice * 0.75;
        
        const lineData = [
            { index: findClosestIndex(minPrice, chartData), price: minPrice, name: 'Precio Mínimo' },
            { index: findClosestIndex(threeQuartersAvgPrice, chartData), price: threeQuartersAvgPrice, name: '3/4 Promedio' },
            { index: findClosestIndex(avgPrice, chartData), price: avgPrice, name: 'Promedio' },
            { index: findClosestIndex(maxPrice, chartData), price: maxPrice, name: 'Precio Máximo' },
        ].sort((a,b) => a.index - b.index);

        const pointsData = lineData.map(d => ({...d, type: 'indicator'}));
        
        return { line: lineData, points: pointsData };
    }, [partResults, chartData, findClosestIndex]);
    
    const historicalPoints = useMemo(() => {
        if (historicalData.length === 0) return { accepted: [], rejected: [] };
        
        const accepted = historicalData.filter(h => h.accepted).sort((a, b) => a.offeredPrice - b.offeredPrice);
        const rejected = historicalData.filter(h => !h.accepted).sort((a, b) => a.offeredPrice - b.offeredPrice);

        const highestAcceptedPrice = accepted.length > 0 ? accepted[accepted.length - 1].offeredPrice : -1;
        
        const acceptedPoints = [
            ...accepted.slice(0, 1), // lowest
            ...accepted.slice(-2) // two highest
        ].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i) // unique
         .map(h => ({
            index: findClosestIndex(h.offeredPrice, chartData),
            price: h.offeredPrice,
            name: `Aceptado: $${h.offeredPrice}`,
            type: 'historical'
        }));
        
        const rejectedPoints = rejected
            .filter(r => r.offeredPrice > highestAcceptedPrice)
            .slice(0, 2)
            .map(h => ({
                index: findClosestIndex(h.offeredPrice, chartData),
                price: h.offeredPrice,
                name: `Rechazado: $${h.offeredPrice}`,
                type: 'historical'
            }));

        return { accepted: acceptedPoints, rejected: rejectedPoints };
    }, [historicalData, chartData, findClosestIndex]);

    if (!devicePrices || chartData.length === 0) {
        return <div className="text-center p-8 bg-gray-50 rounded-lg">No hay suficientes datos para generar la gráfica.</div>;
    }

    const { new: newPrices, used: usedPrices } = devicePrices;
    const partAvgPrice = indicators.points.find(p => p.name === 'Promedio')?.price || 0;
    const proportionUsed = usedPrices.average > 0 ? (partAvgPrice / usedPrices.average) * 100 : 0;
    const proportionNew = newPrices.average > 0 ? (partAvgPrice / newPrices.average) * 100 : 0;

    const maxY = Math.max(newPrices.high, ...partResults.map(p => p.priceMXN)) * 1.1;

    return (
        <div className="bg-white p-4 rounded-lg shadow-md relative">
            <ResponsiveContainer width="100%" height={500}>
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                        <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6}/>
                            <stop offset="50%" stopColor="#22c55e" stopOpacity={0.4}/>
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.2}/>
                        </linearGradient>
                        <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6}/>
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        </linearGradient>
                    </defs>

                    <XAxis dataKey="index" tickFormatter={() => ''} label={{ value: 'Precios ordenados de menor a mayor', position: 'insideBottom', offset: -10 }}/>
                    <YAxis domain={[0, maxY]} tickFormatter={(value) => `$${Number(value).toLocaleString('es-MX')}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px'}}/>
                    
                    {/* Background Areas */}
                    <Area type="monotone" dataKey={() => usedPrices.high} fill="url(#colorUsed)" strokeWidth={0} isAnimationActive={false} />
                    <Area type="monotone" dataKey={() => newPrices.high} fill="url(#colorNew)" strokeWidth={0} isAnimationActive={false} />

                    {/* Device Price Lines */}
                    <ReferenceLine y={usedPrices.low} stroke="green" strokeDasharray="3 3" />
                    <ReferenceLine y={usedPrices.average} stroke="green" strokeWidth={2} />
                    <ReferenceLine y={usedPrices.high} stroke="green" />

                    <ReferenceLine y={newPrices.low} stroke="blue" strokeDasharray="3 3" />
                    <ReferenceLine y={newPrices.average} stroke="blue" strokeWidth={2} />
                    <ReferenceLine y={newPrices.high} stroke="blue" />

                    {/* Part Price Points */}
                    <Scatter name="Precios de Piezas" dataKey="price" fill="#4a5568" />
                    
                    {/* Indicator Line and Points */}
                    <Line data={indicators.line} type="monotone" dataKey="price" stroke="#EA2831" strokeWidth={2} dot={false} legendType='none' />
                    <Scatter name="Indicadores de Piezas" data={indicators.points} fill="#EA2831" shape="circle" />
                    
                    {/* Historical Data Points */}
                    <Scatter name="Aceptados Históricos" data={historicalPoints.accepted} fill="#16a34a" shape={<StarShape />} />
                    <Scatter name="Rechazados Relevantes" data={historicalPoints.rejected} fill="#ef4444" shape="circle" />

                    {/* Percentage Labels attached to invisible reference lines for accurate positioning */}
                    <ReferenceLine y={usedPrices.average} stroke="transparent">
                         <Label value={`${proportionUsed.toFixed(1)}%`} position="insideLeft" dx={15} fill="#15803d" style={{ fontSize: '24px', fontWeight: 'bold' }} />
                    </ReferenceLine>
                     <ReferenceLine y={newPrices.average} stroke="transparent">
                         <Label value={`${proportionNew.toFixed(1)}%`} position="insideLeft" dx={15} fill="#1d4ed8" style={{ fontSize: '24px', fontWeight: 'bold' }} />
                    </ReferenceLine>
                
                </ComposedChart>
            </ResponsiveContainer>
            <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>Precios de Equipo Nuevo</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>Precios de Equipo Usado</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-brand-red"></div><span>Indicadores de Pieza</span></div>
                <div className="flex items-center gap-2"><div className="w-0 h-0 border-x-4 border-x-transparent border-b-[6px] border-b-black opacity-50 -rotate-45"></div><span>Líneas: Mín/Prom/Máx</span></div>
            </div>
        </div>
    );
};

export default AnalysisChart;