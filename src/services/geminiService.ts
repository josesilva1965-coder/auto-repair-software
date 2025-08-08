import { GoogleGenAI, Type } from "@google/genai";
import type { Quote, Language, VinInfo, ShopSettings, ModelListResponse } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    
    let rawTextForErrorLogging: string | undefined;
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

        const rawText = response.text;
        rawTextForErrorLogging = rawText;

        if (!rawText) {
            console.error("AI model returned an empty response for quote generation.");
            throw new Error("AI model returned an empty response.");
        }
        
        const cleanJsonText = rawText.trim().replace(/^```json\s*|```\s*$/g, '').trim();
        
        if (!cleanJsonText) {
            console.error("AI model returned an empty response after cleanup for quote generation.");
            throw new Error("AI model returned an empty response after cleanup.");
        }
        
        const quoteData = JSON.parse(cleanJsonText);
        
        const recalculatedSubtotal = quoteData.services.reduce((sum: number, service: any) => sum + service.serviceTotal, 0);
        quoteData.subtotal = recalculatedSubtotal;
        quoteData.taxAmount = recalculatedSubtotal * taxRate; // Recalculate tax to ensure it matches the setting
        quoteData.totalCost = quoteData.subtotal + quoteData.taxAmount;

        return quoteData;

    } catch (error) {
        console.error("Error generating or parsing quote:", error);
        if (error instanceof SyntaxError) {
             const errorText = rawTextForErrorLogging ?? '[response text was null or undefined]';
             console.error(`Invalid JSON received for quote: ${errorText}`);
        }
        throw new Error("Failed to get a valid quote from the AI model.");
    }
};

export const getVehicleInfoFromVin = async (vin: string): Promise<VinInfo> => {
    const prompt = `
        You are a highly accurate vehicle VIN decoder. 
        Decode the following 17-character VIN and return ONLY a JSON object containing the vehicle's make, model, and year.
        Do not add any extra text, explanations, or markdown formatting.

        VIN: ${vin}
    `;

    let rawTextForErrorLogging: string | undefined;
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

        const rawText = response.text;
        rawTextForErrorLogging = rawText;
        
        if (!rawText) {
            console.error("AI model returned an empty response for VIN lookup.");
            throw new Error("AI model returned an empty response for VIN lookup.");
        }
        
        const cleanJsonText = rawText.trim().replace(/^```json\s*|```\s*$/g, '').trim();

        if (!cleanJsonText) {
            console.error("AI model returned an empty response after cleanup for VIN lookup.");
            throw new Error("AI model returned an empty response after cleanup for VIN lookup.");
        }

        return JSON.parse(cleanJsonText) as VinInfo;

    } catch (error) {
        console.error("Error decoding VIN:", error);
        if (error instanceof SyntaxError) {
             const errorText = rawTextForErrorLogging ?? '[response text was null or undefined]';
             console.error(`Invalid JSON received for VIN: ${errorText}`);
        }
        throw new Error("Failed to decode VIN from the AI model.");
    }
};

export const getVehicleInfoFromRegistration = async (registration: string): Promise<VinInfo> => {
    const prompt = `
        You are an expert vehicle data API for the UK. Your task is to identify the Make, Model, and Year for a given vehicle registration number (number plate).
        You must return the information in a valid JSON object format, and nothing else.

        Follow these rules strictly:
        1.  Analyze the registration number to determine the vehicle's details.
        2.  Return ONLY the JSON object. Do not include any explanatory text, markdown formatting, or any characters outside of the JSON structure.
        3.  If any piece of information (make, model, or year) cannot be determined, return the string "Unknown" for that specific field. Do not leave fields empty.

        Here is an example:
        Registration: "BP19 OVL"
        Your response must be:
        {
          "make": "Ford",
          "model": "Fiesta",
          "year": "2019"
        }

        Now, provide the details for this registration:
        Registration: "${registration}"
    `;

    let rawTextForErrorLogging: string | undefined;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: vinSchema, // Reusing the same schema
                temperature: 0,
            },
        });

        const rawText = response.text;
        rawTextForErrorLogging = rawText;

        if (!rawText) {
            console.error("AI model returned an empty response for registration lookup.");
            throw new Error("AI model returned an empty response for registration lookup.");
        }

        const cleanJsonText = rawText.trim().replace(/^```json\s*|```\s*$/g, '').trim();

        if (!cleanJsonText) {
            console.error("AI model returned an empty response after cleanup for registration lookup.");
            throw new Error("AI model returned an empty response after cleanup for registration lookup.");
        }

        return JSON.parse(cleanJsonText) as VinInfo;

    } catch (error) {
        console.error("Error looking up registration:", error);
        if (error instanceof SyntaxError) {
             const errorText = rawTextForErrorLogging ?? '[response text was null or undefined]';
             console.error(`Invalid JSON received for registration: ${errorText}`);
        }
        throw new Error("Failed to look up registration from the AI model.");
    }
};

export const getModelsForMakeYear = async (make: string, year: string): Promise<ModelListResponse> => {
    const prompt = `
        You are a vehicle data API.
        Provide a list of common vehicle models for the following make and year.
        Return ONLY a JSON object with a single key "models" which is an array of strings. Do not add any extra text, explanations, or markdown formatting.
        The list should be sorted alphabetically.

        Make: ${make}
        Year: ${year}
    `;

    let rawTextForErrorLogging: string | undefined;
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
        
        const rawText = response.text;
        rawTextForErrorLogging = rawText;

        if (!rawText) {
            throw new Error("AI model returned an empty response for model lookup.");
        }
        
        const cleanJsonText = rawText.trim().replace(/^```json\s*|```\s*$/g, '').trim();
        if (!cleanJsonText) {
            throw new Error("AI model returned an empty response after cleanup for model lookup.");
        }
        
        return JSON.parse(cleanJsonText) as ModelListResponse;

    } catch (error) {
        console.error("Error fetching vehicle models:", error);
        if (error instanceof SyntaxError) {
             const errorText = rawTextForErrorLogging ?? '[response text was null or undefined]';
             console.error(`Invalid JSON received for models: ${errorText}`);
        }
        throw new Error("Failed to fetch vehicle models from the AI model.");
    }
};