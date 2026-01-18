import type { Express, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export function registerInspireRoutes(app: Express): void {
  app.post("/api/inspire", async (req: Request, res: Response) => {
    try {
      const { sceneNumber, trackTitle, prompt, currentInput } = req.body;

      if (!sceneNumber || !trackTitle || !prompt) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const systemPrompt = `You are a creative writing assistant for Story Arcade, helping users write compelling personal mythology stories.

The user is creating a "${trackTitle}" story and is on Scene ${sceneNumber}.
The prompt they need to answer is: "${prompt}"
${currentInput ? `They've started writing: "${currentInput}"` : "They haven't started writing yet."}

Generate exactly 3 short, creative suggestions (each 1-2 sentences, 50-100 characters) that could inspire their answer. 
Each suggestion should be evocative, specific, and spark imagination.
Make them diverse in tone and approach.

Return ONLY a JSON array of 3 strings, nothing else. Example:
["A mysterious light appeared in the alley behind my building", "The old clock tower struck thirteen at midnight", "I found a map written in my grandmother's handwriting"]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      });

      const text = response.text || "";
      
      let suggestions: string[] = [];
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        }
      } catch {
        suggestions = [
          "The moment I discovered I could do something impossible",
          "An old photograph that changed how I see myself",
          "The day everything I believed turned upside down"
        ];
      }

      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        suggestions = [
          "A chance encounter that altered my path forever",
          "The secret I kept hidden even from myself",
          "When the ordinary became extraordinary"
        ];
      }

      res.json({ suggestions: suggestions.slice(0, 3) });
    } catch (error) {
      console.error("Error generating suggestions:", error);
      res.status(500).json({ 
        error: "Failed to generate suggestions",
        suggestions: [
          "An unexpected discovery that changed everything",
          "The moment I realized my true strength",
          "A memory that refuses to fade"
        ]
      });
    }
  });
}
