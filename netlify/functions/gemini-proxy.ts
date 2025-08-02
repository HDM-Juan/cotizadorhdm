import { GoogleGenAI, Type } from "@google/genai";
import type { SearchQuery } from '../../types';

const schema = {
  type: Type.OBJECT,
  properties: {
    partResults: {
      type: Type.ARRAY,
      description: 'Lista de resultados de búsqueda de refacciones en plataformas en línea.',
      items: {
        type: Type.OBJECT,
        properties: {
          platform: { type: Type.STRING, description: 'El nombre de la plataforma de comercio electrónico.' },
          priceMXN: { type: Type.NUMBER, description: 'Precio en Pesos Mexicanos.' },
          sellerRating: { type: Type.NUMBER, description: 'Calificación del vendedor de 0 a 5.' },
          deliveryTime: { type: Type.STRING, description: 'Tiempo de entrega estimado en días.' },
          condition: { type: Type.STRING, description: '"Nuevo" o "Usado".' },
          url: { type: Type.STRING, description: 'URL directa a la página del producto.' },
          id: { type: Type.STRING, description: 'ID único para el resultado.' }
        },
        required: ['platform', 'priceMXN', 'sellerRating', 'deliveryTime', 'condition', 'url', 'id']
      }
    },
    devicePrices: {
      type: Type.OBJECT,
      description: 'Precios estimados para el dispositivo completo.',
      properties: {
        new: {
          type: Type.OBJECT,
          properties: {
            low: { type: Type.NUMBER, description: 'Precio bajo estimado del dispositivo nuevo.' },
            average: { type: Type.NUMBER, description: 'Precio promedio estimado del dispositivo nuevo.' },
            high: { type: Type.NUMBER, description: 'Precio alto estimado del dispositivo nuevo.' }
          },
          required: ['low', 'average', 'high']
        },
        used: {
          type: Type.OBJECT,
          properties: {
            low: { type: Type.NUMBER, description: 'Precio bajo estimado del dispositivo usado.' },
            average: { type: Type.NUMBER, description: 'Precio promedio estimado del dispositivo usado.' },
            high: { type: Type.NUMBER, description: 'Precio alto estimado del dispositivo usado.' }
          },
          required: ['low', 'average', 'high']
        }
      },
      required: ['new', 'used']
    }
  },
  required: ['partResults', 'devicePrices']
};


const createPrompt = (query: SearchQuery): string => {
  return `
    Actúa como un experto agregador de datos de comercio electrónico. Tu tarea es encontrar precios para una refacción de dispositivo y también el precio del dispositivo completo en varios sitios de comercio electrónico.

    Busca el siguiente artículo de refacción:
    - Tipo de Dispositivo: ${query.deviceType}
    - Marca: ${query.brand}
    - Modelo: ${query.model}
    - Pieza: ${query.part}
    - Variantes: ${query.variant1}, ${query.variant2}

    Consulta los siguientes sitios web para la refacción y para el dispositivo completo:
    1. amazon.com.mx
    2. mercadolibre.com.mx
    3. ebay.com
    4. aliexpress.com

    Para los resultados de la refacción, encuentra hasta 3 listados por sitio. Para cada listado, proporciona la plataforma, el precio en MXN (convierte si es necesario), la calificación del vendedor, el tiempo de entrega estimado a Ciudad de México (CP 03023), la condición ("Nuevo" o "Usado") y la URL del producto.

    Para los precios del dispositivo completo (${query.brand} ${query.model}), proporciona un rango de precios (bajo, promedio, alto) tanto para dispositivos nuevos como usados en excelentes condiciones.

    Basa tu respuesta únicamente en la información que puedas encontrar en los sitios web especificados. Genera un ID único para cada resultado de refacción que combine la plataforma y el precio.
    `;
};

export const handler = async function(event: any) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { API_KEY } = process.env;
    if (!API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: "API key is not configured on the server." }) };
    }

    try {
        const query: SearchQuery = JSON.parse(event.body);
        const prompt = createPrompt(query);
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonStr = response.text.trim();

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: jsonStr,
        };

    } catch (error: any) {
        console.error("Error in Netlify function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "Failed to fetch quotes from Gemini API." })
        };
    }
};