import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { SearchQuery, GeminiResponse } from '../../types';

// La función 'createPrompt' se mueve aquí, al lado del servidor,
// ya que aquí es donde se necesita realmente.
const createPrompt = (query: SearchQuery): string => {
  return `
    Actúa como un experto agregador de datos de comercio electrónico. Tu tarea es encontrar precios de refacciones y dispositivos completos en sitios web específicos.

    Busca el siguiente artículo:
    - Tipo de Dispositivo: ${query.deviceType}
    - Marca: ${query.brand}
    - Modelo: ${query.model}
    - Pieza: ${query.part}
    - Variante 1: ${query.variant1}
    - Variante 2: ${query.variant2}

    Consulta los siguientes sitios web:
    1. amazon.com.mx
    2. mercadolibre.com.mx
    3. ebay.com
    4. aliexpress.com

    Para cada sitio web, encuentra hasta 3 anuncios. Para cada anuncio, proporciona la siguiente información:
    - platform: El nombre del sitio web (ej. 'Amazon MX', 'MercadoLibre').
    - priceMXN: El precio en Pesos Mexicanos. Si está en otra moneda, conviértelo. Debe ser un número.
    - sellerRating: La calificación del vendedor, un número entre 0 y 5.
    - deliveryTime: El tiempo de entrega estimado en días a Ciudad de México, CP 03023.
    - condition: "Nuevo" o "Usado".
    - url: El enlace directo a la página del producto.
    - id: Un ID único para este resultado (puedes usar una combinación de plataforma y precio).


    Adicionalmente, busca el precio del dispositivo completo (${query.brand} ${query.model}), tanto nuevo como usado en excelentes condiciones, en los mismos sitios. Proporciona un precio bajo, promedio y alto estimado para cada condición.

    Devuelve tu respuesta completa como un único objeto JSON minificado. No incluyas texto, explicaciones o formato markdown fuera del JSON. El JSON debe seguir esta estructura exacta:
    {
      "partResults": [
        { "platform": "string", "priceMXN": number, "sellerRating": number, "deliveryTime": "string", "condition": "string", "url": "string", "id": "string" }
      ],
      "devicePrices": {
        "new": { "low": number, "average": number, "high": number },
        "used": { "low": number, "average": number, "high": number }
      }
    }
    `;
};

export const handler = async (event: any) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { API_KEY } = process.env;
    if (!API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: "API key is not configured on the server." }) };
    }

    try {
        const query: SearchQuery = JSON.parse(event.body || '{}');
        const prompt = createPrompt(query);
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });

        const jsonStr = response.text.trim();

        // Validate that we got a valid JSON string before returning
        JSON.parse(jsonStr);

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
