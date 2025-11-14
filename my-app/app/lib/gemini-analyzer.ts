import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { TechnologyProfile, CodeFile, RepositorySummary } from '../types/github-analysis';

export class GeminiCodeAnalyzer {
  private genAI: GoogleGenerativeAI;
  private models: GenerativeModel[];
  private modelNames: string[];
  private currentModelIndex: number;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.NEXT_PUBLIC_GEMENI_API_KEY;
    if (!key) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(key);
    
    // Define fallback models in order of preference (updated with available stable models)
    this.modelNames = [
      'gemini-2.5-pro',           // Stable release (June 17th, 2025) of Gemini 2.5 Pro
      'gemini-2.5-flash',         // Stable version of Gemini 2.5 Flash (June 2025)
      'gemini-2.0-flash-001',     // Stable version of Gemini 2.0 Flash (January 2025)
      'gemini-2.5-flash-lite'     // Stable version of Gemini 2.5 Flash-Lite (July 2025)
    ];
    
    this.models = this.modelNames.map(name => 
      this.genAI.getGenerativeModel({ model: name })
    );
    this.currentModelIndex = 0;
  }

  /**
   * Analyze a single code file for technologies (evidence-based)
   */
  async analyzeCodeFile(content: string, filename: string): Promise<TechnologyProfile> {
    const snippet = content.substring(0, 4000);

    const prompt = `
You are analyzing a SINGLE code file.

Extract ONLY technologies that are EXPLICITLY referenced in this file via:
- import/require/use statements
- package/dependency definitions
- configuration files / keys
- explicit client/SDK usage
- URLs/hostnames that clearly indicate a specific service

Rules:
- DO NOT guess based on what is "commonly" used with a language.
- DO NOT include databases, cloud providers, tools, or frameworks unless there is direct textual evidence.
- If unsure, leave it out.
- Output must be STRICTLY valid JSON. No prose, no markdown, no comments.

Filename: ${filename}

Code:
\`\`\`
${snippet}${content.length > 4000 ? '\n...[truncated]' : ''}
\`\`\`

Return ONLY valid JSON in this exact format:
{
  "frameworks": [],
  "databases": [],
  "cloudServices": [],
  "devOps": [],
  "libraries": [],
  "architecturalPatterns": [],
  "languages": []
}
    `.trim();

    return this.tryWithModelFallback(async (model) => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      const json = this.safeParseTechnologyJson(text);
      return json ?? this.getEmptyProfile();
    });
  }

  /**
   * Analyze repository using key files.
   */
  async analyzeRepository(files: CodeFile[]): Promise<TechnologyProfile> {
    if (!files || files.length === 0) {
      return this.getEmptyProfile();
    }

    const priorityFiles = this.prioritizeFiles(files);
    const analysisResults: TechnologyProfile[] = [];

    for (const file of priorityFiles.slice(0, 10)) {
      try {
        const result = await this.analyzeCodeFile(file.content, file.name);
        if (result) analysisResults.push(result);
      } catch (error) {
        console.error(`Error analyzing file ${file.name}:`, error);
      }
    }

    const merged = this.mergeAnalysisResults(analysisResults);
    // Only aggressively verify high-risk categories (db/cloud/devops),
    // keep frameworks/languages mostly as returned (prompts are strict).
    const verified = this.verifyTechnologies(merged, files);
    return verified;
  }

  /**
   * Analyze overall tech stack from repository summary (metadata only).
   */
  async analyzeRepositorySummary(repoSummary: RepositorySummary): Promise<TechnologyProfile> {
    const prompt = `
You are analyzing a GitHub repository using ONLY the provided metadata.

Repository: ${repoSummary.name}
Description: ${repoSummary.description || 'No description'}
Topics: ${repoSummary.topics?.join(', ') || 'None'}
Languages: ${Object.keys(repoSummary.languages || {}).join(', ')}
Key Files: ${repoSummary.keyFiles?.join(', ') || 'None'}

Rules:
- Only include a technology if there is a CLEAR textual indication in this metadata.
- Examples:
    - "nextjs" topic or "next.config.js" -> Next.js
    - "docker-compose.yml"/"Dockerfile" -> Docker
    - "postgres" in description/topics -> PostgreSQL
- DO NOT infer based purely on language (e.g. don't assume AWS or MongoDB).
- If no evidence, leave arrays empty.
- Output must be STRICTLY valid JSON. No extra text.

Return ONLY JSON:
{
  "frameworks": [],
  "databases": [],
  "cloudServices": [],
  "devOps": [],
  "libraries": [],
  "architecturalPatterns": [],
  "languages": []
}
    `.trim();

    return this.tryWithModelFallback(async (model) => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      const json = this.safeParseTechnologyJson(text) ?? this.getEmptyProfile();
      // For summary, verify only against metadata (no file content here).
      const verified = this.verifyTechnologies(json, [], repoSummary);
      return verified;
    }).catch(error => {
      console.error('Error analyzing repository summary with all Gemini models:', error);
      return this.getEmptyProfile();
    });
  }

  /**
   * Prioritize files for analysis based on importance.
   */
  private prioritizeFiles(files: CodeFile[]): CodeFile[] {
    const priorityOrder = [
      'package.json', 'requirements.txt', 'go.mod', 'cargo.toml', 'pom.xml',
      'dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
      'main.py', 'app.py', 'index.js', 'main.js', 'main.go', 'main.rs',
      'server.js', 'app.js', 'index.ts', 'main.ts',
      'next.config.js', 'nuxt.config.js', 'vue.config.js',
      'settings.py', 'config.py', 'application.properties'
    ];

    const priorityFiles: CodeFile[] = [];
    const otherFiles: CodeFile[] = [];

    for (const file of files) {
      const fileName = file.name.toLowerCase();
      const isHighPriority = priorityOrder.some(p =>
        fileName.includes(p.toLowerCase())
      );
      (isHighPriority ? priorityFiles : otherFiles).push(file);
    }

    priorityFiles.sort((a, b) => {
      const aIndex = priorityOrder.findIndex(p =>
        a.name.toLowerCase().includes(p.toLowerCase())
      );
      const bIndex = priorityOrder.findIndex(p =>
        b.name.toLowerCase().includes(p.toLowerCase())
      );
      return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex);
    });

    return [...priorityFiles, ...otherFiles];
  }

  /**
   * Merge multiple analysis results.
   */
  private mergeAnalysisResults(results: TechnologyProfile[]): TechnologyProfile {
    const merged: TechnologyProfile = this.getEmptyProfile();

    for (const result of results) {
      if (!result || typeof result !== 'object') continue;

      (Object.keys(merged) as (keyof TechnologyProfile)[]).forEach(key => {
        const values = Array.isArray(result[key]) ? result[key] : [];
        merged[key] = merged[key].concat(values);
      });
    }

    (Object.keys(merged) as (keyof TechnologyProfile)[]).forEach(key => {
      merged[key] = Array.from(new Set(merged[key])).filter(Boolean);
    });

    return merged;
  }

  /**
   * Evidence-based verification.
   * - Strong filtering for DB / cloud / devops / libraries.
   * - Keep frameworks/languages mostly as-is to avoid wiping everything.
   */
  private verifyTechnologies(
    merged: TechnologyProfile,
    files: CodeFile[] = [],
    repoSummary?: RepositorySummary
  ): TechnologyProfile {
    const textParts: string[] = [];

    for (const f of files) {
      if (f.path) textParts.push(f.path);
      if (f.content) textParts.push(f.content.substring(0, 8000));
    }

    if (repoSummary) {
      if (repoSummary.name) textParts.push(repoSummary.name);
      if (repoSummary.description) textParts.push(repoSummary.description);
      if (repoSummary.topics?.length) textParts.push(repoSummary.topics.join(' '));
      if (repoSummary.keyFiles?.length) textParts.push(repoSummary.keyFiles.join(' '));
    }

    const corpus = textParts.join('\n').toLowerCase();

    const strongFilter = (items: string[]): string[] =>
      items.filter(item => corpus.includes(item.toLowerCase()));

    // Apply strict evidence filter ONLY where hallucinations are common.
    return {
      frameworks: merged.frameworks, // trust prompt + per-file evidence
      languages: merged.languages,   // trust prompt + per-file evidence
      libraries: strongFilter(merged.libraries),
      databases: strongFilter(merged.databases),
      cloudServices: strongFilter(merged.cloudServices),
      devOps: strongFilter(merged.devOps),
      architecturalPatterns: merged.architecturalPatterns || [],
    };
  }

  /**
   * Safely parse technology JSON from model response.
   */
  private safeParseTechnologyJson(raw: string): TechnologyProfile | null {
    try {
      // Grab the first {...} block if there's extra text.
      const match = raw.match(/\{[\s\S]*\}/);
      const jsonText = match ? match[0] : raw;

      const parsed = JSON.parse(jsonText);

      const empty = this.getEmptyProfile();
      (Object.keys(empty) as (keyof TechnologyProfile)[]).forEach(key => {
        if (!Array.isArray(parsed[key])) parsed[key] = [];
      });

      return parsed as TechnologyProfile;
    } catch (e) {
      console.error('Failed to parse technology JSON from model response:', e, '\nRaw:', raw);
      return null;
    }
  }

  private getEmptyProfile(): TechnologyProfile {
    return {
      frameworks: [],
      databases: [],
      cloudServices: [],
      devOps: [],
      libraries: [],
      architecturalPatterns: [],
      languages: []
    };
  }

  private async tryWithModelFallback<T>(
    operation: (model: GenerativeModel) => Promise<T>
  ): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i < this.models.length; i++) {
      const modelIndex = (this.currentModelIndex + i) % this.models.length;
      const model = this.models[modelIndex];
      const modelName = this.modelNames[modelIndex];

      try {
        console.log(`Trying Gemini model: ${modelName}`);
        const result = await operation(model);
        
        // Success! Update current model to this working one
        this.currentModelIndex = modelIndex;
        return result;
        
      } catch (error: unknown) {
        lastError = error;
        console.log(
          `Model ${modelName} failed: ${(error as Error).message || error}. Trying next model...`
        );
        
        // If this is a non-retryable error (like invalid API key), don't try other models
        const errorObj = error as { message?: string };
        if (
          errorObj?.message?.includes('API key') ||
          errorObj?.message?.includes('Invalid JSON')
        ) {
          throw error;
        }
      }
    }

    // All models failed
    console.error('All Gemini models failed:', lastError);
    throw lastError;
  }

  private isRetryableError(error: unknown): boolean {
    const retryableTokens = [
      'service unavailable',
      'overloaded',
      'timeout',
      'rate limit',
      '503',
      '429',
      '500',
      '502',
      '504'
    ];

    const errorObj = error as { message?: string; status?: string | number };
    const msg = (errorObj?.message || '').toLowerCase();
    const status = (errorObj?.status || '').toString();

    return retryableTokens.some(token => msg.includes(token) || status.includes(token));
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default GeminiCodeAnalyzer;
