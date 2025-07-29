import { SearchQuery, GeminiResponse } from '../types';
import { MOCK_GEMINI_RESPONSE } from "../constants";

const USE_MOCK_DATA_ON_FAILURE = true; // Fallback to mock data if API call fails

export const fetchQuotes = async (query: SearchQuery): Promise<GeminiResponse> => {
  try {
    const response = await fetch('/.netlify/functions/gemini-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || `Request failed with status ${response.status}`);
    }

    const jsonStr = await response.text();
    const parsedData: GeminiResponse = JSON.parse(jsonStr);

    if (!parsedData.partResults || !parsedData.devicePrices) {
        throw new Error("Invalid data structure from API");
    }

    return parsedData;

  } catch (error: any) {
    console.error("Error fetching quotes via Netlify function:", error);
    if (USE_MOCK_DATA_ON_FAILURE) {
        console.log("API call failed. Using mock data as a fallback.");
        return new Promise(resolve => setTimeout(() => resolve(MOCK_GEMINI_RESPONSE), 500));
    }
    throw new Error(`No se pudieron obtener las cotizaciones: ${error instanceof Error ? error.message : String(error)}`);
  }
};
