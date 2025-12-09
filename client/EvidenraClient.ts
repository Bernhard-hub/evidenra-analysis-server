/**
 * EVIDENRA Client SDK - Prompt-Only Architecture
 *
 * Der Server liefert NUR geschützte Prompts.
 * Die App führt KI-Aufrufe selbst durch (mit AIBridge/eigenem API Key).
 *
 * Flow:
 * 1. App holt Prompts vom Server (authentifiziert mit Supabase JWT)
 * 2. App führt KI-Analyse lokal durch (Ollama) oder Cloud (Claude mit eigenem Key)
 * 3. App sendet Ergebnisse zur AKIH-Bewertung an Server
 */

export interface EvidenraClientConfig {
  serverUrl?: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  subscription: 'free' | 'basic' | 'pro' | 'ultimate';
  onAuthError?: () => void;
}

export interface MethodologyPrompts {
  systemPrompt: string;
  userPromptTemplate: string;
  approach?: string;
  outputFormat?: {
    type: string;
    schema: any;
  };
}

export interface PersonaPrompt {
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
}

export interface AKIHScoreResult {
  score: number;
  level: string;
  dimensions: Record<string, number>;
  recommendations: Array<{
    dimension: string;
    priority: string;
    message: string;
  }>;
}

/**
 * EVIDENRA API Client - Prompt-Only Architecture
 */
export class EvidenraClient {
  private serverUrl: string;
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private subscription: string;
  private accessToken: string | null = null;
  private onAuthError?: () => void;

  // Cache für Prompts (vermeidet wiederholte Server-Aufrufe)
  private promptCache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 Minuten

  constructor(config: EvidenraClientConfig) {
    this.serverUrl = config.serverUrl || 'https://evidenra-analysis-server-production-ad93.up.railway.app';
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseAnonKey = config.supabaseAnonKey;
    this.subscription = config.subscription;
    this.onAuthError = config.onAuthError;
  }

  /**
   * Setzt das Access Token (von Supabase Auth)
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Setzt das Subscription Level
   */
  setSubscription(subscription: 'free' | 'basic' | 'pro' | 'ultimate') {
    this.subscription = subscription;
  }

  /**
   * Prüft ob Feature verfügbar ist
   */
  hasFeature(feature: 'genesis' | 'akih' | 'personas' | 'advanced-methodologies' | 'team-collaboration' | 'quantum-coding'): boolean {
    const features = {
      free: [],
      basic: ['akih', 'genesis', 'personas'],
      pro: ['akih', 'genesis', 'personas', 'advanced-methodologies'],
      ultimate: ['akih', 'genesis', 'personas', 'advanced-methodologies', 'team-collaboration', 'quantum-coding']
    };
    return features[this.subscription]?.includes(feature) || false;
  }

  /**
   * Basis-Request an Server
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Call setAccessToken() first.');
    }

    const url = `${this.serverUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Subscription': this.subscription,
        ...options.headers
      }
    });

    if (response.status === 401) {
      this.onAuthError?.();
      throw new Error('Authentication expired. Please login again.');
    }

    if (response.status === 403) {
      const error = await response.json();
      throw new Error(error.message || 'Feature not available for your subscription');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Cached Request
   */
  private async cachedRequest<T>(cacheKey: string, endpoint: string): Promise<T> {
    const cached = this.promptCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as T;
    }

    const data = await this.request<T>(endpoint);
    this.promptCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  // ==========================================
  // PROMPT ENDPOINTS - Holt geschützte Prompts
  // ==========================================

  /**
   * Holt Methodologie-Prompts (Mayring, Grounded Theory, etc.)
   * Diese Prompts werden dann lokal mit AIBridge verwendet
   */
  async getMethodologyPrompts(
    methodology: 'mayring' | 'grounded-theory' | 'thematic' | 'discourse',
    options?: { approach?: string }
  ): Promise<MethodologyPrompts> {
    const queryParams = options?.approach ? `?approach=${options.approach}` : '';
    const response = await this.cachedRequest<any>(
      `methodology-${methodology}-${options?.approach || 'default'}`,
      `/api/prompts/methodology/${methodology}${queryParams}`
    );
    return response.prompts;
  }

  /**
   * Holt verfügbare Persona-Prompts (je nach Subscription)
   */
  async getPersonaPrompts(): Promise<Record<string, PersonaPrompt>> {
    const response = await this.cachedRequest<any>(
      `personas-${this.subscription}`,
      '/api/prompts/personas'
    );
    return response.personas;
  }

  /**
   * Holt Genesis Engine Konfiguration (nur Pro/Ultimate)
   */
  async getGenesisConfig(): Promise<{
    defaultParameters: any;
    mutationOperators: any[];
    fitnessMetrics: any;
  }> {
    if (!this.hasFeature('genesis')) {
      throw new Error('Genesis Engine requires Basic or higher subscription');
    }
    return this.cachedRequest('/api/prompts/genesis', '/api/prompts/genesis');
  }

  // ==========================================
  // SCORING ENDPOINTS - Server berechnet Scores
  // ==========================================

  /**
   * Sendet Analyse-Ergebnisse zur AKIH-Bewertung
   * Die KI-Analyse wurde lokal durchgeführt, der Score wird serverseitig berechnet
   */
  async calculateAKIHScore(data: {
    codings: Array<{
      text: string;
      category: string;
      reasoning?: string;
      confidence?: number;
    }>;
    text: string;
    methodology?: string;
    categories?: Array<{
      name: string;
      definition?: string;
      anchorExample?: string;
    }>;
  }): Promise<AKIHScoreResult> {
    if (!this.hasFeature('akih')) {
      throw new Error('AKIH Scoring requires Basic or higher subscription');
    }

    return this.request('/api/score/akih', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Holt AKIH Dimensionen und Level-Definitionen
   */
  async getAKIHDimensions(): Promise<{
    dimensions: Record<string, { name: string; description: string; weight: number }>;
    levels: Record<string, { min: number; max: number; description: string }>;
  }> {
    if (!this.hasFeature('akih')) {
      throw new Error('AKIH Scoring requires Basic or higher subscription');
    }
    return this.cachedRequest('akih-dimensions', '/api/score/akih/dimensions');
  }

  // ==========================================
  // FEATURE INFO
  // ==========================================

  /**
   * Gibt verfügbare Features zurück
   */
  async getFeatures(): Promise<{
    subscription: string;
    features: any;
  }> {
    return this.request('/api/features');
  }

  /**
   * Gibt Liste aller Personas mit Verfügbarkeit zurück
   */
  async getPersonaList(): Promise<Array<{
    key: string;
    name: string;
    description: string;
    available: boolean;
  }>> {
    const response = await this.request<any>('/api/personas/list');
    return response.personas;
  }

  // ==========================================
  // HEALTH & STATUS
  // ==========================================

  /**
   * Prüft Server-Verfügbarkeit (ohne Auth)
   */
  async healthCheck(): Promise<{
    status: string;
    version: string;
    timestamp: string;
  }> {
    const response = await fetch(`${this.serverUrl}/health`);
    return response.json();
  }

  /**
   * Gibt Subscription-Features zurück (lokale Berechnung)
   */
  getSubscriptionFeatures(): {
    subscription: string;
    features: string[];
    limits: {
      maxDocuments: number;
      maxAnalysesPerDay: number;
      personas: string[] | 'all';
      methodologies: string[] | 'all';
      genesis: boolean;
    };
  } {
    const features = {
      free: {
        features: ['basic-analysis'],
        limits: {
          maxDocuments: 3,
          maxAnalysesPerDay: 5,
          personas: ['orthodox'] as string[],
          methodologies: ['basic'] as string[],
          genesis: false
        }
      },
      basic: {
        features: ['basic-analysis', 'akih', 'genesis', 'personas'],
        limits: {
          maxDocuments: 20,
          maxAnalysesPerDay: 100,
          personas: ['orthodox', 'hermeneutic', 'critical'] as string[],
          methodologies: ['mayring', 'thematic'] as string[],
          genesis: true
        }
      },
      pro: {
        features: ['basic-analysis', 'akih', 'genesis', 'personas', 'advanced-methodologies'],
        limits: {
          maxDocuments: 100,
          maxAnalysesPerDay: 500,
          personas: ['orthodox', 'hermeneutic', 'critical', 'phenomenological', 'feminist', 'pragmatist', 'deconstructionist'] as string[],
          methodologies: ['mayring', 'thematic', 'grounded-theory', 'discourse'] as string[],
          genesis: true
        }
      },
      ultimate: {
        features: ['basic-analysis', 'akih', 'genesis', 'personas', 'advanced-methodologies', 'team-collaboration', 'quantum-coding'],
        limits: {
          maxDocuments: -1,
          maxAnalysesPerDay: -1,
          personas: 'all' as const,
          methodologies: 'all' as const,
          genesis: true
        }
      }
    };

    return {
      subscription: this.subscription,
      ...features[this.subscription] || features.free
    };
  }

  /**
   * Leert den Prompt-Cache
   */
  clearCache() {
    this.promptCache.clear();
  }
}

/**
 * Factory-Funktion für einfache Initialisierung
 */
export function createEvidenraClient(config: EvidenraClientConfig): EvidenraClient {
  return new EvidenraClient(config);
}

export default EvidenraClient;
