/**
 * DynamicCodingPersonas - Metaprompt System für intelligente Coding-Unterstützung
 *
 * ZWECK:
 * - Generiert Dynamic Personas kalibriert auf spezifische Daten
 * - Real-time Consistency Checking während des Codings
 * - Live Suggestions basierend auf bisherigen Codings
 * - Pattern-based Learning aus vorherigen Entscheidungen
 * - Inter-Rater-Validation mit Confidence Scores
 *
 * ZIEL:
 * - 30% schnelleres Coding
 * - 40% konsistentere Ergebnisse
 * - Reduzierung von Coding-Fehlern um 50%
 *
 * @author AKIH System
 * @version 2.0.0
 */

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface CodingContext {
  categories: Array<{
    id: string;
    name: string;
    description: string;
    examples?: string[];
  }>;
  researchQuestions?: string[];
  theoreticalFramework?: string;
  previousCodings?: CodingResult[]; // For pattern learning
  codingGuidelines?: any; // From CategoriesCoherenceValidator
}

export interface TextSegment {
  id: string;
  text: string;
  documentId: string;
  documentName: string;
  position?: number; // Position in document
}

export interface PersonaProfile {
  id: string;
  name: string;
  description: string;
  codingStyle: string; // How this persona approaches coding
  strengths: string[]; // What this persona is good at
  calibrationNotes?: string; // Data-specific calibration
}

export interface CodingDecision {
  personaId: string;
  categoryId: string;
  categoryName: string;
  confidence: number; // 0-1: How confident is this persona?
  reasoning: string; // Why this category?
  evidenceQuotes: string[]; // Specific text evidence
  alternativeCategories?: Array<{
    categoryId: string;
    categoryName: string;
    confidence: number;
    reasoning: string;
  }>;
}

export interface ConsensusResult {
  primaryCategory: {
    categoryId: string;
    categoryName: string;
    confidence: number; // Weighted by persona agreement
  };
  personaAgreement: number; // 0-1: How much do personas agree?
  decisions: CodingDecision[]; // All persona decisions
  conflictAnalysis?: {
    hasConflict: boolean;
    conflictingCategories: string[];
    resolutionSuggestion: string;
  };
}

export interface CodingResult {
  segmentId: string;
  segmentText: string;
  consensus: ConsensusResult;
  timestamp: string;
  codingDuration?: number; // ms
}

export interface LiveSuggestion {
  type: 'pattern' | 'consistency' | 'similar_case' | 'boundary_warning';
  message: string;
  relevantCategories?: string[];
  confidence: number;
  basedOn: string; // What triggered this suggestion
}

export interface ConsistencyCheck {
  isConsistent: boolean;
  issues: Array<{
    type: 'contradiction' | 'pattern_deviation' | 'boundary_violation';
    description: string;
    affectedSegments: string[]; // IDs of related segments
    recommendation: string;
  }>;
}

export interface CodingOptions {
  language: 'de' | 'en';
  numberOfPersonas: number; // 3-7 recommended
  enableLiveSuggestions: boolean;
  enableConsistencyChecking: boolean;
  enablePatternLearning: boolean;
  onProgress?: (percent: number, message: string) => void;
}

// ============================================================================
// METAPROMPT TEMPLATES
// ============================================================================

export class DynamicCodingPersonas {

  /**
   * STAGE 1: PERSONA CALIBRATION SYSTEM PROMPT
   * Generiert data-specific Personas
   */
  static getPersonaCalibrationSystemPrompt(options: CodingOptions): string {
    const { language, numberOfPersonas } = options;

    return `# ROLE
You are an expert in qualitative coding methodology and persona-based analysis systems.

# TASK
Generate ${numberOfPersonas} dynamic coding personas calibrated to the specific research context and data characteristics.

# PERSONA GENERATION PRINCIPLES

1. **Data-Specific Calibration**
   - Analyze the research questions, theoretical framework, and category schema
   - Identify the types of interpretive stances needed for THIS specific data
   - Create personas that complement each other's strengths and weaknesses

2. **Diversity of Perspectives**
   - Include different interpretive lenses (strict vs. flexible, literal vs. contextual)
   - Represent different analytical focuses (micro vs. macro, explicit vs. implicit)
   - Balance between conservative and liberal coding approaches

3. **Practical Utility**
   - Each persona must have a clear, distinct coding philosophy
   - Personas should help researchers see blind spots
   - Focus on actionable differences in how text is interpreted

# RECOMMENDED PERSONA TYPES (Adapt to Context)

**Conservative Personas:**
- Strict Literalist: Only codes what is explicitly stated
- Evidence Purist: Requires strong, unambiguous evidence
- Boundary Guardian: Strict adherence to category definitions

**Balanced Personas:**
- Contextual Interpreter: Considers surrounding context
- Pragmatic Coder: Balances theoretical rigor with practical coding needs
- Pattern Recognizer: Looks for recurring themes and structures

**Liberal Personas:**
- Latent Meaning Explorer: Identifies implicit meanings
- Holistic Synthesizer: Considers broader narrative and connections
- Theoretical Lens Applier: Actively applies theoretical frameworks

# OUTPUT FORMAT

Provide response as valid JSON:

\`\`\`json
{
  "personas": [
    {
      "id": "persona_1",
      "name": "Descriptive name (e.g., 'Evidence Purist')",
      "description": "Clear description of this persona's identity",
      "codingStyle": "How this persona approaches text coding",
      "strengths": [
        "What this persona is particularly good at",
        "Another strength"
      ],
      "calibrationNotes": "Why this persona is valuable for THIS specific research context"
    }
  ]
}
\`\`\`

# LANGUAGE
${language === 'de' ? 'Provide all content in German.' : 'Provide all content in English.'}

# CRITICAL RULES
- Create exactly ${numberOfPersonas} personas
- Each persona must be meaningfully distinct
- Calibrate personas to the specific research context
- Ensure collective coverage of all interpretive angles`;
  }

  /**
   * STAGE 1: PERSONA CALIBRATION USER PROMPT
   */
  static getPersonaCalibrationUserPrompt(context: CodingContext): string {
    let prompt = `# RESEARCH CONTEXT\n\n`;

    if (context.researchQuestions && context.researchQuestions.length > 0) {
      prompt += `**Research Questions**:\n`;
      context.researchQuestions.forEach((q, i) => prompt += `${i + 1}. ${q}\n`);
      prompt += `\n`;
    }

    if (context.theoreticalFramework) {
      prompt += `**Theoretical Framework**: ${context.theoreticalFramework}\n\n`;
    }

    prompt += `**Category Schema** (${context.categories.length} categories):\n\n`;
    context.categories.forEach((cat, i) => {
      prompt += `${i + 1}. **${cat.name}**\n`;
      prompt += `   - Description: ${cat.description}\n`;
      if (cat.examples && cat.examples.length > 0) {
        prompt += `   - Examples: ${cat.examples.slice(0, 2).join('; ')}\n`;
      }
      prompt += `\n`;
    });

    if (context.previousCodings && context.previousCodings.length > 0) {
      prompt += `**Previous Codings**: ${context.previousCodings.length} segments already coded\n`;
      prompt += `(Personas should learn from patterns in previous codings)\n\n`;
    }

    prompt += `# TASK\n\n`;
    prompt += `Generate coding personas optimized for this specific research context.\n`;
    prompt += `Consider:\n`;
    prompt += `- What interpretive lenses are needed for these research questions?\n`;
    prompt += `- What types of evidence do these categories require?\n`;
    prompt += `- What coding challenges might arise with this schema?\n\n`;
    prompt += `Provide your response in the specified JSON format.\n\n`;
    prompt += `Begin persona generation:`;

    return prompt;
  }

  /**
   * STAGE 2: MULTI-PERSONA CODING SYSTEM PROMPT
   * Performs actual coding with generated personas
   */
  static getMultiPersonaCodingSystemPrompt(
    personas: PersonaProfile[],
    options: CodingOptions
  ): string {
    const { language, enableLiveSuggestions } = options;

    let prompt = `# ROLE
You are a multi-perspective qualitative coding system with ${personas.length} distinct personas.

# PERSONAS

`;

    personas.forEach((persona, i) => {
      prompt += `## Persona ${i + 1}: ${persona.name}\n\n`;
      prompt += `**Description**: ${persona.description}\n`;
      prompt += `**Coding Style**: ${persona.codingStyle}\n`;
      prompt += `**Strengths**: ${persona.strengths.join(', ')}\n`;
      if (persona.calibrationNotes) {
        prompt += `**Calibration**: ${persona.calibrationNotes}\n`;
      }
      prompt += `\n`;
    });

    prompt += `# TASK

For each text segment, ALL personas must independently analyze and code the text.

# CODING PROCESS (For Each Persona)

1. **Read & Understand**
   - Read the text segment through your persona's lens
   - Identify key themes, concepts, and meanings
   - Consider context and implications

2. **Category Selection**
   - Select the BEST matching category
   - Explain your reasoning clearly
   - Provide specific text evidence (quotes)
   - Rate your confidence (0-1)

3. **Alternative Considerations**
   - Identify up to 2 alternative categories if applicable
   - Explain why they were considered but not chosen
   - This helps reveal boundary cases and ambiguities

# OUTPUT FORMAT

**CRITICAL:** You MUST respond with the EXACT JSON structure shown below. Do NOT add extra fields, do NOT change field names, do NOT translate field names to other languages.

Provide response as valid JSON:

\`\`\`json
{
  "codingDecisions": [
    {
      "personaId": "persona_1",
      "categoryId": "cat_xyz",
      "categoryName": "Category Name",
      "confidence": 0.85,
      "reasoning": "Clear explanation of why this category fits",
      "evidenceQuotes": [
        "Specific text quote supporting this coding",
        "Another quote if relevant"
      ],
      "alternativeCategories": [
        {
          "categoryId": "cat_abc",
          "categoryName": "Alternative Category",
          "confidence": 0.45,
          "reasoning": "Why this was considered but not chosen"
        }
      ]
    }
  ],
  "consensusAnalysis": {
    "primaryCategory": {
      "categoryId": "cat_xyz",
      "categoryName": "Category Name",
      "confidence": 0.82
    },
    "personaAgreement": 0.85,
    "conflictAnalysis": {
      "hasConflict": false,
      "conflictingCategories": [],
      "resolutionSuggestion": "All personas agree on primary category"
    }
  }${enableLiveSuggestions ? `,
  "liveSuggestions": [
    {
      "type": "pattern",
      "message": "This segment is similar to previous codings as 'X'",
      "relevantCategories": ["cat_xyz"],
      "confidence": 0.75,
      "basedOn": "Pattern recognition from previous codings"
    }
  ]` : ''}
}
\`\`\`

# CONSENSUS CALCULATION

- **Primary Category**: The category with highest weighted confidence (considering persona agreement)
- **Persona Agreement**: 0-1 score measuring how aligned personas are
  - 1.0 = All personas chose the same category
  - 0.5 = Personas split between 2 categories
  - 0.0 = Complete disagreement
- **Conflict Analysis**: Identify when personas significantly disagree and suggest resolution

${enableLiveSuggestions ? `
# LIVE SUGGESTIONS

Provide helpful real-time suggestions based on:
- **Patterns**: Similar segments coded previously
- **Consistency**: Alignment with previous coding decisions
- **Similar Cases**: Segments with similar wording/themes
- **Boundary Warnings**: When segment is near category boundaries
` : ''}

# LANGUAGE
${language === 'de' ? 'Provide all content in German.' : 'Provide all content in English.'}

# CRITICAL RULES
- EVERY persona must make an independent decision
- Provide clear, specific evidence from the text
- Be honest about confidence levels
- Explain disagreements clearly when they occur
- Focus on reproducibility and transparency`;

    return prompt;
  }

  /**
   * STAGE 2: MULTI-PERSONA CODING USER PROMPT
   */
  static getMultiPersonaCodingUserPrompt(
    segment: TextSegment,
    context: CodingContext,
    previousCodings?: CodingResult[]
  ): string {
    let prompt = `# TEXT SEGMENT TO CODE\n\n`;
    prompt += `**Document**: ${segment.documentName}\n`;
    prompt += `**Segment ID**: ${segment.id}\n\n`;
    // ⚠️ IMPORTANT: Truncate text to prevent API overflow (max 16MB total)
    const MAX_SEGMENT_LENGTH = 5000; // Max 5000 chars per segment
    const truncatedText = segment.text.length > MAX_SEGMENT_LENGTH
      ? segment.text.substring(0, MAX_SEGMENT_LENGTH) + '... [TRUNCATED for API size limit]'
      : segment.text;

    prompt += `**Text** (${segment.text.length} chars, showing ${truncatedText.length}):\n"${truncatedText}"\n\n`;

    prompt += `# AVAILABLE CATEGORIES\n\n`;
    context.categories.forEach((cat, i) => {
      prompt += `${i + 1}. **${cat.name}** (ID: ${cat.id})\n`;
      const MAX_CAT_DESC = 200;
      const truncatedDesc = cat.description.length > MAX_CAT_DESC
        ? cat.description.substring(0, MAX_CAT_DESC) + '...'
        : cat.description;
      prompt += `   - ${truncatedDesc}\n`;
      if (cat.examples && cat.examples.length > 0) {
        // Limit to first 2 examples, max 100 chars each
        const limitedExamples = cat.examples.slice(0, 2).map(ex =>
          ex.length > 100 ? ex.substring(0, 100) + '...' : ex
        );
        prompt += `   - Examples: ${limitedExamples.join('; ')}\n`;
      }
      prompt += `\n`;
    });

    if (previousCodings && previousCodings.length > 0) {
      prompt += `# CONTEXT FROM PREVIOUS CODINGS\n\n`;
      prompt += `${previousCodings.length} segments have been coded. Look for patterns and maintain consistency.\n\n`;

      // Show last 3 codings for context
      const recentCodings = previousCodings.slice(-3);
      prompt += `**Recent Codings**:\n`;
      recentCodings.forEach((coding, i) => {
        prompt += `${i + 1}. "${coding.segmentText.substring(0, 100)}..." → ${coding.consensus.primaryCategory.categoryName}\n`;
      });
      prompt += `\n`;
    }

    prompt += `# TASK\n\n`;
    prompt += `Each persona should independently analyze and code this text segment.\n`;
    prompt += `Provide decisions, consensus analysis, and live suggestions (if applicable).\n\n`;
    prompt += `Begin coding:`;

    return prompt;
  }

  /**
   * MAIN CODING FUNCTION
   * Orchestrates persona generation + multi-persona coding
   */
  static async performDynamicCoding(
    segment: TextSegment,
    context: CodingContext,
    options: CodingOptions,
    apiFunction: (systemPrompt: string, userPrompt: string, options: any) => Promise<string>,
    cachedPersonas?: PersonaProfile[] // Reuse personas across segments
  ): Promise<{
    result: CodingResult;
    personas: PersonaProfile[];
    liveSuggestions?: LiveSuggestion[];
  }> {
    const { onProgress } = options;
    const startTime = Date.now();

    try {
      let personas: PersonaProfile[];

      // ========================================================================
      // STAGE 1: PERSONA CALIBRATION (Only if not cached)
      // ========================================================================
      if (!cachedPersonas) {
        onProgress?.(10, 'Calibrating coding personas...');

        const calibrationSystemPrompt = this.getPersonaCalibrationSystemPrompt(options);
        const calibrationUserPrompt = this.getPersonaCalibrationUserPrompt(context);

        const calibrationResponse = await apiFunction(
          calibrationSystemPrompt,
          calibrationUserPrompt,
          { temperature: 0.4, max_tokens: 2000 }
        );

        let calibrationData;
        try {
          calibrationData = JSON.parse(this.extractJSON(calibrationResponse));
        } catch (e) {
          throw new Error(`Failed to parse persona calibration: ${e.message}`);
        }

        personas = calibrationData.personas;
      } else {
        personas = cachedPersonas;
        onProgress?.(10, 'Using cached personas...');
      }

      // ========================================================================
      // STAGE 2: MULTI-PERSONA CODING
      // ========================================================================
      onProgress?.(40, 'Coding with multiple personas...');

      const codingSystemPrompt = this.getMultiPersonaCodingSystemPrompt(personas, options);
      const codingUserPrompt = this.getMultiPersonaCodingUserPrompt(
        segment,
        context,
        context.previousCodings
      );

      const codingResponse = await apiFunction(
        codingSystemPrompt,
        codingUserPrompt,
        { temperature: 0.3, max_tokens: 3000 }
      );

      onProgress?.(80, 'Processing coding results...');

      let codingData;
      try {
        codingData = JSON.parse(this.extractJSON(codingResponse));
      } catch (e) {
        throw new Error(`Failed to parse coding response: ${e.message}`);
      }

      const codingDuration = Date.now() - startTime;

      // 🔧 ROBUST: Handle both English and German responses, and missing fields
      const consensusAnalysis = codingData.consensusAnalysis ||
                                codingData.konsensAnalyse ||
                                codingData.consensus ||
                                {};

      // Extract primary category with fallbacks
      const primaryCategory = consensusAnalysis.primaryCategory ||
                             consensusAnalysis.hauptkategorie ||
                             (codingData.codingDecisions && codingData.codingDecisions.length > 0
                               ? {
                                   categoryId: codingData.codingDecisions[0].categoryId || 'unknown',
                                   categoryName: codingData.codingDecisions[0].categoryName || 'No Category',
                                   confidence: codingData.codingDecisions[0].confidence || 0.5
                                 }
                               : { categoryId: 'unknown', categoryName: 'No Category', confidence: 0.0 });

      const result: CodingResult = {
        segmentId: segment.id,
        segmentText: segment.text,
        consensus: {
          primaryCategory: primaryCategory,
          personaAgreement: consensusAnalysis.personaAgreement ||
                           consensusAnalysis.personaÜbereinstimmung ||
                           0.5,
          decisions: codingData.codingDecisions || [],
          conflictAnalysis: consensusAnalysis.conflictAnalysis ||
                           consensusAnalysis.konfliktAnalyse ||
                           {
                             hasConflict: false,
                             conflictingCategories: [],
                             resolutionSuggestion: 'Auto-generated consensus'
                           }
        },
        timestamp: new Date().toISOString(),
        codingDuration
      };

      onProgress?.(100, 'Complete!');

      return {
        result,
        personas,
        liveSuggestions: codingData.liveSuggestions || []
      };

    } catch (error) {
      console.error('[DynamicCodingPersonas] Error:', error);
      throw error;
    }
  }

  /**
   * CONSISTENCY CHECKING
   * Validates coding consistency across segments
   */
  static async checkConsistency(
    newCoding: CodingResult,
    previousCodings: CodingResult[],
    context: CodingContext,
    options: CodingOptions,
    apiFunction: (systemPrompt: string, userPrompt: string, options: any) => Promise<string>
  ): Promise<ConsistencyCheck> {
    const { language } = options;

    const systemPrompt = `# ROLE
You are a qualitative coding consistency validator.

# TASK
Analyze whether a new coding decision is consistent with previous coding patterns.

# CONSISTENCY CRITERIA

1. **Pattern Consistency**: Does this coding follow established patterns?
2. **Boundary Consistency**: Are similar segments coded similarly?
3. **Rule Adherence**: Does this follow coding guidelines?

# OUTPUT FORMAT

\`\`\`json
{
  "isConsistent": true,
  "issues": []
}
\`\`\`

If inconsistencies found:

\`\`\`json
{
  "isConsistent": false,
  "issues": [
    {
      "type": "pattern_deviation",
      "description": "Detailed description of inconsistency",
      "affectedSegments": ["seg_123", "seg_456"],
      "recommendation": "How to resolve this inconsistency"
    }
  ]
}
\`\`\`

# LANGUAGE
${language === 'de' ? 'Provide all content in German.' : 'Provide all content in English.'}`;

    let userPrompt = `# NEW CODING\n\n`;
    userPrompt += `**Text**: "${newCoding.segmentText}"\n`;
    userPrompt += `**Coded As**: ${newCoding.consensus.primaryCategory.categoryName}\n`;
    userPrompt += `**Confidence**: ${newCoding.consensus.primaryCategory.confidence.toFixed(2)}\n\n`;

    userPrompt += `# PREVIOUS CODINGS (Last 5)\n\n`;
    previousCodings.slice(-5).forEach((coding, i) => {
      userPrompt += `${i + 1}. "${coding.segmentText.substring(0, 80)}..." → ${coding.consensus.primaryCategory.categoryName}\n`;
    });

    userPrompt += `\n# TASK\nCheck if the new coding is consistent with previous patterns. Identify any issues.`;

    const response = await apiFunction(systemPrompt, userPrompt, { temperature: 0.2, max_tokens: 1000 });

    try {
      return JSON.parse(this.extractJSON(response));
    } catch (e) {
      return {
        isConsistent: true,
        issues: []
      };
    }
  }

  /**
   * UTILITY: Extract and clean JSON from response (robust version with bracket counting)
   */
  private static extractJSON(text: string): string {
    // Remove any leading junk (like "BS\n\n# ROLE..." prefixes)
    // This handles cases where Claude echoes the system prompt
    let cleaned = text;

    // If text starts with something that looks like a system prompt echo, skip to the actual JSON
    const roleMarkers = [
      '# ROLE',
      'You are an expert',
      'Du bist ein Experte',
      'EVIDENRA PROFESSIONAL'
    ];

    for (const marker of roleMarkers) {
      const markerIndex = cleaned.indexOf(marker);
      if (markerIndex !== -1 && markerIndex < 200) {
        // Found a role marker near the beginning - likely an echoed prompt
        // Look for the first JSON-like structure after this
        const afterMarker = cleaned.substring(markerIndex);
        const jsonStart = afterMarker.search(/[\{\[]/);
        if (jsonStart !== -1) {
          cleaned = afterMarker.substring(jsonStart);
          break;
        }
      }
    }

    // Remove code fences if present
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Find first { or [
    const startIndex = Math.min(
      cleaned.indexOf('{') >= 0 ? cleaned.indexOf('{') : Infinity,
      cleaned.indexOf('[') >= 0 ? cleaned.indexOf('[') : Infinity
    );

    if (!isFinite(startIndex)) {
      console.warn('No JSON found in response, returning original text');
      return text;
    }

    const startChar = cleaned[startIndex];
    const endChar = startChar === '{' ? '}' : ']';

    // Use bracket counting to find the matching closing bracket
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let endIndex = -1;

    for (let i = startIndex; i < cleaned.length; i++) {
      const char = cleaned[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === startChar || char === '{' || char === '[') {
          depth++;
        } else if (char === endChar || char === '}' || char === ']') {
          depth--;
          if (depth === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
    }

    if (endIndex === -1) {
      console.warn('Could not find matching closing bracket, using greedy match');
      const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!jsonMatch) return text;
      return jsonMatch[0];
    }

    let jsonStr = cleaned.substring(startIndex, endIndex);

    // Fix common JSON issues
    // 1. Remove trailing commas before } or ]
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

    // 2. Fix missing commas between array elements (heuristic)
    jsonStr = jsonStr.replace(/\}(\s*)\{/g, '},$1{');  // }{ → },{
    jsonStr = jsonStr.replace(/\](\s*)\[/g, '],$1[');  // ][ → ],[

    // Log cleaned JSON for debugging
    if (jsonStr.length > 500) {
      console.log('Cleaned JSON (first 500 chars):', jsonStr.substring(0, 500));
    } else {
      console.log('Cleaned JSON:', jsonStr);
    }

    return jsonStr;
  }
}
