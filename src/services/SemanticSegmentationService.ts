// src/services/SemanticSegmentationService.ts
// SEMANTISCHE SATZ-LEVEL SEGMENTIERUNG FÜR QUALITATIVE KODIERUNG
// ================================================================================

export interface SemanticSegment {
  id: string;
  text: string;
  type: 'sentence' | 'clause' | 'paragraph';
  startPosition: number;
  endPosition: number;
  contextBefore?: string;
  contextAfter?: string;
  semanticWeight: number; // Wie bedeutungstragend ist dieser Satz?
  complexity: number; // Linguistische Komplexität
  isCompleteSentence: boolean;
}

export interface SegmentationOptions {
  includeContext?: boolean;
  contextLength?: number;
  minSentenceLength?: number;
  splitOnClauses?: boolean;
  respectParagraphs?: boolean;
}

export class SemanticSegmentationService {

  /**
   * Segmentiert Text in semantische Einheiten (Sätze, nicht Wörter/Fragmente)
   */
  static segmentText(
    text: string,
    options: SegmentationOptions = {}
  ): SemanticSegment[] {

    const opts = {
      includeContext: true,
      contextLength: 100,
      minSentenceLength: 10,
      splitOnClauses: false,
      respectParagraphs: true,
      ...options
    };

    // Normalisiere Text
    const normalizedText = this.normalizeText(text);

    // Trenne in Sätze (semantische Einheiten)
    const sentences = this.splitIntoSentences(normalizedText, opts);

    // Erstelle semantische Segmente
    const segments: SemanticSegment[] = [];
    let currentPosition = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];

      // Überspringe zu kurze Sätze (keine bedeutungstragenden Segmente)
      if (sentence.trim().length < opts.minSentenceLength) {
        currentPosition += sentence.length;
        continue;
      }

      const startPos = normalizedText.indexOf(sentence, currentPosition);
      const endPos = startPos + sentence.length;

      // Kontext extrahieren (vorheriger und nachfolgender Satz)
      let contextBefore = '';
      let contextAfter = '';

      if (opts.includeContext) {
        if (i > 0) {
          contextBefore = sentences[i - 1].slice(-opts.contextLength);
        }
        if (i < sentences.length - 1) {
          contextAfter = sentences[i + 1].slice(0, opts.contextLength);
        }
      }

      segments.push({
        id: `seg_${Date.now()}_${i}`,
        text: sentence.trim(),
        type: this.determineSegmentType(sentence),
        startPosition: startPos,
        endPosition: endPos,
        contextBefore: contextBefore.trim(),
        contextAfter: contextAfter.trim(),
        semanticWeight: this.calculateSemanticWeight(sentence),
        complexity: this.calculateComplexity(sentence),
        isCompleteSentence: this.isCompleteSentence(sentence)
      });

      currentPosition = endPos;
    }

    return segments;
  }

  /**
   * Normalisiert Text für konsistente Verarbeitung
   */
  private static normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')  // Normalize line breaks
      .replace(/\s+/g, ' ')     // Multiple spaces to single space
      .trim();
  }

  /**
   * Intelligentes Splitting in Sätze (semantische Einheiten)
   */
  private static splitIntoSentences(text: string, options: SegmentationOptions): string[] {
    // Erweiterte Satz-Trennung (berücksichtigt Abkürzungen, etc.)
    const sentenceEndings = /([.!?]+)(\s+|$)/g;

    // Finde alle Satzenden
    const parts: string[] = [];
    let lastIndex = 0;
    let match;

    while ((match = sentenceEndings.exec(text)) !== null) {
      const endIndex = match.index + match[0].length;
      const sentence = text.substring(lastIndex, endIndex).trim();

      // Prüfe ob es eine Abkürzung ist (z.B. "Dr.", "Prof.", "etc.")
      if (!this.isAbbreviation(sentence)) {
        parts.push(sentence);
        lastIndex = endIndex;
      }
    }

    // Rest hinzufügen
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex).trim());
    }

    return parts.filter(s => s.length > 0);
  }

  /**
   * Prüft ob ein Satzende eine Abkürzung ist
   */
  private static isAbbreviation(text: string): boolean {
    const abbreviations = /\b(Dr|Prof|etc|vs|Inc|Ltd|Mr|Mrs|Ms|Jr|Sr)\.\s*$/i;
    return abbreviations.test(text);
  }

  /**
   * Bestimmt den Typ des Segments
   */
  private static determineSegmentType(sentence: string): 'sentence' | 'clause' | 'paragraph' {
    // Einfache Heuristik
    if (sentence.includes(',') && sentence.split(',').length > 2) {
      return 'clause';
    }
    if (sentence.length > 200) {
      return 'paragraph';
    }
    return 'sentence';
  }

  /**
   * Berechnet semantisches Gewicht (Bedeutungstragung)
   */
  private static calculateSemanticWeight(sentence: string): number {
    let weight = 0.5; // Basis

    // Mehr Gewicht für längere Sätze (mehr Information)
    weight += Math.min(sentence.length / 200, 0.3);

    // Mehr Gewicht für Sätze mit wichtigen Schlüsselwörtern
    const importantWords = /\b(weil|deshalb|daher|jedoch|allerdings|dennoch|folglich|somit|wichtig|bedeutend|zentral|wesentlich|fundamental)\b/gi;
    const matches = sentence.match(importantWords);
    if (matches) {
      weight += matches.length * 0.05;
    }

    return Math.min(weight, 1.0);
  }

  /**
   * Berechnet linguistische Komplexität
   */
  private static calculateComplexity(sentence: string): number {
    let complexity = 0;

    // Satzlänge
    const wordCount = sentence.split(/\s+/).length;
    complexity += Math.min(wordCount / 30, 0.4);

    // Nebensätze (Kommata)
    const clauses = sentence.split(',').length - 1;
    complexity += clauses * 0.1;

    // Komplexe Wörter (>10 Zeichen)
    const complexWords = sentence.match(/\b\w{10,}\b/g);
    if (complexWords) {
      complexity += complexWords.length * 0.05;
    }

    return Math.min(complexity, 1.0);
  }

  /**
   * Prüft ob es ein vollständiger Satz ist
   */
  private static isCompleteSentence(sentence: string): boolean {
    // Mindestens 3 Wörter
    const wordCount = sentence.trim().split(/\s+/).length;
    if (wordCount < 3) return false;

    // Endet mit Satzzeichen
    if (!/[.!?]$/.test(sentence.trim())) return false;

    // Beginnt mit Großbuchstaben
    if (!/^[A-ZÄÖÜ]/.test(sentence.trim())) return false;

    return true;
  }

  /**
   * Gruppiert Segmente nach thematischer Ähnlichkeit
   */
  static groupSemanticallySimilar(
    segments: SemanticSegment[],
    threshold: number = 0.7
  ): SemanticSegment[][] {
    const groups: SemanticSegment[][] = [];
    const used = new Set<number>();

    for (let i = 0; i < segments.length; i++) {
      if (used.has(i)) continue;

      const group: SemanticSegment[] = [segments[i]];
      used.add(i);

      for (let j = i + 1; j < segments.length; j++) {
        if (used.has(j)) continue;

        // Einfache Ähnlichkeitsberechnung (kann mit ML verbessert werden)
        const similarity = this.calculateSimilarity(segments[i].text, segments[j].text);

        if (similarity >= threshold) {
          group.push(segments[j]);
          used.add(j);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Berechnet textuelle Ähnlichkeit (einfache Jaccard-basierte Methode)
   */
  private static calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}
