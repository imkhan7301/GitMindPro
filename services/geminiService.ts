
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, MarketInsight } from "../types";

export const analyzeRepository = async (
  repoInfo: string,
  structure: string,
  readmeContent: string
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Act as a CTO. Provide a deep analysis including a Mermaid.js flowchart (top-down) for the main architecture.
  CONTEXT:
  Repo: ${repoInfo}
  Structure: ${structure.substring(0, 3000)}
  README: ${readmeContent.substring(0, 3000)}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
          architectureSuggestion: { type: Type.STRING },
          roadmap: { type: Type.ARRAY, items: { type: Type.STRING } },
          mermaidDiagram: { type: Type.STRING, description: "Valid Mermaid.js graph code" },
          scorecard: {
            type: Type.OBJECT,
            properties: {
              maintenance: { type: Type.NUMBER },
              documentation: { type: Type.NUMBER },
              innovation: { type: Type.NUMBER },
              security: { type: Type.NUMBER }
            },
            required: ["maintenance", "documentation", "innovation", "security"]
          }
        },
        required: ["summary", "techStack", "keyFeatures", "architectureSuggestion", "roadmap", "scorecard", "mermaidDiagram"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const getMarketInsights = async (repoName: string, techStack: string[]): Promise<MarketInsight> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Research the market and ecosystem for the GitHub project "${repoName}" which uses ${techStack.join(', ')}. 
  Find top 3 competitors, current trending issues in this niche, and 3 high-quality external documentation or stackoverflow resources.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const links = grounding.map((chunk: any) => ({
    title: chunk.web?.title || 'External Resource',
    uri: chunk.web?.uri || '#'
  }));

  return {
    competitors: [], 
    trendingTopics: techStack.slice(0, 3),
    externalResources: links.slice(0, 5)
  };
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Explain this code logic clearly: ${text.substring(0, 500)}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Charon' }
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
};

export const chatWithRepo = async (
  history: {role: string, text: string}[],
  question: string,
  context: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `CONTEXT: ${context.substring(0, 8000)}\nUSER: ${question}`
  });
  return response.text || "I couldn't process that request.";
};

export const explainCode = async (fileName: string, content: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Explain "${fileName}":\n\n${content.substring(0, 5000)}`
  });
  return response.text || "Failed to explain code.";
};
