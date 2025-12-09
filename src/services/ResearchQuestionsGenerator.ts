/**
 * ResearchQuestionsGenerator - Metaprompt System für Forschungsfragen
 *
 * ZWECK:
 * - Validiert Forschungsfragen gegen 8 Qualitätskriterien
 * - Generiert optimierte Versionen mit Sub-Fragen
 * - Mappt Dependencies zwischen Fragen
 * - Bewertet Answerability vs. Dataset
 * - Schlägt Verbesserungen vor
 *
 * ARCHITEKTUR:
 * - 2-Stufen-Metaprompt-System
 * - Stage 1: Validierung & Analyse
 * - Stage 2: Optimierung & Sub-Fragen-Generierung
 *
 * @author AKIH System
 * @version 2.0.0
 */

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface ResearchQuestion {
  id: string;
  question: string;
  type: 'descriptive' | 'exploratory' | 'explanatory' | 'evaluative' | 'comparative';
  rationale?: string;
  timestamp?: number;
  aiGenerated?: boolean;
}

export interface QuestionValidationCriteria {
  clarity: number;              // 0-1: Is the question clear and unambiguous?
  specificity: number;          // 0-1: Is the question specific enough?
  answerability: number;        // 0-1: Can this be answered with data?
  relevance: number;            // 0-1: Is this relevant to research goals?
  feasibility: number;          // 0-1: Is this feasible with available resources?
  novelty: number;              // 0-1: Does this contribute new knowledge?
  theoreticalGrounding: number; // 0-1: Is this grounded in theory?
  operationalizability: number; // 0-1: Can this be operationalized?
}

export interface OptimizedQuestion extends ResearchQuestion {
  original: string;
  optimizationReasoning: string;
  improvements: string[];
  subQuestions: SubQuestion[];
  dependencies: string[]; // IDs of questions this depends on
}

export interface SubQuestion {
  id: string;
  question: string;
  purpose: string; // Why this sub-question helps answer the main question
  sequence: number; // Order in which to address (1-n)
}

export interface ValidationReport {
  questionId: string;
  originalQuestion: string;
  criteria: QuestionValidationCriteria;
  overallScore: number; // 0-1 average of all criteria
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  answerabilityAssessment: {
    canBeAnswered: boolean;
    dataRequirements: string[];
    methodologySuggestions: string[];
    potentialChallenges: string[];
  };
}

export interface OptimizationOptions {
  language: 'de' | 'en';
  academicLevel: 'bachelor' | 'master' | 'phd';
  researchField: string; // e.g., "Sozialwissenschaften", "Psychologie", etc.
  availableDataSummary?: string; // Summary of available documents/data
  theoreticalFramework?: string; // Theoretical foundation
  strictMode: boolean; // true = only accept questions with score >= 0.7
  onProgress?: (percent: number, message: string) => void;
}

// ============================================================================
// METAPROMPT TEMPLATES
// ============================================================================

export class ResearchQuestionsGenerator {

  /**
   * STAGE 1: VALIDATION SYSTEM PROMPT
   * Validiert Forschungsfragen nach 8 Kriterien
   */
  static getValidationSystemPrompt(options: OptimizationOptions): string {
    const { language, academicLevel } = options;

    return `# ROLE
You are an expert research methodologist and academic supervisor specializing in ${options.researchField}.
Your expertise includes research question formulation, study design, and methodology assessment at the ${academicLevel} level.

# TASK
Analyze research questions using 8 established quality criteria and provide detailed validation reports.

# 8 QUALITY CRITERIA (Score each 0-1)

1. **Clarity** (0-1)
   - Is the question clear and unambiguous?
   - Can a reader understand exactly what is being asked?
   - Are all key terms well-defined?

2. **Specificity** (0-1)
   - Is the question specific enough to be answerable?
   - Are boundaries and scope clearly defined?
   - Does it avoid being too broad or vague?

3. **Answerability** (0-1)
   - Can this question be answered with empirical data?
   - Are the variables measurable or observable?
   - Is the question empirically tractable?

4. **Relevance** (0-1)
   - Does this contribute to the research field?
   - Is it aligned with current academic discourse?
   - Does it address a meaningful gap?

5. **Feasibility** (0-1)
   - Can this be answered with available resources?
   - Is the scope realistic for ${academicLevel}-level research?
   - Are data sources accessible?

6. **Novelty** (0-1)
   - Does this contribute new knowledge?
   - Does it go beyond replication?
   - Is there an original angle or perspective?

7. **Theoretical Grounding** (0-1)
   - Is the question grounded in existing theory?
   - Does it build on established frameworks?
   - Is there a clear theoretical foundation?

8. **Operationalizability** (0-1)
   - Can concepts be operationalized into measurable variables?
   - Are indicators clearly identifiable?
   - Can this be translated into concrete analysis steps?

# ANSWERABILITY ASSESSMENT
For each question, assess:
- **Can it be answered?** (Yes/No with reasoning)
- **Data requirements**: What data is needed?
- **Methodology suggestions**: Which methods would work?
- **Potential challenges**: What obstacles might arise?

# OUTPUT FORMAT
Provide response as valid JSON:

\`\`\`json
{
  "validationReports": [
    {
      "questionId": "q1",
      "originalQuestion": "...",
      "criteria": {
        "clarity": 0.85,
        "specificity": 0.70,
        "answerability": 0.90,
        "relevance": 0.80,
        "feasibility": 0.75,
        "novelty": 0.65,
        "theoreticalGrounding": 0.80,
        "operationalizability": 0.85
      },
      "overallScore": 0.79,
      "strengths": [
        "Clear operationalization of variables",
        "Well-grounded in theory"
      ],
      "weaknesses": [
        "Could be more specific about population",
        "Novelty could be stronger"
      ],
      "recommendations": [
        "Narrow the population to a specific demographic",
        "Specify the time period for the study",
        "Add a comparative dimension to increase novelty"
      ],
      "answerabilityAssessment": {
        "canBeAnswered": true,
        "dataRequirements": [
          "Interview transcripts from target population",
          "Survey data on key variables"
        ],
        "methodologySuggestions": [
          "Qualitative content analysis",
          "Mixed-methods approach with interviews + surveys"
        ],
        "potentialChallenges": [
          "Access to target population may be difficult",
          "Time constraints for longitudinal data"
        ]
      }
    }
  ]
}
\`\`\`

# LANGUAGE
${language === 'de' ? 'Provide all feedback in German.' : 'Provide all feedback in English.'}

# CRITICAL RULES
- Be honest and constructive in your assessment
- Score rigorously but fairly
- Provide actionable recommendations
- Consider the ${academicLevel} level when assessing feasibility
- Focus on academic research standards`;
  }

  /**
   * STAGE 1: VALIDATION USER PROMPT
   */
  static getValidationUserPrompt(
    questions: ResearchQuestion[],
    options: OptimizationOptions
  ): string {
    const { researchField, availableDataSummary, theoreticalFramework } = options;

    let prompt = `# RESEARCH CONTEXT

**Research Field**: ${researchField}
**Academic Level**: ${options.academicLevel}
`;

    if (theoreticalFramework) {
      prompt += `**Theoretical Framework**: ${theoreticalFramework}\n`;
    }

    if (availableDataSummary) {
      prompt += `**Available Data**: ${availableDataSummary}\n`;
    }

    prompt += `\n# RESEARCH QUESTIONS TO VALIDATE\n\n`;

    questions.forEach((q, idx) => {
      prompt += `**Question ${idx + 1}** (ID: ${q.id})\n`;
      prompt += `- Type: ${q.type}\n`;
      prompt += `- Question: "${q.question}"\n`;
      if (q.rationale) {
        prompt += `- Rationale: ${q.rationale}\n`;
      }
      prompt += `\n`;
    });

    prompt += `\n# TASK
Validate each research question using the 8 quality criteria.
Provide detailed validation reports in JSON format as specified.

Focus on:
1. Rigorous scoring (0-1) for each criterion
2. Specific strengths and weaknesses
3. Actionable recommendations for improvement
4. Realistic answerability assessment given the available data

Begin your analysis:`;

    return prompt;
  }

  /**
   * STAGE 2: OPTIMIZATION SYSTEM PROMPT
   * Generiert optimierte Versionen mit Sub-Fragen
   */
  static getOptimizationSystemPrompt(options: OptimizationOptions): string {
    const { language, academicLevel, researchField } = options;

    return `# ROLE
You are an expert research question architect specializing in ${researchField} at the ${academicLevel} level.

# TASK
Based on validation reports, generate optimized versions of research questions with:
- Improved clarity, specificity, and answerability
- Strategic sub-questions for systematic investigation
- Clear dependencies between questions
- Actionable improvements

# OPTIMIZATION PRINCIPLES

1. **Enhance Clarity**
   - Use precise terminology
   - Eliminate ambiguity
   - Define boundaries clearly

2. **Increase Specificity**
   - Narrow scope appropriately
   - Specify population, time, context
   - Define key variables explicitly

3. **Improve Answerability**
   - Ensure empirical tractability
   - Operationalize abstract concepts
   - Align with available data/methods

4. **Strengthen Theoretical Grounding**
   - Reference established frameworks
   - Build on existing literature
   - Show theoretical contribution

5. **Generate Strategic Sub-Questions**
   - Break down complex questions into manageable parts
   - Create logical sequence (foundational → advanced)
   - Ensure each sub-question serves the main question
   - Typically 2-4 sub-questions per main question

6. **Map Dependencies**
   - Identify which questions must be answered first
   - Show how questions build on each other
   - Create logical investigation pathway

# SUB-QUESTION STRATEGY

For each main research question, create sub-questions that:
- **Sequence 1**: Establish foundational concepts/definitions
- **Sequence 2**: Explore relationships/patterns
- **Sequence 3**: Analyze mechanisms/causes
- **Sequence 4**: Evaluate implications/applications (if applicable)

# OUTPUT FORMAT

Provide valid JSON:

\`\`\`json
{
  "optimizedQuestions": [
    {
      "id": "q1",
      "original": "Original question text",
      "question": "Optimized question text",
      "type": "explanatory",
      "optimizationReasoning": "Detailed explanation of what was improved and why",
      "improvements": [
        "Added specific time period (2020-2024)",
        "Operationalized 'effectiveness' as measurable outcome",
        "Narrowed population to specific demographic"
      ],
      "subQuestions": [
        {
          "id": "q1-sub1",
          "question": "Sub-question text",
          "purpose": "Why this sub-question helps answer main question",
          "sequence": 1
        },
        {
          "id": "q1-sub2",
          "question": "...",
          "purpose": "...",
          "sequence": 2
        }
      ],
      "dependencies": ["q2"], // This question depends on Q2 being answered first
      "rationale": "Theoretical and methodological justification"
    }
  ],
  "dependencyMap": {
    "description": "Overall explanation of how questions build on each other",
    "sequence": ["q2", "q1", "q3"] // Recommended order to address questions
  }
}
\`\`\`

# LANGUAGE
${language === 'de' ? 'Provide all content in German.' : 'Provide all content in English.'}

# CRITICAL RULES
- ONLY improve questions that scored < 0.7 on any criterion
- Keep improvements minimal but impactful
- Ensure sub-questions are truly necessary (don't over-complicate)
- Make dependencies explicit and logical
- All text must be academically rigorous`;
  }

  /**
   * STAGE 2: OPTIMIZATION USER PROMPT
   */
  static getOptimizationUserPrompt(
    validationReports: ValidationReport[],
    options: OptimizationOptions
  ): string {
    let prompt = `# VALIDATION RESULTS\n\n`;

    validationReports.forEach((report, idx) => {
      prompt += `## Question ${idx + 1}: ${report.originalQuestion}\n\n`;
      prompt += `**Overall Score**: ${report.overallScore.toFixed(2)}/1.00\n\n`;

      prompt += `**Criteria Scores**:\n`;
      Object.entries(report.criteria).forEach(([criterion, score]) => {
        prompt += `- ${criterion}: ${score.toFixed(2)}\n`;
      });

      prompt += `\n**Strengths**:\n`;
      report.strengths.forEach(s => prompt += `- ${s}\n`);

      prompt += `\n**Weaknesses**:\n`;
      report.weaknesses.forEach(w => prompt += `- ${w}\n`);

      prompt += `\n**Recommendations**:\n`;
      report.recommendations.forEach(r => prompt += `- ${r}\n`);

      prompt += `\n**Answerability**:\n`;
      prompt += `- Can be answered: ${report.answerabilityAssessment.canBeAnswered ? 'Yes' : 'No'}\n`;
      prompt += `- Challenges: ${report.answerabilityAssessment.potentialChallenges.join(', ')}\n\n`;
      prompt += `---\n\n`;
    });

    prompt += `# TASK\n\n`;
    prompt += `Generate optimized versions of these research questions with:\n`;
    prompt += `1. Improved formulations addressing weaknesses\n`;
    prompt += `2. Strategic sub-questions (2-4 per main question)\n`;
    prompt += `3. Clear dependencies between questions\n`;
    prompt += `4. Detailed reasoning for each improvement\n\n`;

    prompt += `Focus particularly on questions with overall score < 0.70.\n\n`;
    prompt += `Provide your response in the specified JSON format.\n\n`;
    prompt += `Begin optimization:`;

    return prompt;
  }

  /**
   * MAIN GENERATION FUNCTION
   * Orchestrates validation + optimization
   */
  static async generateOptimizedQuestions(
    questions: ResearchQuestion[],
    options: OptimizationOptions,
    apiFunction: (systemPrompt: string, userPrompt: string, options: any) => Promise<string>
  ): Promise<{
    validationReports: ValidationReport[];
    optimizedQuestions: OptimizedQuestion[];
    dependencyMap: any;
  }> {
    const { onProgress } = options;

    try {
      // ========================================================================
      // STAGE 1: VALIDATION
      // ========================================================================
      onProgress?.(10, 'Validating research questions...');

      const validationSystemPrompt = this.getValidationSystemPrompt(options);
      const validationUserPrompt = this.getValidationUserPrompt(questions, options);

      const validationResponse = await apiFunction(
        validationSystemPrompt,
        validationUserPrompt,
        { temperature: 0.3, max_tokens: 4000 }
      );

      onProgress?.(40, 'Parsing validation results...');

      let validationData;
      try {
        validationData = JSON.parse(this.extractJSON(validationResponse));
      } catch (e) {
        throw new Error(`Failed to parse validation response: ${e.message}`);
      }

      const validationReports: ValidationReport[] = validationData.validationReports;

      // ========================================================================
      // STAGE 2: OPTIMIZATION
      // ========================================================================
      onProgress?.(50, 'Generating optimized questions...');

      const optimizationSystemPrompt = this.getOptimizationSystemPrompt(options);
      const optimizationUserPrompt = this.getOptimizationUserPrompt(validationReports, options);

      const optimizationResponse = await apiFunction(
        optimizationSystemPrompt,
        optimizationUserPrompt,
        { temperature: 0.5, max_tokens: 5000 }
      );

      onProgress?.(90, 'Parsing optimized questions...');

      let optimizationData;
      try {
        optimizationData = JSON.parse(this.extractJSON(optimizationResponse));
      } catch (e) {
        throw new Error(`Failed to parse optimization response: ${e.message}`);
      }

      onProgress?.(100, 'Complete!');

      return {
        validationReports,
        optimizedQuestions: optimizationData.optimizedQuestions,
        dependencyMap: optimizationData.dependencyMap
      };

    } catch (error) {
      console.error('[ResearchQuestionsGenerator] Error:', error);
      throw error;
    }
  }

  /**
   * UTILITY: Extract JSON from response (handles markdown code blocks and trailing text)
   */
  private static extractJSON(text: string): string {
    // Try to find JSON in markdown code blocks first
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      return jsonBlockMatch[1].trim();
    }

    // Find the first { or [
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');

    let jsonStart = -1;
    let startChar = '';

    if (firstBrace !== -1 && firstBracket !== -1) {
      if (firstBrace < firstBracket) {
        jsonStart = firstBrace;
        startChar = '{';
      } else {
        jsonStart = firstBracket;
        startChar = '[';
      }
    } else if (firstBrace !== -1) {
      jsonStart = firstBrace;
      startChar = '{';
    } else if (firstBracket !== -1) {
      jsonStart = firstBracket;
      startChar = '[';
    }

    if (jsonStart === -1) {
      return text; // No JSON found
    }

    // Use bracket counting to find the matching closing bracket
    const endChar = startChar === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = jsonStart; i < text.length; i++) {
      const char = text[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (char === startChar) {
        depth++;
      } else if (char === endChar) {
        depth--;
        if (depth === 0) {
          // Found the matching closing bracket
          return text.substring(jsonStart, i + 1);
        }
      }
    }

    // If we get here, no matching bracket was found
    // Return from jsonStart to end as fallback
    return text.substring(jsonStart);
  }

  /**
   * UTILITY: Quick validation check (without full optimization)
   * Useful for real-time feedback in UI
   */
  static async quickValidate(
    question: ResearchQuestion,
    options: OptimizationOptions,
    apiFunction: (systemPrompt: string, userPrompt: string, options: any) => Promise<string>
  ): Promise<ValidationReport> {
    const result = await this.generateOptimizedQuestions([question], options, apiFunction);
    return result.validationReports[0];
  }
}
