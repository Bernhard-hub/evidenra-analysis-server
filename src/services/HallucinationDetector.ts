// src/services/HallucinationDetector.ts

export interface HallucinationWarning {
  category: string;
  pattern?: string;
  matches?: string[];
  severity: number;
  issue?: string;
}

export interface ConsistencyIssue {
  category: string;
  issue: string;
  severity: number;
  details?: any;
}

export interface HallucinationAnalysis {
  score: number; // 0 = keine Halluzination, 1 = definitiv Halluzination
  warnings: HallucinationWarning[];
  flaggedSections: string[];
  suggestions: string[];
  interpretation: string;
  action: 'ACCEPT' | 'ACCEPT_WITH_WARNINGS' | 'REVIEW' | 'REJECT';
}

export class HallucinationDetector {
  private redFlags: Record<string, RegExp[]>;

  constructor() {
    this.redFlags = {
      // Übertriebene Behauptungen
      exaggerations: [
        /revolutionary breakthrough/gi,
        /paradigm-shifting/gi,
        /unprecedented discovery/gi,
        /groundbreaking/gi,
        /100%\s*(accuracy|success|effective)/gi,
        /perfect\s*(correlation|match|solution)/gi,
        /always|never|all|none|every|entirely|completely|absolutely/gi,
        /dramatically\s*(improves?|increases?|reduces?)/gi,
        /miracle\s*(cure|solution)/gi,
        /ultimate\s*(solution|answer)/gi
      ],

      // Fake oder unrealistische Statistiken
      suspiciousStats: [
        /\b\d{2}\.\d{2,}%/g,                     // Zu präzise (z.B. 73.42%)
        /p\s*[<=]\s*0\.0000\d+/g,               // Unrealistisch kleine p-Werte
        /n\s*=\s*[1-9]\d{4,}/g,                 // Unrealistisch große Samples
        /r\s*=\s*1\.00?/g,                      // Perfekte Korrelation
        /r\s*=\s*0\.99\d+/g,                    // Unrealistisch hohe Korrelation
        /\b(99|100)\.?\d*%\s*(accuracy|precision|recall)/gi, // Perfekte Genauigkeit
        /\b0\.00[0-9]{2,}\s*significance/gi,    // Übermäßig signifikante p-Werte
        /\d+,\d{3,}\s*participants/gi,          // Unrealistisch große Studien
        /effect\s*size.*?[2-9]\.\d+/gi         // Unrealistisch große Effektstärken
      ],

      // Vage Referenzen ohne Belege
      vagueReferences: [
        /recent studies show/gi,
        /researchers have found/gi,
        /it is well known/gi,
        /obviously/gi,
        /clearly/gi,
        /experts agree/gi,
        /studies suggest/gi,
        /research indicates/gi,
        /according to science/gi,
        /proven fact/gi,
        /numerous studies/gi,
        /extensive research/gi,
        /scientific consensus/gi
      ],

      // Verdächtige oder erfundene Institutionen
      fakeInstitutions: [
        /Institute for Advanced .+ Research/gi,
        /Global .+ Foundation/gi,
        /International Center for/gi,
        /Quantum .+ Laboratory/gi,
        /Advanced .+ Institute/gi,
        /World .+ Organization/gi,
        /National .+ Research Center/gi,
        /European .+ Institute/gi,
        /American .+ Foundation/gi
      ],

      // Buzzwords ohne Substanz
      buzzwords: [
        /AI-powered/gi,
        /quantum-enhanced/gi,
        /blockchain-based/gi,
        /machine learning algorithm/gi,
        /deep learning model/gi,
        /neural network/gi,
        /artificial intelligence/gi,
        /cutting-edge technology/gi,
        /state-of-the-art/gi,
        /next-generation/gi
      ],

      // Medizinische/wissenschaftliche Red Flags
      medicalClaims: [
        /cures? cancer/gi,
        /eliminates? all symptoms/gi,
        /completely safe/gi,
        /no side effects/gi,
        /guaranteed results/gi,
        /instant relief/gi,
        /permanent solution/gi,
        /works for everyone/gi,
        /miraculous healing/gi,
        /breakthrough treatment/gi
      ],

      // Temporale Inkonsistenzen
      temporalIssues: [
        /in the future.*will have been/gi,      // Verwirrende Zeitformen
        /recently.*in 202[5-9]/gi,              // "Recent" für Zukunft
        /last year.*202[5-9]/gi,                // "Last year" für Zukunft
        /currently.*202[5-9]/gi,                // Aktuelle Ereignisse in Zukunft
        /as of 202[5-9]/gi                      // "As of" mit Zukunftsdatum
      ]
    };
  }

  /**
   * Analysiert Text auf Anzeichen von Halluzinationen
   */
  analyzeContent(text: string): HallucinationAnalysis {
    const analysis: HallucinationAnalysis = {
      score: 0,
      warnings: [],
      flaggedSections: [],
      suggestions: [],
      interpretation: '',
      action: 'ACCEPT'
    };

    // 1. Red Flag Analysis für jede Kategorie
    for (const [category, patterns] of Object.entries(this.redFlags)) {
      for (const pattern of patterns) {
        const matches = Array.from(text.matchAll(pattern));
        if (matches.length > 0) {
          const uniqueMatches = [...new Set(matches.map(m => m[0]))];
          analysis.warnings.push({
            category,
            pattern: pattern.toString(),
            matches: uniqueMatches.slice(0, 3), // Max 3 Beispiele
            severity: this.getSeverity(category)
          });

          // Score berechnen basierend auf Häufigkeit und Schwere
          analysis.score += this.getSeverity(category) * uniqueMatches.length * 0.1;

          // Flagged sections sammeln
          matches.forEach(match => {
            if (match.index !== undefined) {
              const start = Math.max(0, match.index - 30);
              const end = Math.min(text.length, match.index + match[0].length + 30);
              analysis.flaggedSections.push(text.substring(start, end));
            }
          });
        }
      }
    }

    // 2. Konsistenz-Checks
    const consistencyIssues = this.checkConsistency(text);
    for (const issue of consistencyIssues) {
      analysis.warnings.push({
        category: issue.category,
        issue: issue.issue,
        severity: issue.severity
      });
      analysis.score += issue.severity * 0.15;
    }

    // 3. Strukturelle Analyse
    const structuralIssues = this.analyzeStructure(text);
    analysis.score += structuralIssues.suspiciousScore;
    if (structuralIssues.issues.length > 0) {
      analysis.warnings.push(...structuralIssues.issues.map(issue => ({
        category: 'structure',
        issue,
        severity: 0.2
      })));
    }

    // 4. Sprachliche Qualitätsprüfung
    const languageIssues = this.checkLanguageQuality(text);
    analysis.score += languageIssues.score;
    if (languageIssues.warnings.length > 0) {
      analysis.warnings.push(...languageIssues.warnings);
    }

    // Score normalisieren (max 1.0)
    analysis.score = Math.min(analysis.score, 1);

    // 5. Interpretierung und Handlungsempfehlung
    analysis.interpretation = this.interpretScore(analysis.score);
    analysis.action = this.recommendAction(analysis.score);
    analysis.suggestions = this.generateSuggestions(analysis);

    return analysis;
  }

  /**
   * Prüft numerische und logische Konsistenz
   */
  private checkConsistency(text: string): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    // 1. Prozent-Konsistenz
    const percentages = Array.from(text.matchAll(/\b(\d+(?:\.\d+)?)\s*%/g));
    if (percentages.length > 2) {
      const values = percentages.map(m => parseFloat(m[1]));
      const sum = values.reduce((a, b) => a + b, 0);

      // Wenn es aussieht wie eine Aufschlüsselung (z.B. "40% said yes, 35% said no, 25% unsure")
      const seemsLikeBreaddown = percentages.length >= 3 && percentages.length <= 5;
      if (seemsLikeBreaddown && Math.abs(sum - 100) > 5) {
        issues.push({
          category: 'consistency',
          issue: `Percentages don't add up to 100% (sum: ${sum.toFixed(1)}%)`,
          severity: 0.4,
          details: { percentages: values, sum }
        });
      }

      // Prüfe auf unmögliche Werte
      values.forEach(val => {
        if (val > 100) {
          issues.push({
            category: 'consistency',
            issue: `Percentage value exceeds 100%: ${val}%`,
            severity: 0.6
          });
        }
      });
    }

    // 2. Jahreskonsistenz
    const currentYear = new Date().getFullYear();
    const years = Array.from(text.matchAll(/\b(19|20)(\d{2})\b/g))
      .map(m => parseInt(m[0]))
      .filter(y => y >= 1900);

    years.forEach(year => {
      if (year > currentYear + 1) {
        issues.push({
          category: 'consistency',
          issue: `Future year referenced: ${year}`,
          severity: 0.8
        });
      }
    });

    // 3. Zahlenkonsistenz (gleiche Zahlen sollten konsistent formatiert sein)
    const numbers = Array.from(text.matchAll(/\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/g));
    const numberFormats = new Map<string, string[]>();

    numbers.forEach(match => {
      const num = match[0];
      const baseNum = num.replace(/[,\.]/g, '');
      if (!numberFormats.has(baseNum)) {
        numberFormats.set(baseNum, []);
      }
      numberFormats.get(baseNum)!.push(num);
    });

    numberFormats.forEach((formats, baseNum) => {
      if (formats.length > 1 && new Set(formats).size > 1) {
        issues.push({
          category: 'consistency',
          issue: `Inconsistent number formatting for ${baseNum}: ${formats.join(', ')}`,
          severity: 0.2
        });
      }
    });

    return issues;
  }

  /**
   * Analysiert die Textstruktur auf Auffälligkeiten
   */
  private analyzeStructure(text: string): { suspiciousScore: number; issues: string[] } {
    const issues: string[] = [];
    let suspiciousScore = 0;

    // 1. Übermäßige Wiederholungen
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentencePatterns = new Map<string, number>();

    sentences.forEach(sentence => {
      const pattern = sentence.trim().toLowerCase().replace(/\d+/g, 'N').replace(/[a-z]+/g, 'W');
      sentencePatterns.set(pattern, (sentencePatterns.get(pattern) || 0) + 1);
    });

    const maxRepetitions = Math.max(...sentencePatterns.values());
    if (maxRepetitions > 3) {
      issues.push(`Repetitive sentence patterns detected (${maxRepetitions} times)`);
      suspiciousScore += 0.3;
    }

    // 2. Ungewöhnliche Satzlängenverteilung
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;

    if (avgLength > 35) {
      issues.push('Sentences are unusually long (possible AI generation)');
      suspiciousScore += 0.2;
    }

    if (avgLength < 8 && sentences.length > 5) {
      issues.push('Sentences are unusually short and choppy');
      suspiciousScore += 0.15;
    }

    // 3. Übermäßige Listen oder Aufzählungen
    const bulletPoints = (text.match(/^\s*[\*\-\•]\s/gm) || []).length;
    const numberedLists = (text.match(/^\s*\d+\.\s/gm) || []).length;

    if (bulletPoints > 10 || numberedLists > 8) {
      issues.push('Excessive use of lists (common in AI generation)');
      suspiciousScore += 0.2;
    }

    // 4. Verdächtige Übergänge
    const suspiciousTransitions = [
      /furthermore,?\s/gi,
      /moreover,?\s/gi,
      /in addition,?\s/gi,
      /additionally,?\s/gi
    ];

    let transitionCount = 0;
    suspiciousTransitions.forEach(pattern => {
      transitionCount += (text.match(pattern) || []).length;
    });

    if (transitionCount > sentences.length * 0.3) {
      issues.push('Overuse of transitional phrases');
      suspiciousScore += 0.25;
    }

    return { suspiciousScore, issues };
  }

  /**
   * Prüft sprachliche Qualität und AI-typische Muster
   */
  private checkLanguageQuality(text: string): { score: number; warnings: HallucinationWarning[] } {
    const warnings: HallucinationWarning[] = [];
    let score = 0;

    // 1. Übermäßige Höflichkeit/Qualifizierer (AI-typisch)
    const qualifiers = text.match(/\b(quite|rather|somewhat|fairly|relatively|potentially|possibly|likely|probably)\s/gi) || [];
    if (qualifiers.length > text.split(' ').length * 0.05) {
      warnings.push({
        category: 'language',
        issue: 'Excessive use of qualifiers and hedging language',
        severity: 0.2,
        matches: [...new Set(qualifiers)].slice(0, 3)
      });
      score += 0.2;
    }

    // 2. Wiederholte Phrasen
    const commonPhrases = [
      /it('s)?\s+(important|worth|notable?)\s+to\s+(note|mention|consider)/gi,
      /this\s+(allows?|enables?|provides?)/gi,
      /in\s+conclusion/gi,
      /to\s+summarize/gi
    ];

    commonPhrases.forEach(phrase => {
      const matches = text.match(phrase) || [];
      if (matches.length > 2) {
        warnings.push({
          category: 'language',
          issue: 'Repetitive phrase usage',
          severity: 0.15,
          matches: matches.slice(0, 2)
        });
        score += 0.15;
      }
    });

    // 3. AI-typische Einleitungen
    const aiIntros = [
      /as an ai/gi,
      /i('m)?\s+(an\s+)?ai/gi,
      /as\s+an\s+artificial\s+intelligence/gi,
      /i('m)?\s+here\s+to\s+help/gi,
      /i\s+don('t|t)\s+have\s+(access|the ability)/gi
    ];

    aiIntros.forEach(intro => {
      if (intro.test(text)) {
        warnings.push({
          category: 'language',
          issue: 'AI self-identification detected',
          severity: 0.9,
          matches: [(text.match(intro) || [''])[0]]
        });
        score += 0.9;
      }
    });

    return { score, warnings };
  }

  /**
   * Bestimmt Schweregrad einer Kategorie
   */
  private getSeverity(category: string): number {
    const severities: Record<string, number> = {
      exaggerations: 0.4,
      suspiciousStats: 0.6,
      vagueReferences: 0.3,
      fakeInstitutions: 0.8,
      buzzwords: 0.2,
      medicalClaims: 0.9,
      temporalIssues: 0.7
    };
    return severities[category] || 0.3;
  }

  /**
   * Interpretiert den Halluzinations-Score
   */
  private interpretScore(score: number): string {
    if (score >= 0.8) return 'VERY HIGH RISK: Content very likely contains hallucinations';
    if (score >= 0.6) return 'HIGH RISK: Content likely contains hallucinations';
    if (score >= 0.4) return 'MEDIUM RISK: Content should be reviewed carefully';
    if (score >= 0.2) return 'LOW RISK: Minor issues detected';
    return 'MINIMAL RISK: Content appears reliable';
  }

  /**
   * Empfiehlt Handlung basierend auf Score
   */
  private recommendAction(score: number): 'ACCEPT' | 'ACCEPT_WITH_WARNINGS' | 'REVIEW' | 'REJECT' {
    if (score >= 0.7) return 'REJECT';
    if (score >= 0.4) return 'REVIEW';
    if (score >= 0.2) return 'ACCEPT_WITH_WARNINGS';
    return 'ACCEPT';
  }

  /**
   * Generiert Verbesserungsvorschläge
   */
  private generateSuggestions(analysis: HallucinationAnalysis): string[] {
    const suggestions: string[] = [];
    const categories = new Set(analysis.warnings.map(w => w.category));

    if (categories.has('exaggerations')) {
      suggestions.push('Use more moderate language and avoid absolute claims');
    }

    if (categories.has('suspiciousStats')) {
      suggestions.push('Verify all statistical claims and provide sources');
    }

    if (categories.has('vagueReferences')) {
      suggestions.push('Replace vague references with specific citations');
    }

    if (categories.has('fakeInstitutions')) {
      suggestions.push('Verify institutional names and affiliations');
    }

    if (categories.has('medicalClaims')) {
      suggestions.push('Medical claims require peer-reviewed sources');
    }

    if (categories.has('consistency')) {
      suggestions.push('Check numerical values and dates for consistency');
    }

    if (analysis.score > 0.5) {
      suggestions.push('Consider regenerating content with stricter guidelines');
    }

    return suggestions;
  }

  /**
   * Erstellt einen detaillierten Bericht
   */
  generateReport(analysis: HallucinationAnalysis): string {
    let report = `## Hallucination Detection Report\n\n`;
    report += `**Overall Score:** ${(analysis.score * 100).toFixed(1)}% risk\n`;
    report += `**Interpretation:** ${analysis.interpretation}\n`;
    report += `**Recommended Action:** ${analysis.action}\n\n`;

    if (analysis.warnings.length > 0) {
      report += `### Detected Issues (${analysis.warnings.length})\n\n`;

      const warningsByCategory = new Map<string, HallucinationWarning[]>();
      analysis.warnings.forEach(w => {
        if (!warningsByCategory.has(w.category)) {
          warningsByCategory.set(w.category, []);
        }
        warningsByCategory.get(w.category)!.push(w);
      });

      warningsByCategory.forEach((warnings, category) => {
        report += `#### ${category.toUpperCase()}\n`;
        warnings.forEach(warning => {
          const severity = Math.round(warning.severity * 100);
          report += `- **${warning.issue || 'Pattern detected'}** (Severity: ${severity}%)\n`;
          if (warning.matches && warning.matches.length > 0) {
            report += `  - Examples: "${warning.matches.join('", "')}"\n`;
          }
        });
        report += '\n';
      });
    }

    if (analysis.suggestions.length > 0) {
      report += `### Suggestions\n`;
      analysis.suggestions.forEach(suggestion => {
        report += `- ${suggestion}\n`;
      });
    }

    return report;
  }
}

export default HallucinationDetector;