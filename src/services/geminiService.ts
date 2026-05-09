import { GoogleGenAI, Type } from "@google/genai";
import { Institution, Contact } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function deepResearchInstitution(inst: Institution): Promise<Partial<Institution['intel']>> {
  try {
    const prompt = `[EXPERT OSINT MISSION]
    Identity: Senior Web Scraping Engineer & Germany Healthcare Recruiter.
    Target: ${inst.name} in ${inst.city}, Germany (Domain: ${inst.website || 'Search for official portal'})
    
    Task: Conduct a recursive deep-research crawl on this institution to discover its OFFICIAL WEBSITE URL and ALL types of Pflege Ausbildung opportunities, specifically focusing on international recruitment pipelines.
    
    Research Protocol:
    1. LOCATE official .de domain and specific "Karriere" or "Interational" sub-portals.
    2. CRAWL internal links focusing on:
       - Generalisierte Pflegeausbildung
       - International Nursing Programs ("Internationale Pflegekräfte", "Anerkennung")
       - Specific recruitment partnerships (e.g., Triple Win, agreements with Morocco/Mexico/Vietnam).
    3. DETECT "International Contract" signals:
       - Relocation support (Finding an apartment).
       - Visa sponsorship handling.
       - Language course funding (B2 level).
       - Specific mentions of Morocco (Marokko) or recruitment agencies.
    4. EXTRACT:
       - The direct official website URL (NOT a search engine).
       - Direct recruiters for international candidates.
       - Presence of an in-house Pflegeschule (Nursing School).
    5. ANALYSIS: Is this hospital a "High-Probability Match" for a Moroccan candidate? (Evaluate based on existing international clusters).
    
    Return a strictly structured JSON object. If data is hidden, provide a high-probability tactical estimate based on current German hospital recruitment trends.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            website: { type: Type.STRING, description: "Official institution domain URL" },
            contacts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  email: { type: Type.STRING },
                  role: { type: Type.STRING }
                }
              }
            },
            ausbildungUrl: { type: Type.STRING, description: "Direct link to nursing training page" },
            hrDirectLine: { type: Type.STRING },
            visaSupport: { type: Type.BOOLEAN },
            accommodation: { type: Type.BOOLEAN },
            internationalReady: { type: Type.BOOLEAN, description: "Strong evidence of international acceptance" },
            languageReq: { type: Type.STRING },
            trainingProgram: { type: Type.STRING },
            researchSummary: { type: Type.STRING, description: "3-4 sentences of deep intelligence" },
            analysis: { type: Type.STRING, description: "Detailed check for specific recruitment partnerships like Morocco" },
            score: { type: Type.INTEGER, description: "0-100 score" }
          }
        },
        tools: [{ googleSearch: {} }]
      }
    });

    const intel = JSON.parse(response.text);
    return intel;
  } catch (error) {
    console.error("Deep Research Error:", error);
    return {};
  }
}
