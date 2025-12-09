/**
 * EVIDENRA API Client
 *
 * Gemeinsamer Client für Basic, Pro, Ultimate und PWA
 * Kommuniziert mit dem geschützten Railway Analyse-Server
 */

export interface EvidenraClientConfig {
  serverUrl?: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  subscription: 'free' | 'basic' | 'pro' | 'ultimate';
  onAuthError?: () => void;
}

export interface AnalyzeRequest {
  text: string;
  methodology?: 'mayring' | 'grounded-theory' | 'thematic' | 'discourse';
  personas?: string[];
  options?: {
    approach?: 'structuring' | 'summarizing' | 'explicating';
    categories?: Array<{ name: string; definition?: string }>;
    unitOfAnalysis?: 'sentence' | 'paragraph' | 'meaning-unit';
    anchorExamples?: boolean;
  };
}

export interface AnalyzeResponse {
  success: boolean;
  codings: Array<{
    id: string;
    text: string;
    category: string;
    subcategory?: string;
    reasoning?: string;
    confidence: number;
  }>;
  categories: Array<{
    name: string;
    definition?: string;
    anchorExample?: string;
    codingRule?: string;
  }>;
  akihScore?: {
    overall: number;
    dimensions: Record<string, number>;
    level: string;
    recommendations: Array<{
      dimension: string;
      priority: string;
      message: string;
    }>;
  };
  personaInsights?: {
    individualAnalyses: any[];
    synthesis: any;
    personasUsed: string[];
  };
  methodology: string;
  timestamp: string;
}

export interface GenesisEvolveRequest {
  prompt: string;
  fitness?: 'quality' | 'speed' | 'accuracy';
  generations?: number;
  populationSize?: number;
}

export interface GenesisEvolveResponse {
  success: boolean;
  evolvedPrompt: string;
  fitness: number;
  generations: number;
  improvements: Array<{
    generation: number;
    fitness: number;
    improvement: number;
  }>;
}

/**
 * EVIDENRA API Client
 */
export class EvidenraClient {
  private serverUrl: string;
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private subscription: string;
  private accessToken: string | null = null;
  private onAuthError?: () => void;

  constructor(config: EvidenraClientConfig) {
    this.serverUrl = config.serverUrl || 'https://api.evidenra.app';
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
   *
   * Feature-Matrix:
   * - free: basic-analysis
   * - basic: akih, genesis, 3-personas
   * - pro: akih, genesis, 7-personas, advanced-methodologies
   * - ultimate: alles + team-collaboration + quantum-coding
   */
  hasFeature(feature: 'genesis' | 'akih' | 'personas' | 'advanced-methodologies' | 'team-collaboration' | 'quantum-coding'): boolean {
    const features = {
      free: [],
      basic: ['akih', 'genesis', 'personas'],  // Basic hat auch Genesis!
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

  // ==========================================
  // ANALYSE ENDPOINTS
  // ==========================================

  /**
   * Führt Analyse durch
   * Verfügbar für: alle Subscriptions
   */
  async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    return this.request<AnalyzeResponse>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Berechnet AKIH Score
   * Verfügbar für: basic, pro, ultimate
   */
  async calculateAKIHScore(data: {
    codings: any[];
    text: string;
    methodology?: string;
  }): Promise<any> {
    if (!this.hasFeature('akih')) {
      throw new Error('AKIH Scoring requires Basic or higher subscription');
    }

    return this.request('/api/score', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Generiert Kategorien automatisch
   * Verfügbar für: alle Subscriptions
   */
  async generateCategories(data: {
    codings: any[];
    methodology?: string;
    existingCategories?: any[];
  }): Promise<any> {
    return this.request('/api/generate-categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ==========================================
  // PERSONA ENDPOINTS
  // ==========================================

  /**
   * Analysiert Text mit mehreren Personas
   * Verfügbar für: pro, ultimate
   */
  async analyzeWithPersonas(data: {
    text: string;
    personas: string[];
  }): Promise<any> {
    if (!this.hasFeature('personas')) {
      throw new Error('Multi-Persona Analysis requires Pro or higher subscription');
    }

    return this.request('/api/personas/analyze', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Gibt verfügbare Personas zurück
   */
  async getAvailablePersonas(): Promise<Array<{
    key: string;
    name: string;
    description: string;
  }>> {
    return this.request('/api/personas/list', {
      method: 'GET'
    });
  }

  // ==========================================
  // GENESIS ENDPOINTS
  // ==========================================

  /**
   * Evolviert einen Prompt mit Genesis Engine
   * Verfügbar für: pro, ultimate
   */
  async evolvePrompt(request: GenesisEvolveRequest): Promise<GenesisEvolveResponse> {
    if (!this.hasFeature('genesis')) {
      throw new Error('Genesis Engine requires Pro or higher subscription');
    }

    return this.request<GenesisEvolveResponse>('/api/genesis/evolve', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  // ==========================================
  // HEALTH & STATUS
  // ==========================================

  /**
   * Prüft Server-Verfügbarkeit
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
   * Gibt Subscription-Features zurück
   *
   * Feature-Matrix nach Produktversion:
   * - Basic (7.6): AKIH, Genesis, 3 Personas, Mayring/Thematic
   * - Pro (1.0): Basic + 7 Personas, Grounded Theory, Discourse
   * - Ultimate (1.0): Pro + Team Collaboration, Quantum Coding, unlimited
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
          personas: ['orthodox'],
          methodologies: ['basic'],
          genesis: false
        }
      },
      basic: {
        // EVIDENRA Basic 7.6 hat: AKIH, Genesis, 3 Personas
        features: ['basic-analysis', 'akih', 'genesis', 'personas'],
        limits: {
          maxDocuments: 20,
          maxAnalysesPerDay: 100,
          personas: ['orthodox', 'hermeneutic', 'critical'],  // 3 Personas
          methodologies: ['mayring', 'thematic'],
          genesis: true
        }
      },
      pro: {
        // EVIDENRA Pro 1.0 hat: Basic + 7 Personas, mehr Methodologien
        features: ['basic-analysis', 'akih', 'genesis', 'personas', 'advanced-methodologies'],
        limits: {
          maxDocuments: 100,
          maxAnalysesPerDay: 500,
          personas: ['orthodox', 'hermeneutic', 'critical', 'phenomenological', 'feminist', 'pragmatist', 'deconstructionist'],  // 7 Personas
          methodologies: ['mayring', 'thematic', 'grounded-theory', 'discourse'],
          genesis: true
        }
      },
      ultimate: {
        // EVIDENRA Ultimate 1.0 hat: alles + Team + Quantum
        features: ['basic-analysis', 'akih', 'genesis', 'personas', 'advanced-methodologies', 'team-collaboration', 'quantum-coding'],
        limits: {
          maxDocuments: -1,
          maxAnalysesPerDay: -1,
          personas: 'all',
          methodologies: 'all',
          genesis: true
        }
      }
    };

    return {
      subscription: this.subscription,
      ...features[this.subscription] || features.free
    };
  }
}

/**
 * Factory-Funktion für einfache Initialisierung
 */
export function createEvidenraClient(config: EvidenraClientConfig): EvidenraClient {
  return new EvidenraClient(config);
}

export default EvidenraClient;
