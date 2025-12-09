/**
 * PatternInterpretationEngine - Metaprompt System für Pattern-Interpretation
 *
 * ZWECK:
 * - Interpretiert Patterns theoretisch fundiert
 * - Verlinkt zu existierender Literatur
 * - Identifiziert novel Insights
 * - Generiert Implications & Follow-up Questions
 * - Verwandelt raw statistics in publishable research contributions
 *
 * ZIEL:
 * - +300% mehr Insights aus Patterns
 * - Pattern Analysis wird zu Section 5+ im Article
 * - Theoretisch fundierte Interpretation statt nur Deskription
 *
 * @author AKIH System
 * @version 2.0.0
 */

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface Pattern {
  id: string;
  type: 'co-occurrence' | 'theme-cluster' | 'trend' | 'outlier' | 'relationship';
  description: string;
  categories: string[]; // Category IDs involved
  frequency?: number;
  strength?: number; // 0-1: How strong is this pattern?
  examples?: string[]; // Example text segments
}

export interface TheoreticalInterpretation {
  patternId: string;
  theoreticalFrameworks: Array<{
    framework: string;
    relevance: string; // Why this framework applies
    interpretation: string; // What the pattern means through this lens
    literatureReferences: string[]; // Key papers/concepts
  }>;
  novelInsights: string[]; // What's NEW/SURPRISING about this pattern
  contributionToField: string; // How this advances knowledge
  limitationsAndCaveats: string[];
}

export interface ImplicationsAnalysis {
  patternId: string;
  theoreticalImplications: string[];
  practicalImplications: string[];
  methodologicalImplications: string[];
  futureResearchDirections: string[];
  followUpQuestions: string[]; // New research questions this pattern raises
}

export interface LiteratureConnection {
  patternId: string;
  existingLiterature: Array<{
    finding: string; // What existing research found
    similarity: 'confirms' | 'extends' | 'contradicts' | 'novel';
    explanation: string; // How this pattern relates
  }>;
  researchGaps: string[]; // Gaps this pattern helps fill
}

export interface InterpretedPattern {
  pattern: Pattern;
  theoreticalInterpretation: TheoreticalInterpretation;
  implications: ImplicationsAnalysis;
  literatureConnection: LiteratureConnection;
  narrativeSummary: string; // Publication-ready paragraph
  visualizationSuggestions?: string[]; // How to visualize this pattern
}

export interface InterpretationOptions {
  language: 'de' | 'en';
  researchField: string;
  researchQuestions: string[];
  theoreticalFramework?: string;
  academicLevel: 'bachelor' | 'master' | 'phd';
  focusOnNovelty: boolean; // Emphasize novel contributions?
  includeVisualizationSuggestions: boolean;
  onProgress?: (percent: number, message: string) => void;
}

// ============================================================================
// METAPROMPT TEMPLATES
// ============================================================================

export class PatternInterpretationEngine {

  /**
   * MAIN INTERPRETATION SYSTEM PROMPT
   * Interpretiert Patterns theoretisch fundiert
   */
  static getInterpretationSystemPrompt(options: InterpretationOptions): string {
    const { language, researchField, academicLevel, focusOnNovelty } = options;

    return `# ROLE
You are an expert research analyst specializing in ${researchField} with deep knowledge of qualitative research methods, theoretical frameworks, and academic literature at the ${academicLevel} level.

# TASK
Transform raw data patterns into theoretically grounded, academically rigorous interpretations suitable for publication in peer-reviewed journals.

# INTERPRETATION FRAMEWORK

## 1. THEORETICAL GROUNDING

For each pattern, identify relevant theoretical frameworks and interpret the pattern through those lenses:

- **Framework Selection**: Choose 2-3 established theoretical frameworks most relevant to the pattern
- **Application**: Explain what the pattern means when viewed through each framework
- **Synthesis**: Show how different frameworks offer complementary insights

## 2. LITERATURE INTEGRATION

Connect patterns to existing research:

- **Confirming**: Does this pattern confirm existing findings?
- **Extending**: Does it extend current knowledge in new directions?
- **Contradicting**: Does it challenge established views?
- **Novel**: Does it reveal something entirely new?

For each connection, cite general research areas (specific citations should be added by researcher).

## 3. NOVEL INSIGHTS IDENTIFICATION

${focusOnNovelty ? `
**CRITICAL FOCUS**: Identify what is NEW and SURPRISING about each pattern.

Ask:
- What unexpected relationships emerged?
- What challenges conventional wisdom?
- What gaps in literature does this address?
- What new theoretical possibilities does this open?
` : `
Identify novel contributions while balancing with existing knowledge.
`}

## 4. IMPLICATIONS ANALYSIS

Generate implications across multiple dimensions:

- **Theoretical**: How does this advance theory?
- **Practical**: What real-world applications exist?
- **Methodological**: What does this suggest about research methods?
- **Future Research**: What new questions does this raise?

## 5. NARRATIVE SYNTHESIS

Create publication-ready narratives:

- Clear, accessible language for academic audiences
- Logical flow from observation → interpretation → implications
- Balance between description and analysis
- Suitable for Results/Discussion sections

# OUTPUT FORMAT

Provide response as valid JSON:

\`\`\`json
{
  "interpretedPattern": {
    "patternId": "pattern_1",
    "theoreticalInterpretation": {
      "patternId": "pattern_1",
      "theoreticalFrameworks": [
        {
          "framework": "Framework Name (e.g., Social Learning Theory)",
          "relevance": "Why this framework is relevant to this pattern",
          "interpretation": "What the pattern means through this theoretical lens",
          "literatureReferences": [
            "Key concept or research area to explore",
            "Another relevant area"
          ]
        }
      ],
      "novelInsights": [
        "First novel insight this pattern reveals",
        "Second novel insight"
      ],
      "contributionToField": "Clear statement of how this advances knowledge in ${researchField}",
      "limitationsAndCaveats": [
        "Important limitation to acknowledge",
        "Caveat in interpretation"
      ]
    },
    "implications": {
      "patternId": "pattern_1",
      "theoreticalImplications": [
        "Theoretical implication 1",
        "Theoretical implication 2"
      ],
      "practicalImplications": [
        "Practical implication 1",
        "Practical implication 2"
      ],
      "methodologicalImplications": [
        "Methodological insight 1"
      ],
      "futureResearchDirections": [
        "Research direction 1",
        "Research direction 2"
      ],
      "followUpQuestions": [
        "New research question 1",
        "New research question 2"
      ]
    },
    "literatureConnection": {
      "patternId": "pattern_1",
      "existingLiterature": [
        {
          "finding": "Summary of existing research finding",
          "similarity": "confirms",
          "explanation": "How this pattern relates to that finding"
        }
      ],
      "researchGaps": [
        "Gap in literature this pattern addresses"
      ]
    },
    "narrativeSummary": "A well-written, publication-ready paragraph (150-250 words) that synthesizes the pattern, its theoretical interpretation, and implications. This should read like a section from a high-quality research article.",
    "visualizationSuggestions": [
      "Suggestion for how to visualize this pattern (e.g., network diagram, thematic map)"
    ]
  }
}
\`\`\`

# LANGUAGE
${language === 'de' ? 'Provide all content in German, using academic German terminology.' : 'Provide all content in English, using academic English.'}

# CRITICAL RULES
- Ground ALL interpretations in established theory
- Be specific about contributions to ${researchField}
- Identify genuine novelty (don't overstate)
- Acknowledge limitations honestly
- Write at ${academicLevel}-appropriate level
- Make narrative summaries publication-ready
- Focus on "so what?" - why does this pattern matter?`;
  }

  /**
   * INTERPRETATION USER PROMPT
   */
  static getInterpretationUserPrompt(
    pattern: Pattern,
    context: {
      researchQuestions: string[];
      theoreticalFramework?: string;
      allPatterns?: Pattern[]; // For context
    }
  ): string {
    let prompt = `# RESEARCH CONTEXT\n\n`;

    prompt += `**Research Questions**:\n`;
    context.researchQuestions.forEach((q, i) => {
      prompt += `${i + 1}. ${q}\n`;
    });
    prompt += `\n`;

    if (context.theoreticalFramework) {
      prompt += `**Stated Theoretical Framework**: ${context.theoreticalFramework}\n\n`;
    }

    prompt += `# PATTERN TO INTERPRET\n\n`;
    prompt += `**Type**: ${pattern.type}\n`;
    prompt += `**Description**: ${pattern.description}\n`;

    if (pattern.categories && pattern.categories.length > 0) {
      prompt += `**Categories Involved**: ${pattern.categories.join(', ')}\n`;
    }

    if (pattern.frequency !== undefined) {
      prompt += `**Frequency**: ${pattern.frequency}\n`;
    }

    if (pattern.strength !== undefined) {
      prompt += `**Strength**: ${(pattern.strength * 100).toFixed(0)}%\n`;
    }

    if (pattern.examples && pattern.examples.length > 0) {
      prompt += `\n**Example Segments**:\n`;
      pattern.examples.slice(0, 3).forEach((ex, i) => {
        prompt += `${i + 1}. "${ex}"\n`;
      });
    }

    if (context.allPatterns && context.allPatterns.length > 1) {
      prompt += `\n**Context**: This is one of ${context.allPatterns.length} patterns identified. Consider how it relates to the broader pattern landscape.\n`;
    }

    prompt += `\n# TASK\n\n`;
    prompt += `Provide a theoretically grounded interpretation of this pattern.\n`;
    prompt += `Include:\n`;
    prompt += `1. Theoretical frameworks and interpretations\n`;
    prompt += `2. Novel insights and contributions\n`;
    prompt += `3. Implications (theoretical, practical, methodological, future research)\n`;
    prompt += `4. Connections to existing literature\n`;
    prompt += `5. Publication-ready narrative summary\n\n`;
    prompt += `Focus on helping the researcher understand WHY this pattern matters and HOW it advances knowledge.\n\n`;
    prompt += `Provide your response in the specified JSON format.\n\n`;
    prompt += `Begin interpretation:`;

    return prompt;
  }

  /**
   * MAIN INTERPRETATION FUNCTION
   */
  static async interpretPattern(
    pattern: Pattern,
    context: {
      researchQuestions: string[];
      theoreticalFramework?: string;
      allPatterns?: Pattern[];
    },
    options: InterpretationOptions,
    apiFunction: (systemPrompt: string, userPrompt: string, options: any) => Promise<string>
  ): Promise<InterpretedPattern> {
    const { onProgress } = options;

    try {
      onProgress?.(10, 'Interpreting pattern theoretically...');

      const systemPrompt = this.getInterpretationSystemPrompt(options);
      const userPrompt = this.getInterpretationUserPrompt(pattern, context);

      const response = await apiFunction(
        systemPrompt,
        userPrompt,
        { temperature: 0.5, max_tokens: 4000 }
      );

      onProgress?.(80, 'Processing interpretation...');

      let data;
      try {
        data = JSON.parse(this.extractJSON(response));
      } catch (e) {
        throw new Error(`Failed to parse interpretation: ${e.message}`);
      }

      onProgress?.(100, 'Complete!');

      return {
        pattern,
        ...data.interpretedPattern
      };

    } catch (error) {
      console.error('[PatternInterpretationEngine] Error:', error);
      throw error;
    }
  }

  /**
   * BATCH INTERPRETATION
   * Interprets multiple patterns with cross-pattern analysis
   */
  static async interpretPatterns(
    patterns: Pattern[],
    context: {
      researchQuestions: string[];
      theoreticalFramework?: string;
    },
    options: InterpretationOptions,
    apiFunction: (systemPrompt: string, userPrompt: string, options: any) => Promise<string>
  ): Promise<{
    interpretedPatterns: InterpretedPattern[];
    crossPatternSynthesis: string; // Overall synthesis across all patterns
  }> {
    const { onProgress } = options;

    const interpretedPatterns: InterpretedPattern[] = [];

    // Interpret each pattern
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      onProgress?.(
        (i / patterns.length) * 80,
        `Interpreting pattern ${i + 1}/${patterns.length}...`
      );

      const interpreted = await this.interpretPattern(
        pattern,
        { ...context, allPatterns: patterns },
        options,
        apiFunction
      );

      interpretedPatterns.push(interpreted);
    }

    // Generate cross-pattern synthesis
    onProgress?.(85, 'Synthesizing across patterns...');

    const synthesisPrompt = this.getCrossPatternSynthesisPrompt(
      interpretedPatterns,
      context,
      options
    );

    const synthesisResponse = await apiFunction(
      synthesisPrompt.system,
      synthesisPrompt.user,
      { temperature: 0.6, max_tokens: 2000 }
    );

    onProgress?.(100, 'Complete!');

    let synthesisData;
    try {
      synthesisData = JSON.parse(this.extractJSON(synthesisResponse));
    } catch (e) {
      synthesisData = { synthesis: synthesisResponse }; // Fallback to raw text
    }

    return {
      interpretedPatterns,
      crossPatternSynthesis: synthesisData.synthesis || synthesisData
    };
  }

  /**
   * CROSS-PATTERN SYNTHESIS PROMPT
   */
  private static getCrossPatternSynthesisPrompt(
    interpretedPatterns: InterpretedPattern[],
    context: { researchQuestions: string[]; theoreticalFramework?: string },
    options: InterpretationOptions
  ): { system: string; user: string } {
    const { language, researchField } = options;

    const system = `# ROLE
You are an expert research synthesizer specializing in ${researchField}.

# TASK
Create a cohesive narrative synthesis that integrates multiple interpreted patterns into a unified theoretical contribution.

# SYNTHESIS PRINCIPLES
- Show how patterns relate to and reinforce each other
- Identify overarching themes across patterns
- Build a coherent theoretical argument
- Highlight the collective contribution to ${researchField}

# OUTPUT FORMAT
Provide a publication-ready synthesis (300-500 words) suitable for a Discussion section.

# LANGUAGE
${language === 'de' ? 'Write in academic German.' : 'Write in academic English.'}`;

    let user = `# INTERPRETED PATTERNS\n\n`;

    interpretedPatterns.forEach((ip, i) => {
      user += `## Pattern ${i + 1}: ${ip.pattern.description}\n\n`;
      user += `**Theoretical Frameworks**: ${ip.theoreticalInterpretation.theoreticalFrameworks.map(f => f.framework).join(', ')}\n`;
      user += `**Novel Insights**: ${ip.theoreticalInterpretation.novelInsights.join('; ')}\n`;
      user += `**Contribution**: ${ip.theoreticalInterpretation.contributionToField}\n\n`;
    });

    user += `# RESEARCH QUESTIONS\n\n`;
    context.researchQuestions.forEach((q, i) => {
      user += `${i + 1}. ${q}\n`;
    });

    user += `\n# TASK\n\nCreate a cohesive synthesis showing how these patterns collectively answer the research questions and contribute to ${researchField}.\n\nBegin synthesis:`;

    return { system, user };
  }

  /**
   * UTILITY: Extract JSON from response
   */
  private static extractJSON(text: string): string {
    // Remove any leading junk (like "BS\n\n# ROLE..." prefixes)
    let cleanedText = text;

    const roleMarkers = ['# ROLE', 'You are an expert', 'Du bist ein Experte', 'EVIDENRA PROFESSIONAL'];
    for (const marker of roleMarkers) {
      const markerIndex = cleanedText.indexOf(marker);
      if (markerIndex !== -1 && markerIndex < 200) {
        const afterMarker = cleanedText.substring(markerIndex);
        const jsonStart = afterMarker.search(/\{/);
        if (jsonStart !== -1) {
          cleanedText = afterMarker.substring(jsonStart);
          break;
        }
      }
    }

    const jsonBlockMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      return jsonBlockMatch[1].trim();
    }

    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    const originalJsonMatch = text.match(/\{[\s\S]*\}/);
    if (originalJsonMatch) {
      return originalJsonMatch[0];
    }

    return text;
  }
}
