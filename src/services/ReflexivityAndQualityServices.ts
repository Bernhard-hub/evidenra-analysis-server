// src/services/ReflexivityAndQualityServices.ts
// Services für Reflexivität, Sättigung und Gütekriterien

import {
  ReflexivityStatement,
  SaturationAnalysis,
  QualityCriteriaReport,
  AuditTrailEntry
} from '../types/ResearchTypes';

// ============================================================================
// 4. REFLEXIVITY SERVICE (nach Lincoln & Guba, 1985; Charmaz, 2014)
// ============================================================================

export class ReflexivityService {
  /**
   * Erstellt eine Reflexivitäts-Aussage
   */
  static createStatement(data: Partial<ReflexivityStatement>): ReflexivityStatement {
    return {
      id: `refl_${Date.now()}`,
      timestamp: new Date(),
      researcherBackground: data.researcherBackground || '',
      theoreticalPerspective: data.theoreticalPerspective || '',
      epistemologicalStance: data.epistemologicalStance || 'constructivist',
      acknowledgedBiases: data.acknowledgedBiases || [],
      methodologicalDecisions: data.methodologicalDecisions || [],
      influenceOnInterpretation: data.influenceOnInterpretation || '',
      relationshipToParticipants: data.relationshipToParticipants,
      challengesToAssumptions: data.challengesToAssumptions || [],
      learningPoints: data.learningPoints || []
    };
  }

  /**
   * Fügt eine methodische Entscheidung hinzu
   */
  static addMethodologicalDecision(
    statement: ReflexivityStatement,
    decision: string,
    rationale: string,
    alternatives: string
  ): ReflexivityStatement {
    return {
      ...statement,
      methodologicalDecisions: [
        ...statement.methodologicalDecisions,
        {
          decision,
          rationale,
          alternatives,
          timestamp: new Date()
        }
      ]
    };
  }

  /**
   * Bewertet Reflexivitäts-Level (0-100)
   */
  static assessReflexivityLevel(statement: ReflexivityStatement): {
    score: number;
    strengths: string[];
    gaps: string[];
  } {
    const scores = {
      background: statement.researcherBackground.length > 100 ? 20 : 0,
      theoretical: statement.theoreticalPerspective.length > 100 ? 20 : 0,
      biases: statement.acknowledgedBiases.length >= 3 ? 20 : statement.acknowledgedBiases.length * 6,
      decisions: Math.min(20, statement.methodologicalDecisions.length * 4),
      influence: statement.influenceOnInterpretation.length > 100 ? 20 : 0
    };

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    const strengths: string[] = [];
    const gaps: string[] = [];

    if (scores.background === 20) strengths.push('Klare Forscher-Positionierung');
    else gaps.push('Detailliertere Forscher-Hintergrund Beschreibung benötigt');

    if (scores.theoretical === 20) strengths.push('Theoretische Perspektive gut dokumentiert');
    else gaps.push('Theoretische Perspektive ausführlicher darlegen');

    if (scores.biases >= 18) strengths.push('Umfassendes Bias-Bewusstsein');
    else gaps.push('Mehr eigene Biases explizit benennen (mind. 3)');

    if (scores.decisions >= 16) strengths.push('Methodische Entscheidungen gut dokumentiert');
    else gaps.push('Methodische Entscheidungen ausführlicher begründen');

    if (scores.influence === 20) strengths.push('Einfluss auf Interpretation reflektiert');
    else gaps.push('Einfluss der eigenen Perspektive auf Interpretation detaillierter beschreiben');

    return { score: totalScore, strengths, gaps };
  }

  /**
   * Generiert Reflexivitäts-Statement für Publikation
   */
  static generatePublicationStatement(statement: ReflexivityStatement): string {
    return `
## Forscher-Positionierung und Reflexivität

### Hintergrund des Forschenden
${statement.researcherBackground}

### Theoretische Perspektive
${statement.theoreticalPerspective}

### Epistemologische Grundhaltung
Dieser Forschung liegt ein **${statement.epistemologicalStance === 'constructivist' ? 'konstruktivistisches' :
      statement.epistemologicalStance === 'critical' ? 'kritisches' :
        statement.epistemologicalStance === 'positivist' ? 'positivistisches' : 'pragmatistisches'}** Paradigma zugrunde.

### Bias-Bewusstsein
Die folgenden potenziellen Voreingenommenheiten wurden identifiziert und reflektiert:

${statement.acknowledgedBiases.map((b, i) => `
${i + 1}. **${b.bias}**
   - *Potentieller Einfluss:* ${b.impact}
   - *Maßnahmen zur Minimierung:* ${b.mitigation}
`).join('\n')}

### Einfluss auf Interpretation
${statement.influenceOnInterpretation}

${statement.relationshipToParticipants ? `
### Beziehung zu Teilnehmenden
${statement.relationshipToParticipants}
` : ''}

### Methodische Entscheidungen
${statement.methodologicalDecisions.map((d, i) => `
${i + 1}. **${d.decision}** (${d.timestamp.toLocaleDateString()})
   - *Begründung:* ${d.rationale}
   - *Alternativen erwogen:* ${d.alternatives}
`).join('\n')}

### Herausforderungen und Lernen
${statement.challengesToAssumptions.length > 0 ? `
**Herausforderungen an Vorannahmen:**
${statement.challengesToAssumptions.map(c => `- ${c}`).join('\n')}
` : ''}

${statement.learningPoints.length > 0 ? `
**Lernpunkte im Forschungsprozess:**
${statement.learningPoints.map(l => `- ${l}`).join('\n')}
` : ''}
    `.trim();
  }
}

// ============================================================================
// 5. SATURATION ANALYSIS SERVICE (nach Glaser & Strauss, 1967)
// ============================================================================

export class SaturationAnalysisService {
  /**
   * Berechnet theoretische Sättigung
   */
  static analyzeSaturation(
    categories: any[],
    codings: any[],
    iterations: { iteration: number; timestamp: Date; newConcepts: number }[]
  ): SaturationAnalysis {
    const latestIteration = Math.max(...iterations.map(i => i.iteration), 0);
    const totalConcepts = categories.length;

    // Berechne neue Konzepte in letzten 3 Iterationen
    const recentIterations = iterations.slice(-3);
    const recentNewConcepts = recentIterations.reduce((sum, i) => sum + i.newConcepts, 0);
    const averageNewConcepts = recentNewConcepts / Math.max(1, recentIterations.length);

    // Sättigungs-Score: Je weniger neue Konzepte, desto höher
    const saturationScore = Math.max(0, Math.min(1, 1 - (averageNewConcepts / 5)));

    // Konvergenz-Rate: Wie schnell nimmt Zahl neuer Konzepte ab?
    const convergenceRate = this.calculateConvergenceRate(iterations);

    // Kategorien-Sättigung analysieren
    const categoriesPerCoding = new Map<string, number>();
    codings.forEach((c: any) => {
      c.categories?.forEach((cat: string) => {
        categoriesPerCoding.set(cat, (categoriesPerCoding.get(cat) || 0) + 1);
      });
    });

    const wellSaturatedCategories = categories.filter(
      c => (categoriesPerCoding.get(c.id) || 0) >= 5
    ).length;

    const needingMoreData = categories
      .filter(c => (categoriesPerCoding.get(c.id) || 0) < 3)
      .map(c => c.name);

    // Empfehlung
    let recommendation: SaturationAnalysis['recommendation'];
    let reasonForRecommendation: string;

    if (saturationScore >= 0.9 && needingMoreData.length === 0) {
      recommendation = 'saturation_reached';
      reasonForRecommendation = 'Theoretische Sättigung erreicht: Keine signifikanten neuen Konzepte mehr';
    } else if (saturationScore >= 0.7) {
      recommendation = 'approaching_saturation';
      reasonForRecommendation = `Sättigung wird erreicht, aber ${needingMoreData.length} Kategorien benötigen mehr Daten`;
    } else {
      recommendation = 'continue_coding';
      reasonForRecommendation = `Noch ${averageNewConcepts.toFixed(1)} neue Konzepte pro Iteration - weiter kodieren`;
    }

    return {
      iterationNumber: latestIteration + 1,
      timestamp: new Date(),
      newConceptsFound: iterations[iterations.length - 1]?.newConcepts || 0,
      totalConceptsNow: totalConcepts,
      saturationScore,
      convergenceRate,
      categoriesAnalyzed: categories.length,
      categoriesSaturated: wellSaturatedCategories,
      categoriesNeedingMoreData: needingMoreData,
      recommendation,
      reasonForRecommendation,
      saturationCurve: iterations.map(i => ({
        iteration: i.iteration,
        newConcepts: i.newConcepts
      }))
    };
  }

  private static calculateConvergenceRate(
    iterations: { iteration: number; newConcepts: number }[]
  ): number {
    if (iterations.length < 3) return 0;

    const recent = iterations.slice(-3);
    const slopes: number[] = [];

    for (let i = 1; i < recent.length; i++) {
      const slope = recent[i].newConcepts - recent[i - 1].newConcepts;
      slopes.push(slope);
    }

    const avgSlope = slopes.reduce((a, b) => a + b, 0) / slopes.length;
    return Math.max(0, -avgSlope); // Negative Steigung = Konvergenz
  }

  /**
   * Visualisiert Sättigungskurve (ASCII)
   */
  static visualizeSaturationCurve(analysis: SaturationAnalysis): string {
    const maxConcepts = Math.max(...analysis.saturationCurve.map(p => p.newConcepts), 10);
    const scale = 20 / maxConcepts;

    let chart = '\n# Sättigungskurve (Neue Konzepte pro Iteration)\n\n';

    analysis.saturationCurve.forEach(point => {
      const barLength = Math.round(point.newConcepts * scale);
      const bar = '█'.repeat(barLength);
      chart += `Iteration ${point.iteration}: ${bar} (${point.newConcepts})\n`;
    });

    chart += `\n→ Sättigung: ${(analysis.saturationScore * 100).toFixed(0)}%\n`;
    chart += `→ Empfehlung: ${analysis.recommendation === 'saturation_reached' ? '✅ SÄTTIGUNG ERREICHT' :
      analysis.recommendation === 'approaching_saturation' ? '⚠️ SÄTTIGUNG NAH' :
        '⏳ WEITER KODIEREN'}\n`;

    return chart;
  }
}

// ============================================================================
// 6. QUALITY CRITERIA SERVICE (nach Lincoln & Guba, 1985)
// ============================================================================

export class QualityCriteriaService {
  /**
   * Generiert vollständigen Gütekriterien-Report
   */
  static generateReport(project: any): QualityCriteriaReport {
    const credibility = this.assessCredibility(project);
    const transferability = this.assessTransferability(project);
    const dependability = this.assessDependability(project);
    const confirmability = this.assessConfirmability(project);
    const reflexivity = this.assessReflexivity(project);

    const overallScore = (
      credibility.score * 0.25 +
      transferability.score * 0.2 +
      dependability.score * 0.2 +
      confirmability.score * 0.2 +
      reflexivity.score * 0.15
    );

    const criticalIssues: string[] = [];
    if (credibility.score < 50) criticalIssues.push('Glaubwürdigkeit unzureichend');
    if (transferability.score < 40) criticalIssues.push('Übertragbarkeit schlecht dokumentiert');
    if (dependability.score < 50) criticalIssues.push('Verlässlichkeit gefährdet');
    if (confirmability.score < 50) criticalIssues.push('Bestätigbarkeit zweifelhaft');
    if (reflexivity.score < 40) criticalIssues.push('Reflexivität unzureichend');

    return {
      projectId: project.id || 'unknown',
      generatedAt: new Date(),
      credibility,
      transferability,
      dependability,
      confirmability,
      reflexivity,
      overallQualityScore: overallScore,
      passesMinimumStandards: overallScore >= 60 && criticalIssues.length === 0,
      readyForPublication: overallScore >= 75 && criticalIssues.length === 0,
      criticalIssues
    };
  }

  private static assessCredibility(project: any): QualityCriteriaReport['credibility'] {
    const factors = {
      prolongedEngagement: (project.documents?.length || 0) >= 10,
      persistentObservation: (project.codings?.length || 0) >= 20,
      triangulation: {
        dataTriangulation: (project.documents?.length || 0) >= 5,
        investigatorTriangulation: false, // TODO: Multi-user support
        theoryTriangulation: (project.memos?.filter((m: any) => m.type === 'theoretical').length || 0) >= 3,
        methodologicalTriangulation: false // TODO: Mixed methods
      },
      peerDebriefing: false, // TODO: Peer review feature
      negativeCaseAnalysis: (project.memos?.filter((m: any) =>
        m.content.toLowerCase().includes('widerspruch') ||
        m.content.toLowerCase().includes('gegenbeweis')
      ).length || 0) > 0,
      memberChecking: (project.memberCheckingSessions?.length || 0) > 0
    };

    let score = 0;
    const recommendations: string[] = [];

    if (factors.prolongedEngagement) score += 15;
    else recommendations.push('Mehr Dokumente analysieren (mind. 10)');

    if (factors.persistentObservation) score += 15;
    else recommendations.push('Intensivere Kodierung (mind. 20 Codings)');

    if (factors.triangulation.dataTriangulation) score += 10;
    if (factors.triangulation.theoryTriangulation) score += 10;
    else recommendations.push('Theoretische Memos verfassen (mind. 3)');

    if (factors.negativeCaseAnalysis) score += 15;
    else recommendations.push('Negative Case Analysis durchführen (widersprüchliche Fälle suchen)');

    if (factors.memberChecking) score += 35;
    else recommendations.push('Member Checking durchführen (Teilnehmende validieren lassen)');

    return {
      score,
      factors,
      recommendations
    };
  }

  private static assessTransferability(project: any): QualityCriteriaReport['transferability'] {
    const contextDescription = project.reflexivityStatements?.[0]?.researcherBackground?.length || 0;
    const samplingRationale = project.reflexivityStatements?.[0]?.methodologicalDecisions?.find(
      (d: any) => d.decision.toLowerCase().includes('sampling')
    )?.rationale || '';

    const thickDescriptionQuality = Math.min(100, contextDescription / 3);
    const contextDocumentation = samplingRationale.length > 0 ? 80 : 30;
    const boundaryConditions = project.memos?.filter((m: any) =>
      m.content.toLowerCase().includes('limitation') ||
      m.content.toLowerCase().includes('grenze')
    ).map((m: any) => m.title) || [];

    const score = (thickDescriptionQuality + contextDocumentation) / 2;

    return {
      score,
      thickDescriptionQuality,
      contextDocumentation,
      samplingRationale,
      boundaryConditions
    };
  }

  private static assessDependability(project: any): QualityCriteriaReport['dependability'] {
    const auditTrailLength = project.auditTrail?.length || 0;
    const methodologicalMemos = project.memos?.filter((m: any) => m.type === 'methodological').length || 0;

    const auditTrailCompleteness = Math.min(100, auditTrailLength * 2);
    const methodologicalCoherence = Math.min(100, methodologicalMemos * 20);
    const decisionDocumentation = project.reflexivityStatements?.[0]?.methodologicalDecisions?.length || 0;

    const score = (auditTrailCompleteness + methodologicalCoherence + Math.min(100, decisionDocumentation * 10)) / 3;

    return {
      score,
      auditTrailCompleteness,
      methodologicalCoherence,
      decisionDocumentation: Math.min(100, decisionDocumentation * 10)
    };
  }

  private static assessConfirmability(project: any): QualityCriteriaReport['confirmability'] {
    const codingsWithQuotes = project.codings?.filter((c: any) => c.quote?.length > 0).length || 0;
    const totalCodings = project.codings?.length || 1;

    const dataGrounding = (codingsWithQuotes / totalCodings) * 100;
    const reflexivityLevel = project.reflexivityStatements?.length > 0 ? 80 : 20;
    const biasAcknowledgment = project.reflexivityStatements?.[0]?.acknowledgedBiases?.length > 0 ? 80 : 20;

    const score = (dataGrounding + reflexivityLevel + biasAcknowledgment) / 3;

    return {
      score,
      dataGrounding,
      reflexivityLevel,
      biasAcknowledgment,
      confirmationAudit: false // TODO: External audit feature
    };
  }

  private static assessReflexivity(project: any): QualityCriteriaReport['reflexivity'] {
    const hasStatement = project.reflexivityStatements?.length > 0;
    const statement = project.reflexivityStatements?.[0];

    const positioningClarity = hasStatement && statement?.researcherBackground?.length > 100 ? 80 : 20;
    const biasTransparency = hasStatement && statement?.acknowledgedBiases?.length >= 3 ? 80 : 20;
    const methodologicalReflection = hasStatement && statement?.methodologicalDecisions?.length >= 3 ? 80 : 20;

    const score = (positioningClarity + biasTransparency + methodologicalReflection) / 3;

    return {
      score,
      positioningClarity,
      biasTransparency,
      methodologicalReflection
    };
  }

  /**
   * Generiert Publication-Ready Report
   */
  static generatePublicationReport(report: QualityCriteriaReport): string {
    return `
# Qualitätskriterien-Bericht (nach Lincoln & Guba, 1985)

**Projekt-ID:** ${report.projectId}
**Erstellt am:** ${report.generatedAt.toLocaleDateString()}

---

## Gesamtbewertung: ${report.overallQualityScore.toFixed(0)}/100

${report.passesMinimumStandards
        ? '✅ **Minimum-Standards erfüllt**'
        : '❌ **Minimum-Standards NICHT erfüllt**'}

${report.readyForPublication
        ? '✅ **Bereit für Publikation**'
        : '⚠️ **Noch nicht publikationsreif**'}

${report.criticalIssues.length > 0 ? `
### 🔴 Kritische Probleme:
${report.criticalIssues.map(i => `- ${i}`).join('\n')}
` : ''}

---

## 1. Credibility (Glaubwürdigkeit): ${report.credibility.score}/100

${report.credibility.factors.prolongedEngagement ? '✅' : '❌'} Prolonged Engagement
${report.credibility.factors.persistentObservation ? '✅' : '❌'} Persistent Observation
${report.credibility.factors.triangulation.dataTriangulation ? '✅' : '❌'} Data Triangulation
${report.credibility.factors.triangulation.theoryTriangulation ? '✅' : '❌'} Theory Triangulation
${report.credibility.factors.negativeCaseAnalysis ? '✅' : '❌'} Negative Case Analysis
${report.credibility.factors.memberChecking ? '✅' : '❌'} Member Checking

${report.credibility.recommendations.length > 0 ? `
**Empfehlungen:**
${report.credibility.recommendations.map(r => `- ${r}`).join('\n')}
` : ''}

---

## 2. Transferability (Übertragbarkeit): ${report.transferability.score.toFixed(0)}/100

- **Thick Description Quality:** ${report.transferability.thickDescriptionQuality.toFixed(0)}/100
- **Context Documentation:** ${report.transferability.contextDocumentation}/100

${report.transferability.boundaryConditions.length > 0 ? `
**Identifizierte Grenzen:**
${report.transferability.boundaryConditions.map(b => `- ${b}`).join('\n')}
` : '⚠️ Keine Boundary Conditions dokumentiert'}

---

## 3. Dependability (Verlässlichkeit): ${report.dependability.score.toFixed(0)}/100

- **Audit Trail Completeness:** ${report.dependability.auditTrailCompleteness.toFixed(0)}/100
- **Methodological Coherence:** ${report.dependability.methodologicalCoherence.toFixed(0)}/100
- **Decision Documentation:** ${report.dependability.decisionDocumentation.toFixed(0)}/100

---

## 4. Confirmability (Bestätigbarkeit): ${report.confirmability.score.toFixed(0)}/100

- **Data Grounding:** ${report.confirmability.dataGrounding.toFixed(0)}/100
- **Reflexivity Level:** ${report.confirmability.reflexivityLevel}/100
- **Bias Acknowledgment:** ${report.confirmability.biasAcknowledgment}/100

---

## 5. Reflexivity (Reflexivität): ${report.reflexivity.score.toFixed(0)}/100

- **Positioning Clarity:** ${report.reflexivity.positioningClarity}/100
- **Bias Transparency:** ${report.reflexivity.biasTransparency}/100
- **Methodological Reflection:** ${report.reflexivity.methodologicalReflection}/100

---

## Zusammenfassung

Diese Studie ${report.passesMinimumStandards
        ? 'erfüllt die grundlegenden Qualitätskriterien nach Lincoln & Guba (1985)'
        : 'erfüllt NICHT die minimalen Qualitätskriterien und benötigt Nachbesserung'}.

${report.readyForPublication
        ? 'Die Studie ist aus methodischer Sicht publikationsreif.'
        : `Die folgenden Aspekte sollten vor Publikation adressiert werden: ${report.criticalIssues.join(', ')}.`}

**Empfohlene Literatur zur Qualitätssicherung:**
- Lincoln, Y. S., & Guba, E. G. (1985). *Naturalistic Inquiry*. SAGE.
- Charmaz, K. (2014). *Constructing Grounded Theory* (2nd ed.). SAGE.
- Tracy, S. J. (2010). Qualitative Quality: Eight "Big-Tent" Criteria for Excellent Qualitative Research. *Qualitative Inquiry*, 16(10), 837-851.
    `.trim();
  }
}

// Exportiere alle Services
export const QualityServices = {
  Reflexivity: ReflexivityService,
  Saturation: SaturationAnalysisService,
  QualityCriteria: QualityCriteriaService
};

export default QualityServices;
