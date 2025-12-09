// src/services/CitationValidator.ts

export interface CrossRefResult {
  found: boolean;
  doi?: string;
  title?: string;
  authors?: any[];
  year?: number;
  score?: number;
}

export interface CitationValidation {
  isValid: boolean;
  confidence: number;
  warnings: string[];
  suggestions: string[];
  crossRefVerified?: boolean;
  doi?: string;
  actualTitle?: string;
}

export class CitationValidator {
  private suspiciousPatterns: RegExp[];
  private knownFakeCitations: Set<string>;

  constructor() {
    this.suspiciousPatterns = [
      /\(Smith et al\., 2023: S\. \d+\)/g,  // Zu generisch
      /\(Test, \d{4}\)/g,                   // Offensichtlich fake
      /\(\w+, 2025: S\. \d{3,}\)/g,        // Zukunft oder zu viele Seiten
      /\(Example et al\., \d{4}\)/g,       // Offensichtlich Beispiel
      /\(Author, \d{4}\)/g,                // Zu generisch "Author"
      /\(Lorem et al\., \d{4}\)/g,         // Lorem Ipsum Referenzen
      /\(Doe, \d{4}\)/g,                   // John/Jane Doe Referenzen
    ];

    this.knownFakeCitations = new Set([
      'Johnson et al., 2023',
      'Smith & Jones, 2024',
      'Brown, 2023',
      'Miller et al., 2023',
      'Wilson, 2024',
      'Davis & Taylor, 2023',
      'Anderson, 2024',
      'Thompson et al., 2023',
      'Clark, 2024',
      'Martinez & Garcia, 2023'
    ]);
  }

  /**
   * Validiert eine Zitation auf Plausibilität und Echtheit
   */
  async validateCitation(citation: string): Promise<CitationValidation> {
    const validation: CitationValidation = {
      isValid: true,
      confidence: 1.0,
      warnings: [],
      suggestions: []
    };

    // 1. Muster-Check auf verdächtige Patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(citation)) {
        validation.warnings.push('Citation matches suspicious pattern');
        validation.confidence *= 0.7;
      }
    }

    // 2. Check gegen bekannte Fake-Zitationen
    const citationCore = this.extractCitationCore(citation);
    if (this.knownFakeCitations.has(citationCore)) {
      validation.warnings.push('Known hallucinated citation pattern');
      validation.confidence *= 0.3;
      validation.isValid = false;
    }

    // 3. Jahr-Validierung
    const yearValidation = this.validateYear(citation);
    if (!yearValidation.isValid) {
      validation.warnings.push(...yearValidation.warnings);
      validation.confidence *= yearValidation.confidenceMultiplier;
      if (yearValidation.isCritical) {
        validation.isValid = false;
      }
    }

    // 4. Format-Validierung
    const formatValidation = this.validateFormat(citation);
    if (!formatValidation.isValid) {
      validation.warnings.push(...formatValidation.warnings);
      validation.confidence *= formatValidation.confidenceMultiplier;
    }

    // 5. CrossRef API Check (nur wenn Confidence noch hoch genug)
    if (validation.confidence > 0.5) {
      const crossRefResult = await this.checkCrossRef(citation);
      if (crossRefResult) {
        validation.crossRefVerified = crossRefResult.found;
        validation.doi = crossRefResult.doi;
        validation.actualTitle = crossRefResult.title;

        if (!crossRefResult.found && validation.confidence > 0.6) {
          validation.warnings.push('Citation not found in CrossRef database');
          validation.confidence *= 0.6;
        }
      }
    }

    // 6. Finale Bewertung
    if (validation.confidence < 0.3) {
      validation.isValid = false;
    }

    return validation;
  }

  /**
   * Extrahiert den Kern einer Zitation (Autor + Jahr)
   */
  private extractCitationCore(citation: string): string {
    // Entferne Klammern, Seitenzahlen, etc.
    const cleaned = citation
      .replace(/[()]/g, '')
      .replace(/:\s*S?\.\s*\d+/g, '')
      .replace(/,\s*S?\.\s*\d+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned;
  }

  /**
   * Validiert das Jahr in der Zitation
   */
  private validateYear(citation: string): {
    isValid: boolean;
    warnings: string[];
    confidenceMultiplier: number;
    isCritical: boolean;
  } {
    const yearMatch = citation.match(/\b(19|20)\d{2}\b/);
    const result = {
      isValid: true,
      warnings: [] as string[],
      confidenceMultiplier: 1.0,
      isCritical: false
    };

    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      const currentYear = new Date().getFullYear();

      if (year > currentYear) {
        result.warnings.push(`Future year detected: ${year}`);
        result.isValid = false;
        result.isCritical = true;
      }

      if (year > currentYear + 1) {
        result.warnings.push(`Year too far in future: ${year}`);
        result.confidenceMultiplier = 0.2;
        result.isCritical = true;
      }

      if (year < 1900) {
        result.warnings.push(`Unrealistic year for modern research: ${year}`);
        result.confidenceMultiplier = 0.5;
      }

      // Prüfe auf häufig halluzinierte Jahre
      const suspiciousYears = [2023, 2024, 2025];
      if (suspiciousYears.includes(year)) {
        result.warnings.push(`Year ${year} is commonly hallucinated by AI`);
        result.confidenceMultiplier *= 0.8;
      }
    } else {
      result.warnings.push('No valid year found in citation');
      result.confidenceMultiplier = 0.6;
    }

    return result;
  }

  /**
   * Validiert das Format der Zitation
   */
  private validateFormat(citation: string): {
    isValid: boolean;
    warnings: string[];
    confidenceMultiplier: number;
  } {
    const result = {
      isValid: true,
      warnings: [] as string[],
      confidenceMultiplier: 1.0
    };

    // Grundlegende Format-Checks
    if (!citation.includes('(') || !citation.includes(')')) {
      result.warnings.push('Citation missing proper parentheses format');
      result.confidenceMultiplier *= 0.8;
    }

    // Prüfe auf Standard-Zitationsformate
    const standardFormats = [
      /\(.+?,\s*\d{4}\)/,                    // (Author, Year)
      /\(.+?\s+et\s+al\.,\s*\d{4}\)/,       // (Author et al., Year)
      /\(.+?&.+?,\s*\d{4}\)/                // (Author & Author, Year)
    ];

    const hasStandardFormat = standardFormats.some(pattern => pattern.test(citation));
    if (!hasStandardFormat) {
      result.warnings.push('Citation does not follow standard academic format');
      result.confidenceMultiplier *= 0.7;
    }

    // Prüfe auf verdächtige Zeichen oder Muster
    if (citation.includes('...') || citation.includes('etc.')) {
      result.warnings.push('Citation contains placeholder text');
      result.confidenceMultiplier *= 0.5;
      result.isValid = false;
    }

    return result;
  }

  /**
   * Überprüft Zitation gegen CrossRef-Datenbank
   */
  async checkCrossRef(citation: string): Promise<CrossRefResult | null> {
    try {
      // Extrahiere Suchbegriffe
      const authorMatch = citation.match(/\(([^,\(]+)/);
      const yearMatch = citation.match(/\b(19|20)\d{2}\b/);

      if (!authorMatch || !yearMatch) return null;

      const author = authorMatch[1].trim();
      const year = yearMatch[0];
      const query = `${author} ${year}`;

      // CrossRef API Call mit Timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=3&sort=score&order=desc`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'EvidenRA-Professional/1.0 (mailto:contact@evidenra.com)'
          }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) return null;

      const data = await response.json();

      if (data.message.items && data.message.items.length > 0) {
        const bestMatch = data.message.items[0];

        // Prüfe Match-Qualität
        const matchScore = bestMatch.score || 0;
        const authorNames = bestMatch.author?.map((a: any) => a.family).join(' ') || '';
        const publicationYear = bestMatch.published?.['date-parts']?.[0]?.[0];

        // Strikte Validierung
        const authorMatches = author.toLowerCase().includes(authorNames.toLowerCase()) ||
                             authorNames.toLowerCase().includes(author.toLowerCase());
        const yearMatches = publicationYear && Math.abs(publicationYear - parseInt(year)) <= 1;

        return {
          found: matchScore > 10 && authorMatches && yearMatches,
          doi: bestMatch.DOI,
          title: bestMatch.title?.[0],
          authors: bestMatch.author,
          year: publicationYear,
          score: matchScore
        };
      }

      return { found: false };
    } catch (error) {
      console.error('CrossRef check failed:', error);
      return null;
    }
  }

  /**
   * Batch-Validierung mehrerer Zitationen
   */
  async validateCitations(citations: string[]): Promise<CitationValidation[]> {
    const results = await Promise.allSettled(
      citations.map(citation => this.validateCitation(citation))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Citation validation failed for: ${citations[index]}`, result.reason);
        return {
          isValid: false,
          confidence: 0,
          warnings: ['Validation failed due to error'],
          suggestions: []
        };
      }
    });
  }

  /**
   * Erweiterte Zitations-Extraktion aus Text
   */
  extractCitationsFromText(text: string): string[] {
    const citationPatterns = [
      /\([^)]*\b(19|20)\d{2}[^)]*\)/g,      // (Anything with year)
      /\([^)]*et\s+al\.[^)]*\)/g,           // (Anything et al.)
      /\([^)]+,\s*\d{4}[^)]*\)/g           // (Author, Year format)
    ];

    const citations = new Set<string>();

    citationPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => citations.add(match.trim()));
    });

    return Array.from(citations);
  }

  /**
   * Generiert Verbesserungsvorschläge für verdächtige Zitationen
   */
  generateSuggestions(citation: string, validation: CitationValidation): string[] {
    const suggestions: string[] = [];

    if (validation.confidence < 0.5) {
      suggestions.push('Consider verifying this citation in the original source');
    }

    if (validation.warnings.some(w => w.includes('Future year'))) {
      suggestions.push('Check if the publication year is correct');
    }

    if (validation.warnings.some(w => w.includes('CrossRef'))) {
      suggestions.push('Try searching for this publication in academic databases');
    }

    if (validation.warnings.some(w => w.includes('pattern'))) {
      suggestions.push('This citation appears to follow common AI hallucination patterns');
    }

    if (!validation.crossRefVerified && validation.confidence > 0.3) {
      suggestions.push('Consider adding a DOI if available');
    }

    return suggestions;
  }
}

export default CitationValidator;