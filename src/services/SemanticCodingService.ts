// src/services/SemanticCodingService.ts
// ERWEITERTE SEMANTISCHE KODIERUNG AUF SATZEBENE
// (Statt Wort-/Fragment-Ebene)
// ================================================================================

import { SemanticSegmentationService, type SemanticSegment } from './SemanticSegmentationService';
import APIService, { type APIMessage } from './APIService';

export interface SemanticCoding {
  id: string;
  segmentId: string;
  sentence: string; // Vollständiger Satz, nicht Fragment
  category: string;
  confidence: number;
  rationale: string; // Warum wurde diese Kategorie gewählt?
  contextBefore?: string;
  contextAfter?: string;
  semanticWeight: number;
  timestamp: string;
}

export interface CodingCategory {
  id: string;
  name: string;
  description: string;
  examples?: string[];
}

export interface SemanticCodingOptions {
  includeContext?: boolean;
  minConfidence?: number;
  requireRationale?: boolean;
  batchSize?: number;
}

export class SemanticCodingService {

  /**
   * Kodiert Text auf semantischer Satzebene (nicht Wortebene)
   */
  static async codeTextSemantically(
    text: string,
    categories: CodingCategory[],
    apiSettings: { provider: string; model: string; apiKey: string },
    options: SemanticCodingOptions = {}
  ): Promise<SemanticCoding[]> {

    const opts = {
      includeContext: true,
      minConfidence: 0.6,
      requireRationale: true,
      batchSize: 5,
      ...options
    };

    // Schritt 1: Segmentiere Text in semantische Einheiten (Sätze)
    const segments = SemanticSegmentationService.segmentText(text, {
      includeContext: opts.includeContext,
      minSentenceLength: 15,
      splitOnClauses: false
    });

    console.log(`📝 Text segmentiert in ${segments.length} semantische Einheiten (Sätze)`);

    // Schritt 2: Kodiere jeden Satz
    const codings: SemanticCoding[] = [];

    // Batch-Verarbeitung für Effizienz
    for (let i = 0; i < segments.length; i += opts.batchSize) {
      const batch = segments.slice(i, i + opts.batchSize);

      const batchCodings = await Promise.all(
        batch.map(segment => this.codeSingleSegment(segment, categories, apiSettings, opts))
      );

      codings.push(...batchCodings.filter(c => c.confidence >= opts.minConfidence));
    }

    return codings;
  }

  /**
   * Kodiert einen einzelnen semantischen Segment (Satz)
   */
  private static async codeSingleSegment(
    segment: SemanticSegment,
    categories: CodingCategory[],
    apiSettings: { provider: string; model: string; apiKey: string },
    options: SemanticCodingOptions
  ): Promise<SemanticCoding> {

    const categoriesDescription = categories.map(cat =>
      `• **${cat.name}**: ${cat.description}${cat.examples ? `\n  Beispiele: ${cat.examples.join(', ')}` : ''}`
    ).join('\n');

    const messages: APIMessage[] = [
      {
        role: 'system',
        content: `Du bist ein Experte für qualitative Inhaltsanalyse. Deine Aufgabe ist es, GANZE SÄTZE (nicht einzelne Wörter oder Fragmente) semantisch zu kodieren.

WICHTIG:
• Analysiere den GESAMTEN Satz als semantische Einheit
• Berücksichtige den Kontext (vorheriger/nachfolgender Satz)
• Fokus auf die BEDEUTUNG, nicht nur Keywords
• Wähle die Kategorie, die die HAUPTAUSSAGE des Satzes am besten erfasst`
      },
      {
        role: 'user',
        content: `Kodiere den folgenden Satz in eine der Kategorien:

KATEGORIEN:
${categoriesDescription}

SATZ ZU KODIEREN:
"${segment.text}"

${segment.contextBefore ? `KONTEXT DAVOR:\n"${segment.contextBefore}"` : ''}
${segment.contextAfter ? `KONTEXT DANACH:\n"${segment.contextAfter}"` : ''}

SEMANTISCHE EINHEIT:
• Dies ist ein vollständiger Satz (Typ: ${segment.type})
• Semantisches Gewicht: ${(segment.semanticWeight * 100).toFixed(0)}%
• Komplexität: ${(segment.complexity * 100).toFixed(0)}%

Antworte in folgendem JSON-Format:
{
  "category": "Kategoriename",
  "confidence": 0.0-1.0,
  "rationale": "Ausführliche Begründung: Warum wurde diese Kategorie gewählt? Was ist die Hauptaussage des Satzes?"
}`
      }
    ];

    try {
      const result = await APIService.callAPI(
        apiSettings.provider,
        apiSettings.model,
        apiSettings.apiKey,
        messages,
        300
      );

      if (!result.success) {
        throw new Error(result.error || 'API call failed');
      }

      // Parse AI response
      const response = this.parseAIResponse(result.content);

      return {
        id: `cod_${Date.now()}_${segment.id}`,
        segmentId: segment.id,
        sentence: segment.text,
        category: response.category,
        confidence: response.confidence,
        rationale: response.rationale,
        contextBefore: segment.contextBefore,
        contextAfter: segment.contextAfter,
        semanticWeight: segment.semanticWeight,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Fehler bei Segment-Kodierung:', error);

      // Fallback: Niedrige Konfidenz
      return {
        id: `cod_${Date.now()}_${segment.id}`,
        segmentId: segment.id,
        sentence: segment.text,
        category: categories[0]?.name || 'Unkategorisiert',
        confidence: 0.3,
        rationale: 'Automatische Kodierung fehlgeschlagen',
        contextBefore: segment.contextBefore,
        contextAfter: segment.contextAfter,
        semanticWeight: segment.semanticWeight,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Parst AI-Antwort
   */
  private static parseAIResponse(content: string): {
    category: string;
    confidence: number;
    rationale: string;
  } {
    try {
      // Versuche JSON zu parsen
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          category: parsed.category || 'Unkategorisiert',
          confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
          rationale: parsed.rationale || 'Keine Begründung angegeben'
        };
      }

      // Fallback: Text-Parsing
      const categoryMatch = content.match(/category[:\s]+([^\n,]+)/i);
      const confidenceMatch = content.match(/confidence[:\s]+([\d.]+)/i);
      const rationaleMatch = content.match(/rationale[:\s]+(.+?)(?:\n|$)/i);

      return {
        category: categoryMatch ? categoryMatch[1].trim() : 'Unkategorisiert',
        confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5,
        rationale: rationaleMatch ? rationaleMatch[1].trim() : 'Automatisch extrahiert'
      };

    } catch (error) {
      console.error('Fehler beim Parsen der AI-Antwort:', error);
      return {
        category: 'Unkategorisiert',
        confidence: 0.4,
        rationale: 'Parsing fehlgeschlagen'
      };
    }
  }

  /**
   * Validiert Kodierungen (prüft auf Konsistenz)
   */
  static validateCodings(codings: SemanticCoding[]): {
    valid: SemanticCoding[];
    lowConfidence: SemanticCoding[];
    requiresReview: SemanticCoding[];
  } {
    const valid: SemanticCoding[] = [];
    const lowConfidence: SemanticCoding[] = [];
    const requiresReview: SemanticCoding[] = [];

    for (const coding of codings) {
      if (coding.confidence >= 0.8) {
        valid.push(coding);
      } else if (coding.confidence >= 0.6) {
        lowConfidence.push(coding);
      } else {
        requiresReview.push(coding);
      }
    }

    return { valid, lowConfidence, requiresReview };
  }

  /**
   * Exportiert Kodierungen in strukturiertem Format
   */
  static exportCodings(codings: SemanticCoding[], format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(codings, null, 2);
    }

    // CSV Export
    const header = 'ID,Satz,Kategorie,Konfidenz,Begründung,Timestamp\n';
    const rows = codings.map(c =>
      `"${c.id}","${c.sentence.replace(/"/g, '""')}","${c.category}",${c.confidence},"${c.rationale.replace(/"/g, '""')}","${c.timestamp}"`
    ).join('\n');

    return header + rows;
  }

  /**
   * Generiert Zusammenfassung der Kodierungen
   */
  static generateSummary(codings: SemanticCoding[]): {
    totalCodings: number;
    averageConfidence: number;
    categoryCounts: Record<string, number>;
    highConfidenceRate: number;
  } {
    const categoryCounts: Record<string, number> = {};
    let totalConfidence = 0;
    let highConfidenceCount = 0;

    for (const coding of codings) {
      categoryCounts[coding.category] = (categoryCounts[coding.category] || 0) + 1;
      totalConfidence += coding.confidence;
      if (coding.confidence >= 0.8) highConfidenceCount++;
    }

    return {
      totalCodings: codings.length,
      averageConfidence: codings.length > 0 ? totalConfidence / codings.length : 0,
      categoryCounts,
      highConfidenceRate: codings.length > 0 ? highConfidenceCount / codings.length : 0
    };
  }
}
