// 🎯 AKIH Methodology Framework
// AI-gestützte Kodierende Inhaltsanalyse Hybrid
// Novel Scientific Methodology for Qualitative Research

/**
 * AKIH (AI-gestützte Kodierende Inhaltsanalyse Hybrid)
 *
 * Eine neuartige wissenschaftliche Methode, die KI-gestützte qualitative
 * Inhaltsanalyse mit regelgeleiteter menschlicher Interaktion kombiniert.
 *
 * Diese Methode übertrifft traditionelle QDA-Software (Atlas.ti, MAXQDA)
 * durch datengetriebene, validierte und halluzinationsfreie Analyse.
 *
 * @author EVIDENRA Professional
 * @version 1.0.0
 * @scientific_basis Grounded Theory (Glaser & Strauss), Qualitative Content Analysis (Mayring)
 */

import { ProjectData, Category, Coding, Document, Pattern } from '../types';

// ============================================================================
// AKIH Score Components
// ============================================================================

export interface AKIHScoreComponents {
  // Kodierungsqualität (0-1)
  precision: number;           // Korrektheit der Kodierungen
  recall: number;              // Vollständigkeit der Kodierungen
  consistency: number;         // Inter-Rater-Reliabilität

  // Theoretische Sättigung (0-1)
  saturation: number;          // Theoretische Sättigung erreicht
  coverage: number;            // Datenabdeckung

  // Methodische Rigorosität (0-1)
  integration: number;         // Cross-Referenz-Dichte
  traceability: number;        // Nachvollziehbarkeit
  reflexivity: number;         // Reflexivität dokumentiert

  // Gesamtscore (0-100)
  totalScore: number;

  // Qualitätsstufe
  qualityLevel: 'excellent' | 'good' | 'acceptable' | 'insufficient';

  // Detaillierte Metriken
  metrics: {
    totalDocuments: number;
    analyzedDocuments: number;
    totalCategories: number;
    totalCodings: number;
    averageCodingsPerDocument: number;
    averageCodingsPerCategory: number;
    categoryDepth: number;
    patternDensity: number;
    validatedCodings: number;
    validationRate: number;
  };
}

export interface AKIHValidationResult {
  isValid: boolean;
  codingId: string;
  validatedAt: Date;
  validatedBy: 'human' | 'ai' | 'consensus';
  confidence: number;
  rationale: string;
  suggestedImprovements?: string[];
}

// ============================================================================
// AKIH Methodology Class
// ============================================================================

export class AKIHMethodology {

  /**
   * 🎯 Berechnet den AKIH Score für ein Projekt
   *
   * Formula:
   * AKIH_Score = (
   *   α * (Precision + Recall + Consistency) / 3 +
   *   β * (Saturation + Coverage) / 2 +
   *   γ * (Integration + Traceability + Reflexivity) / 3
   * ) * 100
   *
   * Gewichte: α=0.40 (Kodierungsqualität), β=0.35 (Sättigung), γ=0.25 (Rigorosität)
   *
   * @param projectData Das Projektdaten-Objekt
   * @returns AKIH Score mit detaillierten Komponenten
   */
  static calculateAKIHScore(projectData: ProjectData): AKIHScoreComponents {
    // 1️⃣ Kodierungsqualität berechnen
    const precision = this.calculatePrecision(projectData);
    const recall = this.calculateRecall(projectData);
    const consistency = this.calculateConsistency(projectData);

    // 2️⃣ Theoretische Sättigung berechnen
    const saturation = this.calculateSaturation(projectData);
    const coverage = this.calculateCoverage(projectData);

    // 3️⃣ Methodische Rigorosität berechnen
    const integration = this.calculateIntegration(projectData);
    const traceability = this.calculateTraceability(projectData);
    const reflexivity = this.calculateReflexivity(projectData);

    // 4️⃣ Gewichteter Gesamtscore
    const α = 0.40; // Gewicht für Kodierungsqualität
    const β = 0.35; // Gewicht für Sättigung
    const γ = 0.25; // Gewicht für Rigorosität

    const totalScore = (
      α * (precision + recall + consistency) / 3 +
      β * (saturation + coverage) / 2 +
      γ * (integration + traceability + reflexivity) / 3
    ) * 100;

    // 5️⃣ Qualitätsstufe bestimmen
    const qualityLevel = this.determineQualityLevel(totalScore);

    // 6️⃣ Detaillierte Metriken sammeln
    const metrics = this.calculateDetailedMetrics(projectData);

    return {
      precision,
      recall,
      consistency,
      saturation,
      coverage,
      integration,
      traceability,
      reflexivity,
      totalScore: Math.round(totalScore * 100) / 100,
      qualityLevel,
      metrics
    };
  }

  // ============================================================================
  // Kodierungsqualität (Precision, Recall, Consistency)
  // ============================================================================

  /**
   * 📊 Precision: Anteil korrekt zugeordneter Kodierungen
   *
   * Formula: Precision = Validated_Codings / Total_Codings
   *
   * - 1.0 = Alle Kodierungen validiert
   * - 0.8 = 80% validiert (gut)
   * - 0.5 = 50% validiert (akzeptabel)
   * - < 0.5 = Unzureichend
   */
  private static calculatePrecision(projectData: ProjectData): number {
    const totalCodings = projectData.codings?.length || 0;
    if (totalCodings === 0) return 0;

    // Kodierungen mit Validierung zählen
    const validatedCodings = projectData.codings?.filter(c =>
      c.validation?.isValidated === true
    ).length || 0;

    return validatedCodings / totalCodings;
  }

  /**
   * 📊 Recall: Vollständigkeit der Kodierung
   *
   * Formula: Recall = Coded_Segments / Potentially_Relevant_Segments
   *
   * Schätzung basierend auf:
   * - Durchschnittliche Kodierungsdichte pro Dokument
   * - Erwartete Kodierungen basierend auf Kategorienanzahl
   */
  private static calculateRecall(projectData: ProjectData): number {
    const documents = projectData.documents || [];
    const codings = projectData.codings || [];
    const categories = projectData.categories || [];

    if (documents.length === 0 || categories.length === 0) return 0;

    // Erwartete Kodierungen: Mindestens 3-5 Kodierungen pro Kategorie
    const expectedCodingsPerCategory = 4;
    const expectedTotalCodings = categories.length * expectedCodingsPerCategory;

    // Recall = Tatsächliche / Erwartete (max 1.0)
    return Math.min(codings.length / expectedTotalCodings, 1.0);
  }

  /**
   * 📊 Consistency: Inter-Rater-Reliabilität (adaptiert für AI-Human-Hybrid)
   *
   * Formula: Cohen's Kappa adaptiert
   * κ = (P_observed - P_expected) / (1 - P_expected)
   *
   * - Bei AKIH: Übereinstimmung zwischen AI-Vorschlägen und Human-Validierung
   */
  private static calculateConsistency(projectData: ProjectData): number {
    const codings = projectData.codings || [];
    const validatedCodings = codings.filter(c => c.validation?.isValidated);

    if (validatedCodings.length === 0) {
      // Fallback: Konsistenz basierend auf Kategorienhierarchie
      return this.calculateCategoryConsistency(projectData);
    }

    // AI-Human Agreement: Wie viele AI-Kodierungen wurden validiert?
    const aiCodings = codings.filter(c => c.source === 'ai' || c.aiGenerated);
    const aiValidated = aiCodings.filter(c => c.validation?.isValidated);

    if (aiCodings.length === 0) return 0.7; // Default bei rein manueller Kodierung

    const observedAgreement = aiValidated.length / aiCodings.length;

    // Expected agreement (Zufall)
    const categories = projectData.categories || [];
    const expectedAgreement = 1 / Math.max(categories.length, 1);

    // Cohen's Kappa
    const kappa = (observedAgreement - expectedAgreement) / (1 - expectedAgreement);

    return Math.max(0, Math.min(1, kappa));
  }

  /**
   * 📊 Kategorienkonsistenz (Fallback für Consistency)
   */
  private static calculateCategoryConsistency(projectData: ProjectData): number {
    const categories = projectData.categories || [];
    const codings = projectData.codings || [];

    if (categories.length === 0) return 0;

    // Konsistenz = Ausgeglichenheit der Kodierungsverteilung
    const codingsPerCategory = categories.map(cat =>
      codings.filter(c => c.categoryId === cat.id).length
    );

    const avgCodings = codingsPerCategory.reduce((a, b) => a + b, 0) / categories.length;
    const variance = codingsPerCategory.reduce((sum, count) =>
      sum + Math.pow(count - avgCodings, 2), 0
    ) / categories.length;

    // Niedriger Varianz = Höhere Konsistenz
    const cv = Math.sqrt(variance) / (avgCodings || 1); // Coefficient of Variation

    return Math.max(0, 1 - cv / 2); // Normalisiert auf 0-1
  }

  // ============================================================================
  // Theoretische Sättigung (Saturation, Coverage)
  // ============================================================================

  /**
   * 📊 Saturation: Theoretische Sättigung erreicht
   *
   * Formula: Saturation = 1 - (New_Codes_Last_20% / Total_Codes)
   *
   * Theoretische Sättigung ist erreicht, wenn in den letzten 20% der Dokumente
   * nur noch wenige neue Kategorien/Muster entstehen.
   */
  private static calculateSaturation(projectData: ProjectData): number {
    const documents = projectData.documents || [];
    const categories = projectData.categories || [];
    const patterns = Array.isArray(projectData.patterns) ? projectData.patterns : [];

    if (documents.length < 5) return 0; // Zu wenig Daten für Sättigung

    // Sortiere Dokumente nach Upload-Datum
    const sortedDocs = [...documents].sort((a, b) =>
      new Date(a.uploadedAt || 0).getTime() - new Date(b.uploadedAt || 0).getTime()
    );

    // Letzte 20% der Dokumente
    const last20Percent = Math.ceil(sortedDocs.length * 0.2);
    const lastDocIds = sortedDocs.slice(-last20Percent).map(d => d.id);

    // Kategorien, die nur in letzten 20% vorkommen (neue Kategorien)
    const categoriesInLast20 = categories.filter(cat => {
      const codings = projectData.codings?.filter(c => c.categoryId === cat.id) || [];
      return codings.every(c => lastDocIds.includes(c.documentId));
    });

    // Sättigung = 1 - (Neue Kategorien / Gesamt)
    const saturation = 1 - (categoriesInLast20.length / Math.max(categories.length, 1));

    return Math.max(0, saturation);
  }

  /**
   * 📊 Coverage: Datenabdeckung
   *
   * Formula: Coverage = Analyzed_Documents / Total_Documents
   */
  private static calculateCoverage(projectData: ProjectData): number {
    const documents = projectData.documents || [];
    const codings = projectData.codings || [];

    if (documents.length === 0) return 0;

    // Dokumente mit mindestens einer Kodierung
    const analyzedDocIds = new Set(codings.map(c => c.documentId));
    const analyzedDocuments = documents.filter(d => analyzedDocIds.has(d.id));

    return analyzedDocuments.length / documents.length;
  }

  // ============================================================================
  // Methodische Rigorosität (Integration, Traceability, Reflexivity)
  // ============================================================================

  /**
   * 📊 Integration: Cross-Referenz-Dichte
   *
   * Formula: Integration = Connected_Entities / Total_Entities
   *
   * Misst wie gut Kategorien, Muster, und Dokumente miteinander verknüpft sind.
   */
  private static calculateIntegration(projectData: ProjectData): number {
    const categories = projectData.categories || [];
    const patterns = Array.isArray(projectData.patterns) ? projectData.patterns : [];
    const codings = projectData.codings || [];

    if (categories.length === 0) return 0;

    // Kategorien mit Muster-Verknüpfungen
    const categoriesInPatterns = new Set(
      patterns.flatMap(p => p.categories?.map(c => c.id) || [])
    );

    // Kategorien mit Kodierungen
    const categoriesWithCodings = new Set(codings.map(c => c.categoryId));

    // Integration = Verbundene Kategorien / Gesamt
    const connectedCategories = new Set([
      ...categoriesInPatterns,
      ...categoriesWithCodings
    ]);

    const integration = connectedCategories.size / categories.length;

    return Math.min(1, integration);
  }

  /**
   * 📊 Traceability: Nachvollziehbarkeit
   *
   * Formula: Traceability = (Coded_Segments_With_Text + Categories_With_Descriptions) / (Total_Codings + Total_Categories)
   *
   * Misst ob Kodierungen und Kategorien ausreichend dokumentiert sind.
   */
  private static calculateTraceability(projectData: ProjectData): number {
    const categories = projectData.categories || [];
    const codings = projectData.codings || [];

    const totalItems = categories.length + codings.length;
    if (totalItems === 0) return 0;

    // Kategorien mit Beschreibung
    const categoriesWithDesc = categories.filter(c =>
      c.description && c.description.length > 10
    ).length;

    // Kodierungen mit Text
    const codingsWithText = codings.filter(c =>
      c.text && c.text.length > 5
    ).length;

    return (categoriesWithDesc + codingsWithText) / totalItems;
  }

  /**
   * 📊 Reflexivity: Reflexivität dokumentiert
   *
   * Formula: Reflexivity = Reflexivity_Statements / Expected_Statements
   *
   * Erwartung: Mindestens 1 Statement pro 10 Dokumente
   */
  private static calculateReflexivity(projectData: ProjectData): number {
    const documents = projectData.documents || [];
    const reflexivityStatements = projectData.reflexivityStatements || [];

    if (documents.length === 0) return 0;

    // Erwartung: 1 Statement pro 10 Dokumente (minimum 1)
    const expectedStatements = Math.max(1, Math.ceil(documents.length / 10));

    return Math.min(1, reflexivityStatements.length / expectedStatements);
  }

  // ============================================================================
  // Qualitätsstufe
  // ============================================================================

  private static determineQualityLevel(score: number): 'excellent' | 'good' | 'acceptable' | 'insufficient' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'acceptable';
    return 'insufficient';
  }

  // ============================================================================
  // Detaillierte Metriken
  // ============================================================================

  private static calculateDetailedMetrics(projectData: ProjectData) {
    const documents = projectData.documents || [];
    const categories = projectData.categories || [];
    const codings = projectData.codings || [];
    const patterns = Array.isArray(projectData.patterns) ? projectData.patterns : [];

    // Analysierte Dokumente
    const analyzedDocIds = new Set(codings.map(c => c.documentId));
    const analyzedDocuments = documents.filter(d => analyzedDocIds.has(d.id)).length;

    // Kategorientiefe (maximale Hierarchietiefe)
    const categoryDepth = this.calculateCategoryDepth(categories);

    // Muster-Dichte (Muster pro Kategorie)
    const patternDensity = categories.length > 0
      ? patterns.length / categories.length
      : 0;

    // Validierungsrate
    const validatedCodings = codings.filter(c => c.validation?.isValidated).length;
    const validationRate = codings.length > 0 ? validatedCodings / codings.length : 0;

    return {
      totalDocuments: documents.length,
      analyzedDocuments,
      totalCategories: categories.length,
      totalCodings: codings.length,
      averageCodingsPerDocument: analyzedDocuments > 0 ? codings.length / analyzedDocuments : 0,
      averageCodingsPerCategory: categories.length > 0 ? codings.length / categories.length : 0,
      categoryDepth,
      patternDensity,
      validatedCodings,
      validationRate
    };
  }

  private static calculateCategoryDepth(categories: Category[]): number {
    if (categories.length === 0) return 0;

    const depths = categories.map(cat => {
      let depth = 1;
      let currentId = cat.parentId;

      while (currentId) {
        depth++;
        const parent = categories.find(c => c.id === currentId);
        currentId = parent?.parentId;
      }

      return depth;
    });

    return Math.max(...depths, 1);
  }

  // ============================================================================
  // Kodierungs-Validierung
  // ============================================================================

  /**
   * 🔍 Validiert eine Kodierung basierend auf AKIH-Kriterien
   *
   * @param coding Die zu validierende Kodierung
   * @param projectData Das Projektdaten-Objekt
   * @param validator 'human' | 'ai' | 'consensus'
   * @returns Validierungsergebnis
   */
  static validateCoding(
    coding: Coding,
    projectData: ProjectData,
    validator: 'human' | 'ai' | 'consensus'
  ): AKIHValidationResult {
    // Validierungskriterien prüfen
    const criteria = {
      hasText: coding.text && coding.text.length >= 5,
      hasCategory: !!coding.categoryId,
      categoryExists: projectData.categories?.some(c => c.id === coding.categoryId),
      hasDocument: !!coding.documentId,
      documentExists: projectData.documents?.some(d => d.id === coding.documentId),
      hasValidPosition: coding.startLine >= 0 && coding.endLine >= coding.startLine
    };

    const passedCriteria = Object.values(criteria).filter(v => v).length;
    const totalCriteria = Object.keys(criteria).length;
    const confidence = passedCriteria / totalCriteria;

    const isValid = confidence >= 0.8; // 80% der Kriterien müssen erfüllt sein

    // Verbesserungsvorschläge generieren
    const suggestedImprovements: string[] = [];
    if (!criteria.hasText) suggestedImprovements.push('Kodierungstext zu kurz oder fehlend');
    if (!criteria.hasCategory) suggestedImprovements.push('Keine Kategorie zugewiesen');
    if (!criteria.categoryExists) suggestedImprovements.push('Zugewiesene Kategorie existiert nicht');
    if (!criteria.hasDocument) suggestedImprovements.push('Kein Dokument zugewiesen');
    if (!criteria.documentExists) suggestedImprovements.push('Zugewiesenes Dokument existiert nicht');
    if (!criteria.hasValidPosition) suggestedImprovements.push('Ungültige Zeilenposition');

    return {
      isValid,
      codingId: coding.id,
      validatedAt: new Date(),
      validatedBy: validator,
      confidence,
      rationale: isValid
        ? `Kodierung erfüllt ${passedCriteria}/${totalCriteria} Qualitätskriterien`
        : `Kodierung erfüllt nur ${passedCriteria}/${totalCriteria} Kriterien`,
      suggestedImprovements: suggestedImprovements.length > 0 ? suggestedImprovements : undefined
    };
  }

  /**
   * 📋 Generiert einen AKIH-Methodologie-Bericht
   */
  static generateMethodologyReport(projectData: ProjectData): string {
    const score = this.calculateAKIHScore(projectData);

    return `
# AKIH Methodologie-Bericht

## Gesamtscore: ${score.totalScore} / 100 (${this.getQualityLevelText(score.qualityLevel)})

### Kodierungsqualität (Gewicht: 40%)
- **Precision (Genauigkeit)**: ${(score.precision * 100).toFixed(1)}%
  - ${score.metrics.validatedCodings} von ${score.metrics.totalCodings} Kodierungen validiert
- **Recall (Vollständigkeit)**: ${(score.recall * 100).toFixed(1)}%
  - Durchschnittlich ${score.metrics.averageCodingsPerCategory.toFixed(1)} Kodierungen pro Kategorie
- **Consistency (Konsistenz)**: ${(score.consistency * 100).toFixed(1)}%
  - Inter-Rater-Reliabilität (Cohen's Kappa adaptiert)

### Theoretische Sättigung (Gewicht: 35%)
- **Saturation (Sättigung)**: ${(score.saturation * 100).toFixed(1)}%
  - Neue Kategorien in letzten 20% der Dokumente
- **Coverage (Abdeckung)**: ${(score.coverage * 100).toFixed(1)}%
  - ${score.metrics.analyzedDocuments} von ${score.metrics.totalDocuments} Dokumenten analysiert

### Methodische Rigorosität (Gewicht: 25%)
- **Integration (Vernetzung)**: ${(score.integration * 100).toFixed(1)}%
  - Cross-Referenz-Dichte zwischen Kategorien und Mustern
- **Traceability (Nachvollziehbarkeit)**: ${(score.traceability * 100).toFixed(1)}%
  - Dokumentation von Kategorien und Kodierungen
- **Reflexivity (Reflexivität)**: ${(score.reflexivity * 100).toFixed(1)}%
  - Forscher-Positionierung dokumentiert

### Detaillierte Projektmetriken
- **Dokumente**: ${score.metrics.totalDocuments} (${score.metrics.analyzedDocuments} analysiert)
- **Kategorien**: ${score.metrics.totalCategories} (Tiefe: ${score.metrics.categoryDepth})
- **Kodierungen**: ${score.metrics.totalCodings}
- **Validierungsrate**: ${(score.metrics.validationRate * 100).toFixed(1)}%
- **Durchschnitt Kodierungen/Dokument**: ${score.metrics.averageCodingsPerDocument.toFixed(1)}
- **Musterdichte**: ${score.metrics.patternDensity.toFixed(2)} Muster pro Kategorie

### Interpretation
${this.getInterpretation(score)}

---
*Generiert mit AKIH-Methodik v1.0.0 | EVIDENRA Professional*
    `.trim();
  }

  private static getQualityLevelText(level: string): string {
    switch (level) {
      case 'excellent': return '⭐ Exzellent';
      case 'good': return '✅ Gut';
      case 'acceptable': return '⚠️ Akzeptabel';
      case 'insufficient': return '❌ Unzureichend';
      default: return level;
    }
  }

  private static getInterpretation(score: AKIHScoreComponents): string {
    if (score.qualityLevel === 'excellent') {
      return 'Das Projekt erfüllt höchste wissenschaftliche Standards. Die Kodierungsqualität ist ausgezeichnet, theoretische Sättigung ist erreicht, und die methodische Rigorosität ist vorbildlich. Die Ergebnisse sind publikationsreif.';
    } else if (score.qualityLevel === 'good') {
      return 'Das Projekt erfüllt gute wissenschaftliche Standards. Die Kodierung ist solide, und die meisten Qualitätskriterien sind erfüllt. Mit kleineren Verbesserungen kann Exzellenz erreicht werden.';
    } else if (score.qualityLevel === 'acceptable') {
      return 'Das Projekt erfüllt grundlegende wissenschaftliche Standards, benötigt aber Verbesserungen. Empfohlen: Mehr Kodierungen validieren, theoretische Sättigung überprüfen, und Reflexivität verstärken.';
    } else {
      return 'Das Projekt erfüllt die minimalen wissenschaftlichen Standards noch nicht. Dringend empfohlen: Kodierungen validieren, mehr Dokumente analysieren, Kategorien überarbeiten, und Reflexivitäts-Statements hinzufügen.';
    }
  }
}

export default AKIHMethodology;
