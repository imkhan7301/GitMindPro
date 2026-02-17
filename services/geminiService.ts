import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, MarketPulse, VisualAuditResult, DeepAudit, GitHubIssue, GitHubPR, Contributor, ChatMessage, InsightSummary, VulnerabilityRemediationPlan } from "../types";
import { logger } from "../utils/logger";
import { apiRateLimiter } from "../utils/rateLimiter";
import { AppError, ErrorCodes, handleError } from "../utils/errorHandler";

type GroundingChunk = {
  web?: { title?: string; uri?: string };
  maps?: { title?: string; uri?: string; placeAnswerSources?: { reviewSnippets?: { text?: string }[] }[] };
};

type GitHubCommitFile = {
  filename: string;
};

type GitHubCommit = {
  commit?: { author?: { name?: string } };
  author?: { login?: string };
  files?: GitHubCommitFile[];
};

const getApiKey = (): string => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  logger.info('Checking API key', { status: key ? 'found' : 'missing' });
  
  if (!key || key === 'your_gemini_api_key_here') {
    logger.error('API key missing or invalid');
    throw new AppError(
      ErrorCodes.INVALID_API_KEY,
      401,
      'Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in .env.local file.'
    );
  }
  return key;
};

const checkRateLimit = (identifier: string = 'default'): void => {
  const result = apiRateLimiter.isAllowed(identifier);
  if (!result.allowed) {
    throw new AppError(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      429,
      `Rate limit exceeded. Please try again in ${result.retryAfter}ms.`,
      { retryAfter: result.retryAfter }
    );
  }
};

const getTimeoutMs = (): number => {
  const raw = Number(import.meta.env.VITE_GEMINI_TIMEOUT_MS ?? 90000);
  return Number.isFinite(raw) && raw > 0 ? raw : 90000;
};

const withTimeout = async <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new AppError(
          ErrorCodes.API_ERROR,
          504,
          `${label} timed out after ${Math.round(ms / 1000)}s. Please try again.`
        )
      );
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export const performDeepAudit = async (repoName: string, techStack: string[], readme: string): Promise<DeepAudit> => {
  try {
    checkRateLimit('audit');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
    logger.info('Deep audit completed', { repoName });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    logger.error('Deep audit failed', error as Error);
    throw handleError(error);
  }
};

export const generateVulnerabilityRemediation = async (
  repoName: string,
  techStack: string[],
  vulnerability: string,
  architecturalDebt: string,
  readmeContext: string
): Promise<VulnerabilityRemediationPlan> => {
  try {
    checkRateLimit('remediation');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [{
          text: `You are a senior application security engineer.
Generate an actionable remediation plan for this vulnerability.

Repository: ${repoName}
Tech Stack: ${techStack.join(', ') || 'Unknown'}
Vulnerability: ${vulnerability}
Architectural Context: ${architecturalDebt || 'N/A'}
README Context: ${(readmeContext || '').substring(0, 2000)}

Requirements:
- Be practical for a solo developer.
- Prefer low-risk, incremental changes.
- Include verification steps before and after the fix.
- Keep file paths specific when possible.
- safePrompt must be a copy-ready coding-assistant prompt focused ONLY on this vulnerability.`
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            severity: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            affectedFiles: { type: Type.ARRAY, items: { type: Type.STRING } },
            fixSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            verificationSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            safePrompt: { type: Type.STRING }
          },
          required: ["title", "severity", "confidence", "affectedFiles", "fixSteps", "verificationSteps", "safePrompt"]
        }
      }
    });

    logger.info('Vulnerability remediation plan generated', { repoName });
    const parsed = JSON.parse(response.text || '{}') as Partial<VulnerabilityRemediationPlan>;
    const validSeverity = ['low', 'medium', 'high', 'critical'].includes(String(parsed.severity).toLowerCase())
      ? String(parsed.severity).toLowerCase() as VulnerabilityRemediationPlan['severity']
      : 'medium';

    return {
      title: parsed.title || 'Remediation Plan',
      severity: validSeverity,
      confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.confidence))) : 70,
      affectedFiles: Array.isArray(parsed.affectedFiles) ? parsed.affectedFiles : [],
      fixSteps: Array.isArray(parsed.fixSteps) ? parsed.fixSteps : [],
      verificationSteps: Array.isArray(parsed.verificationSteps) ? parsed.verificationSteps : [],
      safePrompt: parsed.safePrompt || `Fix vulnerability: ${vulnerability}`
    };
  } catch (error) {
    logger.error('Vulnerability remediation generation failed', error as Error);
    throw handleError(error);
  }
};

export const analyzeRepository = async (
  repoInfo: string,
  structure: string,
  readmeContent: string
): Promise<AnalysisResult> => {
  try {
    checkRateLimit('analysis');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const prompt = `Act as a world-class CTO. Analyze this repo for an AI Startup context.
    
    IMPORTANT: For 'flowNodes' and 'flowEdges', create a technical architecture diagram.
    - Nodes should represent actual folders or key files from the provided structure (e.g., 'src/api', 'components/ui', 'Database').
    - Edges should represent logical data flow or dependencies.
    - Place nodes on a grid (x: 0-800, y: 0-600) so they don't overlap.

    Also generate 'architectureTour' with a short guided walkthrough:
    - title: short tour name
    - summary: 1-2 sentence overview
    - steps: 4-7 steps, each referencing a nodeId from flowNodes with a title and 2-4 bullet points.
    
    Generate a "qaScript" for a Boardroom Q&A between Joe (Investor) and Jane (Founder). 
    Joe: Skeptical question about tech moat.
    Jane: Visionary answer explaining the repo's logic.`;

    const response = await withTimeout(ai.models.generateContent({
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
            cloudArchitecture: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { serviceName: { type: Type.STRING }, platform: { type: Type.STRING }, reasoning: { type: Type.STRING }, configSnippet: { type: Type.STRING }, complexity: { type: Type.STRING } } } },
            architectureTour: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      nodeId: { type: Type.STRING },
                      title: { type: Type.STRING },
                      bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["nodeId", "title", "bullets"]
                  }
                }
              },
              required: ["title", "summary", "steps"]
            }
          },
          required: ["summary", "startupPitch", "qaScript", "aiStrategy", "techStack", "architectureSuggestion", "roadmap", "scorecard", "mermaidDiagram", "cloudArchitecture", "flowNodes", "flowEdges", "architectureTour"]
        }
      }
    }), getTimeoutMs(), 'Repository analysis');

    logger.info('Repository analysis completed', { repoInfo });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    logger.error('Repository analysis failed', error as Error);
    throw handleError(error);
  }
};

export const generateVisionVideo = async (prompt: string): Promise<string> => {
  try {
    checkRateLimit('video');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
    if (!downloadLink) {
      throw new AppError(ErrorCodes.API_ERROR, 500, 'Failed to generate video');
    }
    const videoResponse = await fetch(`${downloadLink}&key=${getApiKey()}`);
    const blob = await videoResponse.blob();
    logger.info('Vision video generated successfully');
    return URL.createObjectURL(blob);
  } catch (error) {
    logger.error('Vision video generation failed', error as Error);
    throw handleError(error);
  }
};

export const generateBoardroomQA = async (script: string): Promise<string> => {
  try {
    checkRateLimit('audio');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
    logger.info('Boardroom QA generated successfully');
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
  } catch (error) {
    logger.error('Boardroom QA generation failed', error as Error);
    throw handleError(error);
  }
};

export const getMarketPulse = async (repoName: string, techStack: string[], coords?: { lat: number; lng: number }): Promise<MarketPulse> => {
  try {
    checkRateLimit('market-pulse');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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

    const chunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as GroundingChunk[];
    const resources = chunks
      .filter((chunk) => !!chunk.web)
      .map((chunk) => ({ title: chunk.web?.title || 'Resource', uri: chunk.web?.uri || '' }))
      .filter((resource) => resource.uri);
    const locations = chunks
      .filter((chunk) => !!chunk.maps)
      .map((chunk) => ({ 
        name: chunk.maps?.title || 'Location', 
        uri: chunk.maps?.uri || '', 
        snippet: chunk.maps?.placeAnswerSources?.[0]?.reviewSnippets?.[0]?.text 
      }))
      .filter((location) => location.uri);

    logger.info('Market pulse analysis completed');
    return {
      sentiment: response.text || "Pulse analysis unavailable.",
      resources: resources.slice(0, 5),
      locations: locations.slice(0, 5)
    };
  } catch (error) {
    logger.error('Market pulse analysis failed', error as Error);
    throw handleError(error);
  }
};

export const analyzeVisualPrototype = async (base64Image: string, repoContext: string): Promise<VisualAuditResult> => {
  try {
    checkRateLimit('visual-audit');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
    logger.info('Visual prototype analysis completed');
    return JSON.parse(response.text || '{}');
  } catch (error) {
    logger.error('Visual prototype analysis failed', error as Error);
    throw handleError(error);
  }
};

export const synthesizeLabTask = async (task: 'refactor' | 'test', fileName: string, content: string): Promise<string> => {
  try {
    checkRateLimit('lab-task');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [{ text: `${task} file ${fileName}:\n\n${content}` }]
      }
    });
    logger.info('Lab task synthesis completed');
    return response.text || "";
  } catch (error) {
    logger.error('Lab task synthesis failed', error as Error);
    throw handleError(error);
  }
};

export const explainCode = async (fileName: string, content: string): Promise<string> => {
  try {
    checkRateLimit('code-explain');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [{ text: `Explain ${fileName}:\n\n${content.substring(0, 3000)}` }]
      }
    });
    logger.info('Code explanation generated');
    return response.text || "";
  } catch (error) {
    logger.error('Code explanation failed', error as Error);
    throw handleError(error);
  }
};

export const chatWithRepo = async (_history: ChatMessage[], question: string, context: string): Promise<string> => {
  try {
    checkRateLimit('chat');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [{ text: `CONTEXT: ${context}\n\nQUESTION: ${question}` }]
      }
    });
    logger.info('Chat response generated');
    return response.text || "";
  } catch (error) {
    logger.error('Chat failed', error as Error);
    throw handleError(error);
  }
};

export const generateRepoSummaryReport = async (context: string): Promise<string> => {
  try {
    checkRateLimit('repo-summary');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [{
          text: `Create a concise, professional Markdown report for this repository.\n\n` +
            `Rules:\n` +
            `- Output Markdown only.\n` +
            `- Use clear headings and short bullet lists.\n` +
            `- Include: Overview, Tech Stack, Key Files, Team/Activity, Testing, Risks, Next Steps.\n\n` +
            `CONTEXT:\n${context}`
        }]
      }
    });
    logger.info('Repo summary report generated');
    return response.text || "";
  } catch (error) {
    logger.error('Repo summary report failed', error as Error);
    throw handleError(error);
  }
};

export const generateProjectPlan = async (goal: string, context: string): Promise<string> => {
  try {
    checkRateLimit('project-plan');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [{
          text: `Generate a practical project plan in Markdown.\n\n` +
            `Goal: ${goal}\n\n` +
            `Rules:\n` +
            `- Output Markdown only.\n` +
            `- Include: Objectives, Assumptions, Milestones (with time estimates), Task Breakdown, Risks, Success Metrics.\n` +
            `- Keep it readable for non-dev stakeholders.\n\n` +
            `CONTEXT:\n${context}`
        }]
      }
    });
    logger.info('Project plan generated');
    return response.text || "";
  } catch (error) {
    logger.error('Project plan generation failed', error as Error);
    throw handleError(error);
  }
};

export const generateSpeech = async (text: string): Promise<{ data: string; mimeType?: string }> => {
  try {
    checkRateLimit('speech');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
    logger.info('Speech generated successfully');
    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    return { data: inlineData?.data || '', mimeType: inlineData?.mimeType };
  } catch (error) {
    logger.error('Speech generation failed', error as Error);
    throw handleError(error);
  }
};

export const analyzeIssues = async (issues: GitHubIssue[]): Promise<InsightSummary> => {
  try {
    checkRateLimit('issues');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const issuesSummary = issues.slice(0, 20).map(i => 
      `#${i.number}: ${i.title} (${i.state}, ${i.comments} comments, labels: ${i.labels.join(', ')})`
    ).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [{
          text: `Analyze these GitHub issues and provide a concise summary.
          Return JSON with:
          - overview: 1-2 sentences
          - sections: 3-4 sections with headings and 2-4 bullet points each
          
          Focus on:
          - Overall project health
          - Common themes or patterns
          - Priority areas needing attention
          - Community engagement quality
          
          Issues:
          ${issuesSummary}`
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["heading", "bullets"]
              }
            }
          },
          required: ["overview", "sections"]
        }
      }
    });
    
    logger.info('Issues analyzed successfully');
    return JSON.parse(response.text || '{}');
  } catch (error) {
    logger.error('Issue analysis failed', error as Error);
    return { overview: 'Issue analysis unavailable', sections: [] };
  }
};

export const analyzePullRequests = async (prs: GitHubPR[]): Promise<InsightSummary> => {
  try {
    checkRateLimit('prs');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const prsSummary = prs.slice(0, 20).map(pr => 
      `#${pr.number}: ${pr.title} (${pr.state}, +${pr.additions}/-${pr.deletions}, ${pr.changed_files} files)`
    ).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [{
          text: `Analyze these pull requests and provide a concise summary.
          Return JSON with:
          - overview: 1-2 sentences
          - sections: 3-4 sections with headings and 2-4 bullet points each
          
          Focus on:
          - Code review quality indicators
          - Development velocity assessment
          - Areas of high activity/churn
          - Merge patterns and bottlenecks
          
          Pull Requests:
          ${prsSummary}`
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["heading", "bullets"]
              }
            }
          },
          required: ["overview", "sections"]
        }
      }
    });
    
    logger.info('PRs analyzed successfully');
    return JSON.parse(response.text || '{}');
  } catch (error) {
    logger.error('PR analysis failed', error as Error);
    return { overview: 'PR analysis unavailable', sections: [] };
  }
};

export const analyzeTeamDynamics = async (contributors: Contributor[], issues: GitHubIssue[], prs: GitHubPR[]): Promise<InsightSummary> => {
  try {
    checkRateLimit('team');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const topContributors = contributors.slice(0, 10).map(c => 
      `${c.login}: ${c.contributions} contributions`
    ).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [{
          text: `Analyze this team's dynamics and collaboration patterns.
          Return JSON with:
          - overview: 1-2 sentences
          - sections: 3-4 sections with headings and 2-4 bullet points each
          
          Top Contributors:
          ${topContributors}
          
          Total Issues: ${issues.length} (${issues.filter(i => i.state === 'open').length} open)
          Total PRs: ${prs.length} (${prs.filter(pr => pr.state === 'open').length} open)
          
          Focus on:
          - Contributor diversity and bus factor
          - Collaboration health
          - Maintenance sustainability
          - Community engagement`
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["heading", "bullets"]
              }
            }
          },
          required: ["overview", "sections"]
        }
      }
    });
    
    logger.info('Team dynamics analyzed successfully');
    return JSON.parse(response.text || '{}');
  } catch (error) {
    logger.error('Team analysis failed', error as Error);
    return { overview: 'Team analysis unavailable', sections: [] };
  }
};

export const generateOnboardingGuide = async (
  repoName: string, 
  structure: string, 
  readme: string, 
  techStack: string[]
): Promise<{
  quickStart: string;
  criticalFiles: string[];
  recommendedPath: string[];
  commonTasks: { task: string; steps: string[] }[];
  setupInstructions: string;
}> => {
  try {
    checkRateLimit('onboarding');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [{
          text: `You are helping a new developer who just joined a company onboard to this codebase: "${repoName}".
          
          Tech Stack: ${techStack.join(', ')}
          README: ${readme.substring(0, 1500)}
          File Structure: ${structure.substring(0, 2000)}
          
          Generate a practical onboarding guide:
          1. quickStart: A 2-3 sentence summary of what this codebase does
          2. criticalFiles: List 5-8 most important files they should read first (actual file paths from structure)
          3. recommendedPath: A step-by-step learning path (e.g., ["Start with main.ts", "Then explore /api folder", "Look at database models"])
          4. commonTasks: 3 common tasks developers do here (e.g., "Add a new API endpoint", "Create a new component", "Fix a bug") with brief steps
          5. setupInstructions: How to get this running locally (based on README)`
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quickStart: { type: Type.STRING },
            criticalFiles: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedPath: { type: Type.ARRAY, items: { type: Type.STRING } },
            commonTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  task: { type: Type.STRING },
                  steps: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["task", "steps"]
              }
            },
            setupInstructions: { type: Type.STRING }
          },
          required: ["quickStart", "criticalFiles", "recommendedPath", "commonTasks", "setupInstructions"]
        }
      }
    });
    
    logger.info('Onboarding guide generated', { repoName });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    logger.error('Onboarding guide generation failed', error as Error);
    throw handleError(error);
  }
};

export const analyzeCodeOwnership = async (commits: GitHubCommit[], contributors: Contributor[]) => {
  try {
    checkRateLimit('ownership');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    // Build file-to-author map from recent commits
    const fileOwnership: { [key: string]: { author: string; count: number }[] } = {};
    
    commits.forEach((commit) => {
      const author = commit.commit?.author?.name || commit.author?.login || 'Unknown';
      if (commit.files) {
        commit.files.forEach((file) => {
          if (!fileOwnership[file.filename]) fileOwnership[file.filename] = [];
          const existing = fileOwnership[file.filename].find(o => o.author === author);
          if (existing) existing.count++;
          else fileOwnership[file.filename].push({ author, count: 1 });
        });
      }
    });
    
    // Get top owners per path
    const ownershipSummary = Object.entries(fileOwnership)
      .slice(0, 30)
      .map(([path, authors]) => {
        const sorted = authors.sort((a, b) => b.count - a.count);
        return `${path}: ${sorted[0].author} (${sorted[0].count} edits)`;
      })
      .join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [{
          text: `Analyze code ownership patterns and provide guidance for new developers:
          
          File Ownership:
          ${ownershipSummary}
          
          Top Contributors: ${contributors.slice(0, 5).map((contributor) => contributor.login).join(', ')}
          
          Provide:
          1. Who to ask about different parts of the codebase
          2. Which areas have clear ownership vs shared
          3. Any "bus factor" concerns (critical knowledge held by one person)`
        }]
      }
    });
    
    return response.text || 'Unable to analyze code ownership';
  } catch (error) {
    logger.error('Code ownership analysis failed', error as Error);
    return 'Code ownership analysis unavailable';
  }
};

export const analyzeRecentActivity = async (recentCommits: GitHubCommit[]) => {
  try {
    checkRateLimit('activity');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    // Build activity heatmap
    const fileActivity: { [key: string]: number } = {};
    const authorActivity: { [key: string]: number } = {};
    
    recentCommits.forEach((commit) => {
      const author = commit.commit?.author?.name || commit.author?.login || 'Unknown';
      authorActivity[author] = (authorActivity[author] || 0) + 1;
      
      if (commit.files) {
        commit.files.forEach((file) => {
          fileActivity[file.filename] = (fileActivity[file.filename] || 0) + 1;
        });
      }
    });
    
    const hotFiles = Object.entries(fileActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([file, count]) => `${file} (${count} changes)`)
      .join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [{
          text: `Analyze recent development activity (last 7 days):
          
          Total Commits: ${recentCommits.length}
          Active Developers: ${Object.keys(authorActivity).length}
          
          Hot Files (most changed):
          ${hotFiles}
          
          Active Contributors:
          ${Object.entries(authorActivity).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, count]) => `${name}: ${count} commits`).join('\n')}
          
          Provide insights:
          1. What areas are under active development (hot zones - be careful)
          2. What's stable (safe to explore)
          3. Development velocity and patterns`
        }]
      }
    });
    
    return { 
      summary: response.text || 'Unable to analyze activity',
      hotFiles: Object.entries(fileActivity).sort(([, a], [, b]) => b - a).slice(0, 10),
      totalCommits: recentCommits.length,
      activeDevs: Object.keys(authorActivity).length
    };
  } catch (error) {
    logger.error('Activity analysis failed', error as Error);
    return {
      summary: 'Activity analysis unavailable',
      hotFiles: [],
      totalCommits: 0,
      activeDevs: 0
    };
  }
};

export const analyzeTestingSetup = async (structure: string, readme: string) => {
  try {
    checkRateLimit('testing');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [{
          text: `Analyze the testing setup for a new developer:
          
          File Structure:
          ${structure.substring(0, 2000)}
          
          README:
          ${readme.substring(0, 1500)}
          
          Identify:
          1. hasTests: Are there test files? (boolean)
          2. testFramework: What testing framework (Jest, Vitest, pytest, etc.)
          3. testCommand: How to run tests (npm test, pytest, etc.)
          4. testFiles: List 3-5 test file paths
          5. guidance: How to write/run tests for new features`
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasTests: { type: Type.BOOLEAN },
            testFramework: { type: Type.STRING },
            testCommand: { type: Type.STRING },
            testFiles: { type: Type.ARRAY, items: { type: Type.STRING } },
            guidance: { type: Type.STRING }
          },
          required: ["hasTests", "testFramework", "testCommand", "testFiles", "guidance"]
        }
      }
    });
    
    logger.info('Testing setup analyzed');
    return JSON.parse(response.text || '{}');
  } catch (error) {
    logger.error('Testing analysis failed', error as Error);
    return {
      hasTests: false,
      testFramework: 'Unknown',
      testCommand: 'Unknown',
      testFiles: [],
      guidance: 'Unable to determine testing setup'
    };
  }
};
