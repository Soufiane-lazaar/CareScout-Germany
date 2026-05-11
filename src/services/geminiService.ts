import { GoogleGenAI, Type } from "@google/genai";
import { Institution, Contact } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function deepResearchInstitution(inst: Institution): Promise<Partial<Institution['intel']>> {
  try {
    const prompt = `[EXPERT OSINT MISSION]
    Identity: Senior Web Scraping Engineer & Germany Healthcare Recruiter.
    Target: ${inst.name} in ${inst.city}, Germany (Domain: ${inst.website || 'Search for official portal'})
    
    Task: Conduct a recursive deep-research mission. Use GOOGLE SEARCH and internal databases to discover its "Anwerbevertrag Pflege" participation and international recruitment robustness.
    
    Research Protocol:
    1. SEARCH & VERIFY: Use Google Search to find official government and GIZ/ZAV partner lists to confirm if this institution is part of the "Anwerbevertrag Pflege Deutschland International" network.
    2. HR DISCOVERY: Specifically find the contact details of the "Pflegedirektion" (Nursing Director) or "Personalabteilung" (HR) including direct TELEPHONE numbers and official Email addresses for recruitment staff.
    3. DISCOURSE ANALYSIS: Scan Reddit (r/nursing, r/germany), LinkedIn, and local German healthcare forums to find real-world feedback on their international integration quality.
    4. TARGET Specific Agreements: Look for "Gütezeichen Fachkräftegewinnung" (fair recruitment seal) or "Triple Win" status.
    5. DETECT High-Value Signals:
       - Direct visa sponsorship (Fachkräfteeinwanderungsgesetz).
       - Presence of dedicated "Integration Managers" for internationals.
       - Support for professional recognition (Anerkennungsverfahren).
    6. ANALYSIS: Is this institution a verified "Anwerbevertrag" partner? Provide evidence-based assessment.
    
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
                  phone: { type: Type.STRING, description: "Direct office number with extension" },
                  role: { type: Type.STRING, description: "Job title e.g., Head of Nursing Recruitment" }
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
