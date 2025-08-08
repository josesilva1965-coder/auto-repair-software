import { GoogleGenAI, Type } from "@google/genai";
import type { Quote, Language, VinInfo, ShopSettings, ModelListResponse } from '../types.js';

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const quoteSchema = {
    type: Type.OBJECT,
    properties: {
        services: {
            type: Type.ARRAY,
            description: "A list of services to be performed.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Name of the specific service (e.g., 'Oil Change Service')." },
                    parts: {
                        type: Type.ARRAY,
                        description: "A list of parts required for this service.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Name of the part (e.g., 'Synthetic Oil 5W-30')." },
                                quantity: { type: Type.INTEGER, description: "Quantity of the part needed." },
                                unitPrice: { type: Type.NUMBER, description: "Price per unit of the part." },
                                totalPrice: { type: Type.NUMBER, description: "Total price for this part (quantity * unitPrice)." },
                            },
                             required: ["name", "quantity", "unitPrice", "totalPrice"],
                        },
                    },
                    laborHours: { type: Type.NUMBER, description: "Number of hours of labor required." },
                    laborCost: { type: Type.NUMBER, description: "Total cost of labor for this service." },
                    serviceTotal: { type: Type.NUMBER, description: "Total cost for this specific service (parts + labor)." },
                },
                required: ["name", "parts", "laborHours", "laborCost", "serviceTotal"],
            },
        },
        subtotal: { type: Type.NUMBER, description: "The total cost of all services before tax." },
        taxAmount: { type: Type.NUMBER, description: "The amount of sales tax, calculated based on the provided tax rate." },
        totalCost: { type: Type.NUMBER, description: "The final total cost (subtotal + taxAmount)." },
        estimatedDurationHours: { type: Type.NUMBER, description: "Total estimated duration in hours to complete all services from start to finish. This is not just labor hours, but the total time the vehicle will occupy the bay." },
        notes: { type: Type.STRING, description: "Any additional notes or recommendations for the customer. Address the customer by name if possible."}
    },
    required: ["services", "subtotal", "taxAmount", "totalCost", "estimatedDurationHours", "notes"],
};

const vinSchema = {
    type: Type.OBJECT,
    properties: {
        make: { type: Type.STRING, description: "The make of the vehicle (e.g., Toyota, Ford)." },
        model: { type: Type.STRING, description: "The model of the vehicle (e.g., Camry, F-150)." },
        year: { type: Type.STRING, description: "The model year of the vehicle (e.g., 2022)." },
    },
    required: ["make", "model", "year"],
};

const modelListSchema = {
    type: Type.OBJECT,
    properties: {
        models: {
            type: Type.ARRAY,
            description: "A list of common vehicle model names for a specific make and year, sorted alphabetically.",
            items: {
                type: Type.STRING,
            },
        },
    },
    required: ["models"],
};

const safeJsonParse = (jsonString: string) => {
    const cleanJsonText = jsonString.trim().replace(/^```json\s*|```\s*$/g, '').trim();
    if (!cleanJsonText) {
        throw new Error("AI model returned an empty response after cleanup.");
    }
    return JSON.parse(cleanJsonText);
}

export const generateQuote = async (vehicleInfo: string, serviceRequest: string, customerName: string, language: Language, shopSettings: ShopSettings): Promise<Omit<Quote, 'id' | 'customerId' | 'vehicleId'>> => {
    const { taxRate, laborRate } = shopSettings;
    const prompt = `
        You are an expert auto repair service advisor.
        Generate a detailed and realistic service quote for a customer named ${customerName}.
        The customer's preferred language is ${language}. If the language code is 'en-GB', use UK automotive terminology (e.g., 'discs' instead of 'rotors', 'tyres' instead of 'tires', 'labour' instead of 'labor').
        The vehicle is a ${vehicleInfo}.
        The customer's request is: "${serviceRequest}".
        
        Follow these rules:
        1. Base the parts and labour on typical industry standards for the requested service and vehicle. Use pricing appropriate for the region implied by the language (e.g., GBP for en-GB, EUR for es-ES/fr-FR/pt-PT). The JSON output should only contain numbers, not currency symbols.
        2. The standard hourly labour rate is ${laborRate}. Use this rate to calculate all labour costs (laborHours * laborRate).
        3. Calculate tax based on the provided rate of ${taxRate * 100}%.
        4. Ensure all financial calculations (total parts, total service, subtotal, tax, total cost) are accurate.
        5. Provide a realistic total duration in hours for the entire job from start to finish in the 'estimatedDurationHours' field. This is the total time the vehicle occupies a bay, not just pure labor hours.
        6. Add a helpful, brief note for the customer, addressing them by their name, ${customerName}. Write this note in the customer's preferred language (${language}).
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: quoteSchema,
                temperature: 0.5,
            },
        });

        const quoteData = safeJsonParse(response.text);
        
        const recalculatedSubtotal = quoteData.services.reduce((sum: number, service: any) => sum + service.serviceTotal, 0);
        quoteData.subtotal = recalculatedSubtotal;
        quoteData.taxAmount = recalculatedSubtotal * taxRate;
        quoteData.totalCost = quoteData.subtotal + quoteData.taxAmount;

        return quoteData;
    } catch (error) {
        console.error("Error generating or parsing quote:", error);
        throw new Error("Failed to get a valid quote from the AI model.");
    }
};

export const getVehicleInfoFromVin = async (vin: string): Promise<VinInfo> => {
    const prompt = `Decode the following 17-character VIN and return ONLY a JSON object containing the vehicle's make, model, and year. Do not add any extra text, explanations, or markdown formatting. VIN: ${vin}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: vinSchema,
                temperature: 0,
            },
        });
        return safeJsonParse(response.text);
    } catch (error) {
        console.error("Error decoding VIN:", error);
        throw new Error("Failed to decode VIN from the AI model.");
    }
};

export const getVehicleInfoFromRegistration = async (registration: string): Promise<VinInfo> => {
    const prompt = `You are a vehicle data API for the UK. Identify the Make, Model, and Year for a given vehicle registration number. Return ONLY a valid JSON object. If any piece of information cannot be determined, return the string "Unknown" for that specific field. Example: For "BP19 OVL", return {"make": "Ford", "model": "Fiesta", "year": "2019"}. Now, provide the details for this registration: "${registration}"`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: vinSchema,
                temperature: 0,
            },
        });
        return safeJsonParse(response.text);
    } catch (error) {
        console.error("Error looking up registration:", error);
        throw new Error("Failed to look up registration from the AI model.");
    }
};

export const getModelsForMakeYear = async (make: string, year: string): Promise<ModelListResponse> => {
    const prompt = `Provide a list of common vehicle models for the following make and year. Return ONLY a JSON object with a single key "models" which is an array of strings, sorted alphabetically. Make: ${make}, Year: ${year}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: modelListSchema,
                temperature: 0.1,
            },
        });
        return safeJsonParse(response.text);
    } catch (error) {
        console.error("Error fetching vehicle models:", error);
        throw new Error("Failed to fetch vehicle models from the AI model.");
    }
};
