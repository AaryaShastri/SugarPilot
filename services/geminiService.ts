
import { GoogleGenAI, Type } from "@google/genai";
import { CARB_RULES_PROMPT } from "../constants";
import { FoodItem } from "../types";

export const parseMealToCarbs = async (mealDescription: string): Promise<FoodItem[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this meal: "${mealDescription}".
    
    Using the carb-counting database provided, list each food, its interpreted quantity, and the calculated grams of carbohydrates.
    
    ${CARB_RULES_PROMPT}
    
    Return the result as a valid JSON array of objects with keys: "food", "quantity", "carbs".`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            food: { type: Type.STRING },
            quantity: { type: Type.STRING },
            carbs: { type: Type.NUMBER }
          },
          required: ["food", "quantity", "carbs"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};
