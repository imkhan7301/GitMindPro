
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, MarketPulse, VisualAuditResult, DeepAudit } from "../types";

export const performDeepAudit = async (repoName: string, techStack: string[], readme: string): Promise<DeepAudit> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [{
        text: `Perform a deep reasoning security and architectural audit for the repository "${repoName}". 
        Tech Stack: ${techStack.join(', ')}. 
        Context: ${readme.substring(0, 2000)}
        Focus on non-obvious logic flaws and scaling bottlenecks.`
      }]
    },
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reasoning: { type: Type.STRING },
          vulnerabilities: { type: Type.ARRAY, items: { type: Type.STRING } },
          architecturalDebt: { type: Type.STRING }
        },
        required: ["reasoning", "vulnerabilities", "architecturalDebt"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const analyzeRepository = async (
  repoInfo: string,
  structure: string,
  readmeContent: string
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Act as a world-class CTO. Analyze this repo for an AI Startup context.
  
  IMPORTANT: For 'flowNodes' and 'flowEdges', create a technical architecture diagram.
  - Nodes should represent actual folders or key files from the provided structure (e.g., 'src/api', 'components/ui', 'Database').
  - Edges should represent logical data flow or dependencies.
  - Place nodes on a grid (x: 0-800, y: 0-600) so they don't overlap.
  
  Generate a "qaScript" for a Boardroom Q&A between Joe (Investor) and Jane (Founder). 
  Joe: Skeptical question about tech moat.
  Jane: Visionary answer explaining the repo's logic.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [{
        text: prompt + `\n\nCONTEXT:\nRepo: ${repoInfo}\nFiles: ${structure.substring(0, 2000)}\nREADME: ${readmeContent.substring(0, 2000)}`
      }]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          startupPitch: { type: Type.STRING },
          qaScript: { type: Type.STRING },
          aiStrategy: { type: Type.STRING },
          techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
          architectureSuggestion: { type: Type.STRING },
          roadmap: { type: Type.ARRAY, items: { type: Type.STRING } },
          mermaidDiagram: { type: Type.STRING },
          flowNodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, data: { type: Type.OBJECT, properties: { label: { type: Type.STRING } } }, position: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } } } } },
          flowEdges: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, source: { type: Type.STRING }, target: { type: Type.STRING }, label: { type: Type.STRING }, animated: { type: Type.BOOLEAN } } } },
          scorecard: { type: Type.OBJECT, properties: { maintenance: { type: Type.NUMBER }, documentation: { type: Type.NUMBER }, innovation: { type: Type.NUMBER }, security: { type: Type.NUMBER } }, required: ["maintenance", "documentation", "innovation", "security"] },
          cloudArchitecture: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { serviceName: { type: Type.STRING }, platform: { type: Type.STRING }, reasoning: { type: Type.STRING }, configSnippet: { type: Type.STRING }, complexity: { type: Type.STRING } } } }
        },
        required: ["summary", "startupPitch", "qaScript", "aiStrategy", "techStack", "architectureSuggestion", "roadmap", "scorecard", "mermaidDiagram", "cloudArchitecture", "flowNodes", "flowEdges"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateVisionVideo = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Cinematic 4k trailer, futuristic visualization of: ${prompt}. High quality, tech aesthetics.`,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
  });
  
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await videoResponse.blob();
  return URL.createObjectURL(blob);
};

export const generateBoardroomQA = async (script: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: {
      parts: [{ text: `Boardroom dialogue:\n${script}` }]
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            { speaker: 'Joe', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
            { speaker: 'Jane', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
          ]
        }
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
};

export const getMarketPulse = async (repoName: string, techStack: string[], coords?: { lat: number; lng: number }): Promise<MarketPulse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [{
        text: `Find tech hubs, competitors, and industry events related to "${repoName}" and "${techStack.join(', ')}". Suggest physical meeting spots in the ecosystem.`
      }]
    },
    config: {
      tools: [{ googleSearch: {} }, { googleMaps: {} }],
      toolConfig: coords ? { retrievalConfig: { latLng: { latitude: coords.lat, longitude: coords.lng } } } : undefined
    }
  });

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const resources = chunks.filter((c: any) => c.web).map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
  const locations = chunks.filter((c: any) => c.maps).map((c: any) => ({ 
    name: c.maps.title, 
    uri: c.maps.uri, 
    snippet: c.maps.placeAnswerSources?.[0]?.reviewSnippets?.[0]?.text 
  }));

  return {
    sentiment: response.text || "Pulse analysis unavailable.",
    resources: resources.slice(0, 5),
    locations: locations.slice(0, 5)
  };
};

export const analyzeVisualPrototype = async (base64Image: string, repoContext: string): Promise<VisualAuditResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: "image/png" } },
        { text: `Analyze implementation gaps: ${repoContext}` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { analysis: { type: Type.STRING }, gaps: { type: Type.ARRAY, items: { type: Type.STRING } }, suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } },
        required: ["analysis", "gaps", "suggestions"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const synthesizeLabTask = async (task: 'refactor' | 'test', fileName: string, content: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [{ text: `${task} file ${fileName}:\n\n${content}` }]
    }
  });
  return response.text || "";
};

export const explainCode = async (fileName: string, content: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [{ text: `Explain ${fileName}:\n\n${content.substring(0, 3000)}` }]
    }
  });
  return response.text || "";
};

export const chatWithRepo = async (history: any[], question: string, context: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [{ text: `CONTEXT: ${context}\n\nQUESTION: ${question}` }]
    }
  });
  return response.text || "";
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: {
      parts: [{ text }]
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
};
