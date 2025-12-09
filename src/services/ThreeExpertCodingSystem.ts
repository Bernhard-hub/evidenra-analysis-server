// src/services/ThreeExpertCodingSystem.ts

import APIService from './APIService';
import ExpertPersonaGenerator, { ExpertPersona, CodingCategory } from './ExpertPersonaGenerator';
import ExpertCodingPrompts, { CodingResponse, CodingPromptOptions } from './ExpertCodingPrompts';
import ScientificallyValidIRR, {
  FleissKappaResult,
  KrippendorffResult,
  CodingData
} from './ScientificallyValidIRR';

export interface TextSegment {
  id: string;
  text: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface ExpertCoding extends CodingResponse {
  expertId: number;
  expertName: string;
  timestamp: string;
  processingTime?: number;
}

export interface SegmentCoding {
  segmentId: string;
  segment: TextSegment;
  codings: ExpertCoding[];
  consensus: ConsensusResult;
  timestamp: string;
}

export interface ConsensusResult {
  category: string;
  agreement: number;
  agreementType: 'unanimous' | 'majority' | 'split';
  isMajority: boolean;
  isUnanimous: boolean;
  conflictCategories?: string[];
  confidenceScore: number;
}

export interface ReliabilityMetrics {
  fleissKappa: FleissKappaResult;
  krippendorffAlpha: KrippendorffResult;
  consensusRate: number;
  unanimousRate: number;
  averageConfidence: number;
  categoryDistribution: Record<string, number>;
  expertAgreementMatrix: number[][];
}

export interface CodingSession {
  id: string;
  experts: ExpertPersona[];
  categories: CodingCategory[];
  segments: TextSegment[];
  codings: SegmentCoding[];
  reliabilityMetrics?: ReliabilityMetrics;
  status: 'initialized' | 'coding' | 'completed' | 'analyzing';
  progress: {
    segmentsCoded: number;
    totalSegments: number;
    percentage: number;
    estimatedTimeRemaining?: number;
  };
  startTime: string;
  endTime?: string;
  configuration: CodingSessionConfig;
}

export interface CodingSessionConfig {
  strictMode: boolean;
  allowUncertainty: boolean;
  confidenceThreshold: number;
  requireConsensus: boolean;
  maxRetries: number;
  realTimeReliability: boolean;
  batchSize: number;
}

export class ThreeExpertCodingSystem {
  private personaGenerator: ExpertPersonaGenerator;
  private promptGenerator: ExpertCodingPrompts;
  private irrCalculator: ScientificallyValidIRR;

  private experts: ExpertPersona[] = [];
  private currentSession?: CodingSession;
  private apiSettings: any;

  // Event listeners for real-time updates
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.personaGenerator = new ExpertPersonaGenerator();
    this.promptGenerator = new ExpertCodingPrompts();
    this.irrCalculator = new ScientificallyValidIRR();
  }

  /**
   * Initialisiert Experten basierend auf Dokumenten
   */
  async initializeExperts(
    documents: any[],
    categories: CodingCategory[],
    apiSettings: any
  ): Promise<ExpertPersona[]> {
    this.apiSettings = apiSettings;

    try {
      this.experts = await this.personaGenerator.generateExpertsFromDocuments(
        documents,
        categories,
        apiSettings
      );

      this.emit('expertsGenerated', { experts: this.experts });

      console.log('Generated Expert Personas:', this.experts);
      return this.experts;
    } catch (error) {
      console.error('Expert initialization failed:', error);
      throw new Error(`Failed to initialize experts: ${error}`);
    }
  }

  /**
   * Erstellt eine neue Kodierungs-Session
   */
  createCodingSession(
    segments: TextSegment[],
    categories: CodingCategory[],
    config: Partial<CodingSessionConfig> = {}
  ): CodingSession {
    if (this.experts.length === 0) {
      throw new Error('Experts must be initialized before creating coding session');
    }

    const sessionId = this.generateSessionId();

    const defaultConfig: CodingSessionConfig = {
      strictMode: false,
      allowUncertainty: true,
      confidenceThreshold: 0.5,
      requireConsensus: false,
      maxRetries: 1,
      realTimeReliability: true,
      batchSize: 10
    };

    this.currentSession = {
      id: sessionId,
      experts: [...this.experts],
      categories: [...categories],
      segments: [...segments],
      codings: [],
      status: 'initialized',
      progress: {
        segmentsCoded: 0,
        totalSegments: segments.length,
        percentage: 0
      },
      startTime: new Date().toISOString(),
      configuration: { ...defaultConfig, ...config }
    };

    this.emit('sessionCreated', { session: this.currentSession });
    return this.currentSession;
  }

  /**
   * Kodiert ein einzelnes Segment mit allen drei Experten
   */
  async codeSegmentWithAllExperts(
    segment: TextSegment,
    categories: CodingCategory[],
    options: CodingPromptOptions = {}
  ): Promise<SegmentCoding> {
    if (this.experts.length !== 3) {
      throw new Error('Exactly 3 experts required for coding');
    }

    const startTime = Date.now();
    const codings: ExpertCoding[] = [];

    // Code mit jedem Experten
    for (let i = 0; i < this.experts.length; i++) {
      const expert = this.experts[i];

      try {
        const coding = await this.codeWithSingleExpert(
          expert,
          segment,
          categories,
          options,
          i
        );
        codings.push(coding);

        this.emit('expertCodingComplete', {
          segmentId: segment.id,
          expertId: i,
          coding
        });

      } catch (error) {
        console.error(`Coding failed for expert ${i}:`, error);

        // Fallback-Kodierung mit niedriger Konfidenz
        codings.push({
          category: categories[0].name, // Fallback zur ersten Kategorie
          confidence: 0.1,
          rationale: `Coding failed: ${error}`,
          expertId: i,
          expertName: expert.name,
          timestamp: new Date().toISOString(),
          uncertaintyFlag: true
        });
      }
    }

    // Bestimme Konsens
    const consensus = this.determineConsensus(codings, categories);

    const segmentCoding: SegmentCoding = {
      segmentId: segment.id,
      segment,
      codings,
      consensus,
      timestamp: new Date().toISOString()
    };

    this.emit('segmentCoded', {
      segmentCoding,
      processingTime: Date.now() - startTime
    });

    return segmentCoding;
  }

  /**
   * Kodiert mit einem einzelnen Experten
   */
  private async codeWithSingleExpert(
    expert: ExpertPersona,
    segment: TextSegment,
    categories: CodingCategory[],
    options: CodingPromptOptions,
    expertIndex: number
  ): Promise<ExpertCoding> {
    const startTime = Date.now();

    // Generiere personalisierten Prompt
    const promptTemplate = this.promptGenerator.generatePersonalizedPrompt(
      expert,
      segment.text,
      categories,
      options
    );

    const fullPrompt = this.promptGenerator.combinePromptTemplate(promptTemplate);

    // API-Aufruf
    const result = await APIService.callAPI(
      this.apiSettings.provider,
      this.apiSettings.model,
      this.apiSettings.apiKey,
      [{ role: 'user', content: fullPrompt }],
      800
    );

    if (!result.success) {
      throw new Error(`API call failed: ${result.error}`);
    }

    let codingResponse: CodingResponse;

    try {
      codingResponse = JSON.parse(result.content);
    } catch (error) {
      throw new Error(`Failed to parse coding response: ${result.content}`);
    }

    // Validiere Antwort
    this.validateCodingResponse(codingResponse, categories);

    const expertCoding: ExpertCoding = {
      ...codingResponse,
      expertId: expertIndex,
      expertName: expert.name,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime
    };

    return expertCoding;
  }

  /**
   * Bestimmt Konsens aus drei Kodierungen
   */
  private determineConsensus(
    codings: ExpertCoding[],
    categories: CodingCategory[]
  ): ConsensusResult {
    const categoryVotes: Record<string, number> = {};
    let totalConfidence = 0;

    // Zähle Stimmen und Konfidenz
    codings.forEach(coding => {
      categoryVotes[coding.category] = (categoryVotes[coding.category] || 0) + 1;
      totalConfidence += coding.confidence;
    });

    // Finde Mehrheitskategorie
    const voteEntries = Object.entries(categoryVotes);
    const maxVotes = Math.max(...voteEntries.map(([,votes]) => votes));
    const majorityCategories = voteEntries.filter(([,votes]) => votes === maxVotes);

    // Bei Gleichstand: Höchste Konfidenz entscheidet
    let consensusCategory = majorityCategories[0][0];
    if (majorityCategories.length > 1) {
      const categoryConfidences = majorityCategories.map(([category]) => {
        const relevantCodings = codings.filter(c => c.category === category);
        const avgConfidence = relevantCodings.reduce((sum, c) => sum + c.confidence, 0) / relevantCodings.length;
        return { category, avgConfidence };
      });

      consensusCategory = categoryConfidences.sort((a, b) => b.avgConfidence - a.avgConfidence)[0].category;
    }

    const agreement = maxVotes / codings.length;
    const isUnanimous = maxVotes === codings.length;
    const isMajority = maxVotes >= 2;

    let agreementType: 'unanimous' | 'majority' | 'split';
    if (isUnanimous) {
      agreementType = 'unanimous';
    } else if (isMajority) {
      agreementType = 'majority';
    } else {
      agreementType = 'split';
    }

    const conflictCategories = voteEntries
      .filter(([category]) => category !== consensusCategory)
      .map(([category]) => category);

    return {
      category: consensusCategory,
      agreement,
      agreementType,
      isMajority,
      isUnanimous,
      conflictCategories: conflictCategories.length > 0 ? conflictCategories : undefined,
      confidenceScore: totalConfidence / codings.length
    };
  }

  /**
   * Führt vollständige Analyse durch
   */
  async performFullAnalysis(
    documents: any[],
    segments: TextSegment[],
    categories: CodingCategory[],
    config: Partial<CodingSessionConfig> = {}
  ): Promise<CodingSession> {
    // 1. Initialisiere Experten
    await this.initializeExperts(documents, categories, this.apiSettings);

    // 2. Erstelle Session
    const session = this.createCodingSession(segments, categories, config);
    session.status = 'coding';

    const startTime = Date.now();
    let estimatedTotalTime = 0;

    // 3. Kodiere alle Segmente
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      try {
        const segmentStart = Date.now();
        const segmentCoding = await this.codeSegmentWithAllExperts(
          segment,
          categories,
          {
            strictMode: session.configuration.strictMode,
            allowUncertainty: session.configuration.allowUncertainty
          }
        );

        session.codings.push(segmentCoding);

        // Update Progress
        const segmentTime = Date.now() - segmentStart;
        estimatedTotalTime += segmentTime;

        session.progress.segmentsCoded = i + 1;
        session.progress.percentage = ((i + 1) / segments.length) * 100;

        if (i > 0) {
          const avgTimePerSegment = estimatedTotalTime / (i + 1);
          const remainingSegments = segments.length - (i + 1);
          session.progress.estimatedTimeRemaining = avgTimePerSegment * remainingSegments;
        }

        this.emit('progressUpdate', {
          sessionId: session.id,
          progress: session.progress
        });

        // Real-time Reliability Calculation
        if (session.configuration.realTimeReliability &&
            (i + 1) % session.configuration.batchSize === 0) {
          const interimReliability = await this.calculateReliabilityMetrics(session.codings, categories);
          session.reliabilityMetrics = interimReliability;

          this.emit('reliabilityUpdate', {
            sessionId: session.id,
            metrics: interimReliability,
            segmentsCoded: i + 1
          });
        }

      } catch (error) {
        console.error(`Failed to code segment ${segment.id}:`, error);
        this.emit('codingError', {
          segmentId: segment.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // 4. Finale Reliability-Berechnung
    session.status = 'analyzing';
    session.reliabilityMetrics = await this.calculateReliabilityMetrics(session.codings, categories);

    // 5. Finalisiere Session
    session.status = 'completed';
    session.endTime = new Date().toISOString();

    this.currentSession = session;
    this.emit('sessionCompleted', { session });

    return session;
  }

  /**
   * Berechnet Reliability Metriken
   */
  private async calculateReliabilityMetrics(
    codings: SegmentCoding[],
    categories: CodingCategory[]
  ): Promise<ReliabilityMetrics> {
    if (codings.length === 0) {
      throw new Error('No codings available for reliability calculation');
    }

    // Konvertiere zu CodingData Format
    const codingData: CodingData[] = codings.map(coding => ({
      segmentId: coding.segmentId,
      expert1: coding.codings[0]?.category || categories[0].name,
      expert2: coding.codings[1]?.category || categories[0].name,
      expert3: coding.codings[2]?.category || categories[0].name
    }));

    const categoryNames = categories.map(c => c.name);

    // Berechne Fleiss' Kappa
    const fleissKappa = this.irrCalculator.calculateFleissKappa(
      codingData,
      categoryNames,
      3
    );

    // Berechne Krippendorff's Alpha
    const krippendorffAlpha = this.irrCalculator.calculateKrippendorffAlpha(codingData);

    // Berechne zusätzliche Metriken
    const consensusRate = codings.filter(c => c.consensus.isMajority).length / codings.length;
    const unanimousRate = codings.filter(c => c.consensus.isUnanimous).length / codings.length;

    const totalConfidence = codings.reduce(
      (sum, coding) => sum + coding.consensus.confidenceScore, 0
    );
    const averageConfidence = totalConfidence / codings.length;

    // Kategorie-Verteilung
    const categoryDistribution: Record<string, number> = {};
    codings.forEach(coding => {
      const category = coding.consensus.category;
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });

    // Experten-Übereinstimmungsmatrix
    const expertAgreementMatrix = this.calculateExpertAgreementMatrix(codings);

    return {
      fleissKappa,
      krippendorffAlpha,
      consensusRate,
      unanimousRate,
      averageConfidence,
      categoryDistribution,
      expertAgreementMatrix
    };
  }

  /**
   * Berechnet Übereinstimmungsmatrix zwischen Experten
   */
  private calculateExpertAgreementMatrix(codings: SegmentCoding[]): number[][] {
    const matrix = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];

    codings.forEach(coding => {
      const categories = coding.codings.map(c => c.category);

      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (i !== j && categories[i] === categories[j]) {
            matrix[i][j]++;
          }
        }
      }
    });

    // Normalisiere zu Prozenten
    const total = codings.length;
    return matrix.map(row => row.map(val => val / total));
  }

  /**
   * Validiert Coding Response
   */
  private validateCodingResponse(
    response: CodingResponse,
    categories: CodingCategory[]
  ): void {
    // Check required fields
    if (!response.category) {
      throw new Error('Category is required in coding response');
    }

    if (typeof response.confidence !== 'number' ||
        response.confidence < 0 ||
        response.confidence > 1) {
      throw new Error('Confidence must be a number between 0 and 1');
    }

    // Check if category exists
    const categoryExists = categories.some(cat => cat.name === response.category);
    if (!categoryExists) {
      throw new Error(`Invalid category: ${response.category}`);
    }

    // Check rationale
    if (!response.rationale || response.rationale.trim().length === 0) {
      throw new Error('Rationale is required');
    }
  }

  /**
   * Event System
   */
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any) {
    const callbacks = this.eventListeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Event listener error for ${event}:`, error);
      }
    });
  }

  /**
   * Utility Methods
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getCurrentSession(): CodingSession | null {
    return this.currentSession || null;
  }

  getExperts(): ExpertPersona[] {
    return [...this.experts];
  }

  generateReliabilityReport(): string {
    if (!this.currentSession?.reliabilityMetrics) {
      throw new Error('No reliability metrics available');
    }

    const { reliabilityMetrics } = this.currentSession;

    return this.irrCalculator.generateStatisticalReport(
      reliabilityMetrics.fleissKappa,
      reliabilityMetrics.krippendorffAlpha
    );
  }

  /**
   * Export/Import Funktionalität
   */
  exportSession(): string {
    if (!this.currentSession) {
      throw new Error('No active session to export');
    }

    return JSON.stringify(this.currentSession, null, 2);
  }

  importSession(sessionData: string): CodingSession {
    const session = JSON.parse(sessionData) as CodingSession;

    // Validiere Session
    if (!session.id || !session.experts || !session.categories) {
      throw new Error('Invalid session data');
    }

    this.currentSession = session;
    this.experts = session.experts;

    return session;
  }
}

export default ThreeExpertCodingSystem;